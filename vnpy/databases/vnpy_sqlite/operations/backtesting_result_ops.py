from datetime import datetime
from typing import List, Optional
import json

from vnpy.trader.constant import Exchange, Interval
from vnpy.trader.database import convert_tz

from ..models import DbBacktestingResult
from .base import BaseOperations


class BacktestingResultOperations(BaseOperations):
    """回测结果数据库操作类"""

    def save_backtesting_result(
        self,
        class_name: str,
        vt_symbol: str,
        interval: str,
        start: datetime,
        end: datetime,
        rate: float,
        slippage: float,
        size: int,
        pricetick: float,
        capital: int,
        setting: dict,
        total_return: Optional[float] = None,
        annual_return: Optional[float] = None,
        max_drawdown: Optional[float] = None,
        sharpe_ratio: Optional[float] = None,
        total_trades: Optional[int] = None,
        win_rate: Optional[float] = None,
        status: str = "inited"
    ) -> int:
        """
        保存回测结果到数据库
        返回新创建记录的ID
        """
        # 转换时区
        start = convert_tz(start)
        end = convert_tz(end)

        settingJSON = json.dumps(setting)
        
        # 创建回测结果记录
        result = DbBacktestingResult.create(
            class_name=class_name,
            vt_symbol=vt_symbol,
            interval=interval,
            start=start,
            end=end,
            rate=rate,
            slippage=slippage,
            size=size,
            pricetick=pricetick,
            capital=capital,
            setting=settingJSON,
            total_return=total_return,
            annual_return=annual_return,
            max_drawdown=max_drawdown,
            sharpe_ratio=sharpe_ratio,
            total_trades=total_trades,
            win_rate=win_rate,
            status=status
        )
        
        return result.id

    def get_backtesting_results(
        self,
        class_name: Optional[str] = None,
        vt_symbol: Optional[str] = None,
        interval: Optional[str] = None,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[dict]:
        """
        查询回测结果列表
        """
        query = DbBacktestingResult.select()
        
        # 添加过滤条件
        if class_name:
            query = query.where(DbBacktestingResult.class_name == class_name)
        if vt_symbol:
            query = query.where(DbBacktestingResult.vt_symbol == vt_symbol)
        if interval:
            query = query.where(DbBacktestingResult.interval == interval)
            
        # 按创建时间倒序排列
        query = query.order_by(DbBacktestingResult.created_time.desc())
        
        # 分页
        if limit:
            query = query.limit(limit).offset(offset)
            
        results = []
        for result in query:
            result_dict = {
                'id': result.id,
                'class_name': result.class_name,
                'vt_symbol': result.vt_symbol,
                'interval': result.interval,
                'start': result.start,
                'end': result.end,
                'rate': result.rate,
                'slippage': result.slippage,
                'size': result.size,
                'pricetick': result.pricetick,
                'capital': result.capital,
                'setting': json.loads(result.setting) if result.setting else {},
                'status': result.status,
                'total_return': result.total_return,
                'annual_return': result.annual_return,
                'max_drawdown': result.max_drawdown,
                'sharpe_ratio': result.sharpe_ratio,
                'total_trades': result.total_trades,
                'win_rate': result.win_rate,
                'created_time': result.created_time,
                'updated_time': result.updated_time
            }
            results.append(result_dict)
            
        return results

    def get_backtesting_result_by_id(self, result_id: int) -> Optional[dict]:
        """
        根据ID获取单个回测结果
        """
        try:
            result = DbBacktestingResult.get_by_id(result_id)
            return {
                'id': result.id,
                'class_name': result.class_name,
                'vt_symbol': result.vt_symbol,
                'interval': result.interval,
                'start': result.start,
                'end': result.end,
                'rate': result.rate,
                'slippage': result.slippage,
                'size': result.size,
                'pricetick': result.pricetick,
                'capital': result.capital,
                'setting': json.loads(result.setting) if result.setting else {},
                'status': result.status,
                'total_return': result.total_return,
                'annual_return': result.annual_return,
                'max_drawdown': result.max_drawdown,
                'sharpe_ratio': result.sharpe_ratio,
                'total_trades': result.total_trades,
                'win_rate': result.win_rate,
                'created_time': result.created_time,
                'updated_time': result.updated_time
            }
        except DbBacktestingResult.DoesNotExist:
            return None

    def update_backtesting_result(
        self,
        result_id: int,
        **kwargs
    ) -> bool:
        """
        更新回测结果
        """
        try:
            result = DbBacktestingResult.get_by_id(result_id)
            
            # 更新字段
            for key, value in kwargs.items():
                if hasattr(result, key):
                    if key == 'setting' and isinstance(value, dict):
                        setattr(result, key, json.dumps(value))
                    elif key in ['start', 'end'] and isinstance(value, datetime):
                        setattr(result, key, convert_tz(value))
                    else:
                        setattr(result, key, value)
            
            # 更新时间戳
            result.updated_time = datetime.now()
            result.save()
            
            return True
        except DbBacktestingResult.DoesNotExist:
            return False

    def delete_backtesting_result(self, result_id: int) -> bool:
        """
        删除回测结果
        """
        try:
            result = DbBacktestingResult.get_by_id(result_id)
            result.delete_instance()
            return True
        except DbBacktestingResult.DoesNotExist:
            return False

    def delete_backtesting_results_by_filter(
        self,
        class_name: Optional[str] = None,
        vt_symbol: Optional[str] = None,
        interval: Optional[str] = None
    ) -> int:
        """
        根据条件批量删除回测结果
        返回删除的记录数
        """
        query = DbBacktestingResult.delete()
        
        # 添加过滤条件
        if class_name:
            query = query.where(DbBacktestingResult.class_name == class_name)
        if vt_symbol:
            query = query.where(DbBacktestingResult.vt_symbol == vt_symbol)
        if interval:
            query = query.where(DbBacktestingResult.interval == interval)
            
        return query.execute()

    def count_backtesting_results(
        self,
        class_name: Optional[str] = None,
        vt_symbol: Optional[str] = None,
        interval: Optional[str] = None
    ) -> int:
        """
        统计回测结果数量
        """
        query = DbBacktestingResult.select()
        
        # 添加过滤条件
        if class_name:
            query = query.where(DbBacktestingResult.class_name == class_name)
        if vt_symbol:
            query = query.where(DbBacktestingResult.vt_symbol == vt_symbol)
        if interval:
            query = query.where(DbBacktestingResult.interval == interval)
            
        return query.count()