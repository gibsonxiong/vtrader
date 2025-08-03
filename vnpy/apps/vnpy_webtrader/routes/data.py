"""
数据服务模块
"""
from fastapi import APIRouter
from vnpy.trader.constant import Exchange, Interval

router = APIRouter()

@router.get("/bars/{vt_symbol}")
def get_bars(vt_symbol: str, days: int = 10):
    """
    获取K线数据
    :param vt_symbol: 合约代码
    :return:
    """
    bars = database_manager.load_bar_data(
        vt_symbol,
        Exchange.SSE,
        Interval.MINUTE,
        datetime(2020, 1, 1),
        datetime.now()
    )
    return bars