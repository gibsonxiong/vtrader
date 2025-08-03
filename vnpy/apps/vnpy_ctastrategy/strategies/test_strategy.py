from datetime import datetime
from vnpy.apps.vnpy_ctastrategy import (
    CtaTemplate,
    StopOrder,
    TickData,
    BarData,
    TradeData,
    OrderData,
    BarGenerator,
    ArrayManager,
)
from vnpy.trader.constant import Interval


class TestStrategy(CtaTemplate):
    """"""

    author = "用Python的交易员"


    parameters = [
    ]

    def on_init(self) -> None:
        """
        Callback when strategy is inited.
        """
        self.write_log("策略初始化")

        self.bg = BarGenerator(self.on_bar, 1, self.on_1hour_bar, Interval.HOUR)

    def on_start(self) -> None:
        """
        Callback when strategy is started.
        """
        self.write_log("策略启动")

    def on_stop(self) -> None:
        """
        Callback when strategy is stopped.
        """
        self.write_log("策略停止")

    def on_tick(self, tick: TickData) -> None:
        """
        Callback of new tick data update.
        """
        self.bg.update_tick(tick)

    def on_bar(self, bar: BarData) -> None:
        """
        Callback of new bar data update.
        """

        self.bg.update_bar(bar)

        self.put_event()

    def on_1hour_bar(self, bar: BarData) -> None:

        self.cancel_all()
        
        if self.posMgr.long_pos > 0:
            roi = self.posMgr.get_long_pnl(bar.close_price)

            if roi >= 0.05:
                self.sell(bar.close_price, self.posMgr.long_pos)
            elif roi <= -0.15 and self.posMgr.long_pos < 50:
                self.buy(bar.close_price, 10)
        else:
            self.buy(bar.close_price, 10)

        
        if self.posMgr.short_pos > 0:
            roi = self.posMgr.get_short_roi(bar.close_price)

            print(roi)
            if roi >= 0.05:
                self.cover(bar.close_price, self.posMgr.short_pos)
            elif roi <= -0.15 and self.posMgr.short_pos < 50:
                self.short(bar.close_price, 10)
        else:
            self.short(bar.close_price, 10)


        self.put_event()


    def on_order(self, order: OrderData) -> None:
        """
        Callback of new order data update.
        """
        pass

    def on_trade(self, trade: TradeData) -> None:
        """
        Callback of new trade data update.
        """
        self.put_event()

    def on_stop_order(self, stop_order: StopOrder) -> None:
        """
        Callback of stop order update.
        """
        pass
