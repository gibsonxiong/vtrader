from datetime import datetime
from typing import List

from vnpy.trader.constant import Exchange, Interval
from vnpy.trader.object import BarData, TickData
from vnpy.trader.database import BaseDatabase, BarOverview, TickOverview

from .config import db
from .models import DbBarData, DbTickData, DbBarOverview, DbTickOverview, DbBacktestingResult, DbBacktestTrade
from .operations import BarOperations, TickOperations, BacktestingResultOperations, BacktestTradeOperations

class SqliteDatabase(BaseDatabase):
    """SQLite数据库接口"""

    def __init__(self) -> None:
        """
        Constructor
        """
        self.db = db
        self.db.connect()
        # self.db.drop_tables([DbBacktestingResult, DbBacktestTrade])
        self.db.create_tables([DbBarData, DbTickData, DbBarOverview, DbTickOverview, DbBacktestingResult, DbBacktestTrade])
        
        # Initialize operation classes
        self.bar_ops = BarOperations(self.db)
        self.tick_ops = TickOperations(self.db)
        self.backtesting_result_ops = BacktestingResultOperations(self.db)
        self.backtest_trade_ops = BacktestTradeOperations(self.db)

    def save_bar_data(self, bars: List[BarData]) -> bool:
        """
        Save bar data into database.
        """
        return self.bar_ops.save_bar_data(bars)

    def save_tick_data(self, ticks: List[TickData]) -> bool:
        """
        Save tick data into database.
        """
        return self.tick_ops.save_tick_data(ticks)

    def load_bar_data(
        self,
        symbol: str,
        exchange: Exchange,
        interval: Interval,
        start: datetime,
        end: datetime
    ) -> List[BarData]:
        """
        Load bar data from database.
        """
        return self.bar_ops.load_bar_data(symbol, exchange, interval, start, end)

    def load_tick_data(
        self,
        symbol: str,
        exchange: Exchange,
        start: datetime,
        end: datetime
    ) -> List[TickData]:
        """
        Load tick data from database.
        """
        return self.tick_ops.load_tick_data(symbol, exchange, start, end)

    def delete_bar_data(
        self,
        symbol: str,
        exchange: Exchange,
        interval: Interval
    ) -> int:
        """
        Delete all bar data with given symbol + exchange + interval.
        """
        return self.bar_ops.delete_bar_data(symbol, exchange, interval)

    def delete_tick_data(
        self,
        symbol: str,
        exchange: Exchange
    ) -> int:
        """
        Delete all tick data with given symbol + exchange.
        """
        return self.tick_ops.delete_tick_data(symbol, exchange)

    def get_bar_overview(self) -> List[BarOverview]:
        """
        Return data available in database.
        """
        return self.bar_ops.get_bar_overview()

    def get_tick_overview(self) -> List[TickOverview]:
        """
        Return tick data available in database.
        """
        return self.tick_ops.get_tick_overview()

    # 回测结果相关方法
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
        **kwargs
    ) -> int:
        """
        保存回测结果到数据库
        """
        return self.backtesting_result_ops.save_backtesting_result(
            class_name, vt_symbol, interval, start, end,
            rate, slippage, size, pricetick, capital, setting, **kwargs
        )

    def get_backtesting_results(
        self,
        class_name: str = None,
        vt_symbol: str = None,
        interval: str = None,
        limit: int = None,
        offset: int = 0
    ) -> List[dict]:
        """
        查询回测结果列表
        """
        return self.backtesting_result_ops.get_backtesting_results(
            class_name, vt_symbol, interval, limit, offset
        )

    def get_backtesting_result_by_id(self, result_id: int) -> dict:
        """
        根据ID获取单个回测结果
        """
        return self.backtesting_result_ops.get_backtesting_result_by_id(result_id)

    def update_backtesting_result(self, result_id: int, **kwargs) -> bool:
        """
        更新回测结果
        """
        return self.backtesting_result_ops.update_backtesting_result(result_id, **kwargs)

    def delete_backtesting_result(self, result_id: int) -> bool:
        """
        删除回测结果
        """
        return self.backtesting_result_ops.delete_backtesting_result(result_id)

    def delete_backtesting_results_by_filter(
        self,
        class_name: str = None,
        vt_symbol: str = None,
        interval: str = None
    ) -> int:
        """
        根据条件批量删除回测结果
        """
        return self.backtesting_result_ops.delete_backtesting_results_by_filter(
            class_name, vt_symbol, interval
        )

    def count_backtesting_results(
        self,
        class_name: str = None,
        vt_symbol: str = None,
        interval: str = None
    ) -> int:
        """
        统计回测结果数量
        """
        return self.backtesting_result_ops.count_backtesting_results(
            class_name, vt_symbol, interval
        )

    # 回测交易记录相关方法
    def save_backtest_trade(self, backtest_result_id: int, trade) -> int:
        """
        保存回测交易记录到数据库
        """
        return self.backtest_trade_ops.save_backtest_trade(backtest_result_id, trade)

    def save_backtest_trades(self, backtest_result_id: int, trades: List) -> List[int]:
        """
        批量保存回测交易记录到数据库
        """
        return self.backtest_trade_ops.save_backtest_trades(backtest_result_id, trades)

    def get_backtest_trades(
        self,
        backtest_result_id: int,
        limit: int = None,
        offset: int = 0
    ) -> List[dict]:
        """
        查询指定回测结果的交易记录列表
        """
        return self.backtest_trade_ops.get_backtest_trades(backtest_result_id, limit, offset)

    def get_backtest_trade_by_id(self, trade_id: int) -> dict:
        """
        根据ID获取单个回测交易记录
        """
        return self.backtest_trade_ops.get_backtest_trade_by_id(trade_id)

    def delete_backtest_trades_by_result_id(self, backtest_result_id: int) -> int:
        """
        删除指定回测结果的所有交易记录
        """
        return self.backtest_trade_ops.delete_backtest_trades_by_result_id(backtest_result_id)

    def delete_backtest_trade(self, trade_id: int) -> bool:
        """
        删除单个回测交易记录
        """
        return self.backtest_trade_ops.delete_backtest_trade(trade_id)

    def get_backtest_trades_count(self, backtest_result_id: int) -> int:
        """
        获取指定回测结果的交易记录总数
        """
        return self.backtest_trade_ops.get_backtest_trades_count(backtest_result_id)
