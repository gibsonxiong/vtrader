"""
数据服务模块
"""
from fastapi import APIRouter
from datetime import datetime
from ..schema import BacktestingRequestModel
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status, Depends, Query

router = APIRouter()

"""
获取策略列表
"""
@router.get("/strategy_class")
def get_strategy_class() -> list:
    """获取策略列表"""
    return rpc_client.backtesting_get_strategy_class_names()

"""
获取策略默认配置
"""
@router.get("/strategy_class/{class_name}")
def get_strategy_class(class_name: str) -> dict:
    """获取策略默认配置"""
    return rpc_client.backtesting_get_default_setting(class_name)

@router.post("/start")
def start_backtesting_api(model: BacktestingRequestModel) -> dict:
    """启动CTA策略回测"""
    try:
        start = datetime.strptime(model.start, "%Y-%m-%d")
        end = datetime.strptime(model.end, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Please use YYYY-MM-DD.",
        )

    result_id: int = rpc_client.backtesting_start(
        class_name=model.class_name,
        vt_symbol=model.vt_symbol,
        interval=model.interval,
        start=start,
        end=end,
        rate=model.rate,
        slippage=model.slippage,
        size=model.size,
        pricetick=model.pricetick,
        capital=model.capital,
        setting=model.setting
    )
    if result_id:
        return {"result_id": result_id}
    else:
        # Attempt to get the log if possible, or a generic message
        # This part might need adjustment based on how logs are exposed by BacktesterEngine
        return {"status": "Failed to start backtesting, a task might already be running."}


@router.get("/results")
def get_backtesting_results(
    class_name: str | None = Query(None, description="策略类名"),
    vt_symbol: str | None = Query(None, description="交易品种"),
    interval: str | None = Query(None, description="时间周期"),
    limit: int | None = Query(None, description="返回记录数限制"),
    offset: int = Query(0, description="偏移量")
) -> list:
    """获取回测结果列表"""
    return rpc_client.backtesting_get_results(
        class_name=class_name,
        vt_symbol=vt_symbol,
        interval=interval,
        limit=limit,
        offset=offset
    )


@router.get("/results/{result_id}")
def get_backtesting_result_by_id(
    result_id: int,
) -> dict:
    """根据ID获取单个回测结果"""
    result = rpc_client.backtesting_get_result_by_id(result_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到ID为{result_id}的回测结果"
        )
    return result


@router.delete("/results/{result_id}")
def delete_backtesting_result(
    result_id: int,
) -> dict:
    """删除回测结果"""
    success = rpc_client.backtesting_delete_result(result_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到ID为{result_id}的回测结果或删除失败"
        )
    return {"message": f"成功删除ID为{result_id}的回测结果"}