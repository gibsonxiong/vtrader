from abc import ABC, abstractmethod
from copy import copy
from typing import Any, cast
from collections.abc import Callable

from vnpy.trader.constant import Interval, Direction, Offset
from vnpy.trader.object import BarData, TickData, OrderData, TradeData

from .base import StopOrder, EngineType

class PositionMgr:
    """
    Position manager for strategy.
    """

    def __init__(self) -> None:
        """"""
        self.long_pos: float = 0
        self.long_price: float = 0
        self.long_init_price: float = 0
        self.long_realized_pnl: float = 0
        self.long_win_rate: float = 0
        self.long_win_count: int = 0
        self.long_loss_count: int = 0

        self.short_pos: float = 0
        self.short_price: float = 0
        self.short_init_price: float = 0
        self.short_realized_pnl: float = 0
        self.short_win_rate: float = 0
        self.short_win_count: int = 0
        self.short_loss_count: int = 0
    
    def update_pos(self, trade: TradeData, update_trade = False) -> None:
        """"""
        if not self.check_trade(trade):
            if trade.direction == Direction.LONG:
                raise Exception(f"持仓不足，多仓：{self.long_pos} 无法平仓: {trade.volume}")
            else:
                raise Exception(f"持仓不足，空仓：{self.short_pos} 无法平仓: {trade.volume}")

        if trade.direction == Direction.LONG:
            # 开仓
            if trade.offset == Offset.OPEN:
                # 首次开仓
                if self.long_price == 0:
                    self.long_init_price = trade.price
                    self.long_price = trade.price
                else:
                    self.long_price = (self.long_price * self.long_pos + trade.price * trade.volume) / (self.long_pos + trade.volume)

                self.long_pos += trade.volume
            else:
                # 平仓
                the_long_realized_pnl = (trade.price - self.long_price) * trade.volume
                self.long_pos -= trade.volume
                self.long_realized_pnl += the_long_realized_pnl

                # 记录交易胜利/亏损次数
                if the_long_realized_pnl > 0:
                    self.long_win_count += 1
                else:
                    self.long_loss_count += 1
                # 计算胜率
                if self.long_win_count + self.long_loss_count > 0:
                    self.long_win_rate = self.long_win_count / (self.long_win_count + self.long_loss_count)
                else:
                    self.long_win_rate = 0

                # 更新交易数据
                if update_trade:
                    trade.realized_pnl = the_long_realized_pnl

                # 仓位为0，清空初始价格
                if self.long_pos == 0:
                    self.long_init_price = 0
                    self.long_price = 0
            
        else:
            # 开仓
            if trade.offset == Offset.OPEN:
                # 首次开仓
                if self.short_price == 0:
                    self.short_init_price = trade.price
                    self.short_price = trade.price
                else:
                    self.short_price = (self.short_price * self.short_pos + trade.price * trade.volume) / (self.short_pos + trade.volume)

                self.short_pos += trade.volume
            else:
                # 平仓
                the_short_realized_pnl = (self.short_price - trade.price) * trade.volume
                self.short_pos -= trade.volume
                self.short_realized_pnl += the_short_realized_pnl

                # 记录交易胜利/亏损次数
                if the_short_realized_pnl > 0:
                    self.short_win_count += 1
                else:
                    self.short_loss_count += 1

                # 计算胜率
                if self.short_win_count + self.short_loss_count > 0:
                    self.short_win_rate = self.short_win_count / (self.short_win_count + self.short_loss_count)
                else:
                    self.short_win_rate = 0

                # 更新交易数据
                if update_trade:
                    trade.realized_pnl = the_short_realized_pnl

                # 仓位为0，清空初始价格
                if self.short_pos == 0:
                    self.short_init_price = 0
                    self.short_price = 0
        pass

    def check_trade(self, trade: TradeData) -> bool:

        if trade.offset == Offset.CLOSE:
            if trade.direction == Direction.LONG and self.long_pos < trade.volume:
                if abs(self.long_pos - trade.volume) < 0.00000001:
                    return True
                return False
            elif trade.direction == Direction.SHORT and self.short_pos < trade.volume:
                if abs(self.short_pos - trade.volume) < 0.00000001:
                    return True
                return False
            
        return True
    
    def get_long_pnl(self, price: float) -> float:
        """
        Return long position PnL.
        """
        return (price - self.long_price) * self.long_pos
    
    def get_short_pnl(self, price: float) -> float:
        """
        Return short position PnL.
        """
        return (self.short_price - price) * self.short_pos
    
    def get_long_roi(self, price: float) -> float:
        """
        Return long position ROI.
        """
        if self.long_price == 0:
            return 0
        return  (price - self.long_price) / price
    
    def get_short_roi(self, price: float) -> float:
        """
        Return short position ROI.
        """
        if self.short_price == 0:
            return 0
        return (self.short_price - price) / price





class CtaTemplate(ABC):
    """"""

    author: str = ""
    parameters: list = []
    variables: list = []

    def __init__(
        self,
        cta_engine: Any,
        strategy_name: str,
        vt_symbol: str,
        setting: dict,
    ) -> None:
        """"""
        self.cta_engine: Any = cta_engine
        self.strategy_name: str = strategy_name
        self.vt_symbol: str = vt_symbol

        self.inited: bool = False
        self.trading: bool = False

        self.posMgr: PositionMgr = PositionMgr()

        # Copy a new variables list here to avoid duplicate insert when multiple
        # strategy instances are created with the same strategy class.
        self.variables = copy(self.variables)
        self.variables.insert(0, "inited")
        self.variables.insert(1, "trading")

        self.update_setting(setting)

    def update_setting(self, setting: dict) -> None:
        """
        Update strategy parameter wtih value in setting dict.
        """
        for name in self.parameters:
            if name in setting:
                setattr(self, name, setting[name])

    @classmethod
    def get_class_parameters(cls) -> dict:
        """
        Get default parameters dict of strategy class.
        """
        class_parameters: dict = {}
        for name in cls.parameters:
            class_parameters[name] = getattr(cls, name)
        return class_parameters

    def get_parameters(self) -> dict:
        """
        Get strategy parameters dict.
        """
        strategy_parameters: dict = {}
        for name in self.parameters:
            strategy_parameters[name] = getattr(self, name)
        return strategy_parameters

    def get_variables(self) -> dict:
        """
        Get strategy variables dict.
        """
        strategy_variables: dict = {}
        for name in self.variables:
            strategy_variables[name] = getattr(self, name)
        return strategy_variables

    def get_data(self) -> dict:
        """
        Get strategy data.
        """
        strategy_data: dict = {
            "strategy_name": self.strategy_name,
            "vt_symbol": self.vt_symbol,
            "class_name": self.__class__.__name__,
            "author": self.author,
            "parameters": self.get_parameters(),
            "variables": self.get_variables(),
        }
        return strategy_data

    @abstractmethod
    def on_init(self) -> None:
        """
        Callback when strategy is inited.
        """
        return

    def on_start(self) -> None:
        """
        Callback when strategy is started.
        """
        return

    def on_stop(self) -> None:
        """
        Callback when strategy is stopped.
        """
        return

    def on_tick(self, tick: TickData) -> None:
        """
        Callback of new tick data update.
        """
        return

    def on_bar(self, bar: BarData) -> None:
        """
        Callback of new bar data update.
        """
        return

    def on_trade(self, trade: TradeData) -> None:
        """
        Callback of new trade data update.
        """
        return

    def on_order(self, order: OrderData) -> None:
        """
        Callback of new order data update.
        """
        return

    def on_stop_order(self, stop_order: StopOrder) -> None:
        """
        Callback of stop order update.
        """
        return

    def buy(
        self,
        price: float,
        volume: float,
        stop: bool = False,
        lock: bool = False,
        net: bool = False
    ) -> list:
        """
        Send buy order to open a long position.
        """
        return self.send_order(
            Direction.LONG,
            Offset.OPEN,
            price,
            volume,
            stop,
            lock,
            net
        )

    def sell(
        self,
        price: float,
        volume: float,
        stop: bool = False,
        lock: bool = False,
        net: bool = False
    ) -> list:
        """
        Send sell order to close a long position.
        """
        return self.send_order(
            Direction.LONG,
            Offset.CLOSE,
            price,
            volume,
            stop,
            lock,
            net
        )

    def short(
        self,
        price: float,
        volume: float,
        stop: bool = False,
        lock: bool = False,
        net: bool = False
    ) -> list:
        """
        Send short order to open as short position.
        """
        return self.send_order(
            Direction.SHORT,
            Offset.OPEN,
            price,
            volume,
            stop,
            lock,
            net
        )

    def cover(
        self,
        price: float,
        volume: float,
        stop: bool = False,
        lock: bool = False,
        net: bool = False
    ) -> list:
        """
        Send cover order to close a short position.
        """
        return self.send_order(
            Direction.SHORT,
            Offset.CLOSE,
            price,
            volume,
            stop,
            lock,
            net
        )

    def send_order(
        self,
        direction: Direction,
        offset: Offset,
        price: float,
        volume: float,
        stop: bool = False,
        lock: bool = False,
        net: bool = False
    ) -> list:
        """
        Send a new order.
        """
        if self.trading:
            vt_orderids: list = self.cta_engine.send_order(
                self, direction, offset, price, volume, stop, lock, net
            )
            return vt_orderids
        else:
            return []

    def cancel_order(self, vt_orderid: str) -> None:
        """
        Cancel an existing order.
        """
        if self.trading:
            if not vt_orderid:
                self.write_log("取消订单失败，vt_orderid不能为空")
                return
            self.cta_engine.cancel_order(self, vt_orderid)

    def cancel_all(self) -> None:
        """
        Cancel all orders sent by strategy.
        """
        if self.trading:
            self.cta_engine.cancel_all(self)

    def write_log(self, msg: str) -> None:
        """
        Write a log message.
        """
        self.cta_engine.write_log(msg, self)

    def get_engine_type(self) -> EngineType:
        """
        Return whether the cta_engine is backtesting or live trading.
        """
        return cast(EngineType, self.cta_engine.get_engine_type())

    def get_pricetick(self) -> float:
        """
        Return pricetick data of trading contract.
        """
        return cast(float, self.cta_engine.get_pricetick(self))

    def get_size(self) -> int:
        """
        Return size data of trading contract.
        """
        return cast(int, self.cta_engine.get_size(self))

    def load_bar(
        self,
        days: int,
        interval: Interval = Interval.MINUTE,
        callback: Callable | None = None,
        use_database: bool = False
    ) -> None:
        """
        Load historical bar data for initializing strategy.
        """
        if not callback:
            callback = self.on_bar

        bars: list[BarData] = self.cta_engine.load_bar(
            self.vt_symbol,
            days,
            interval,
            callback,
            use_database
        )

        for bar in bars:
            callback(bar)

    def load_tick(self, days: int) -> None:
        """
        Load historical tick data for initializing strategy.
        """
        ticks: list[TickData] = self.cta_engine.load_tick(self.vt_symbol, days, self.on_tick)

        for tick in ticks:
            self.on_tick(tick)

    def put_event(self) -> None:
        """
        Put an strategy data event for ui update.
        """
        if self.inited:
            self.cta_engine.put_strategy_event(self)

    def send_email(self, msg: str) -> None:
        """
        Send email to default receiver.
        """
        if self.inited:
            self.cta_engine.send_email(msg, self)

    def sync_data(self) -> None:
        """
        Sync strategy variables value into disk storage.
        """
        if self.trading:
            self.cta_engine.sync_strategy_data(self)
