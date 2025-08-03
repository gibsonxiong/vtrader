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


class Test2Strategy(CtaTemplate):
    """"""
    author = "用Python的交易员"

    parameters = [
        "fast_window",
        "slow_window",
        "init_pos",
        "max_add_times",
        "roi",
    ]

    roi = 0.03
    fast_window = 10
    slow_window = 30
    init_pos = 1.0
    max_add_times = 3

    def __init__(self, cta_engine, strategy_name, vt_symbol, setting):
        super().__init__(cta_engine, strategy_name, vt_symbol, setting)
        self.bg = BarGenerator(self.on_bar, 15, self.on_15min_bar, Interval.MINUTE)
        self.am = ArrayManager(self.slow_window + 10)
        self.add_times = 0
        self.entry_price = 0
        self.pos_direction = 0  # 1=多，-1=空，0=无
        self.load_bar(10)

    def on_init(self) -> None:
        self.write_log("策略初始化")

    def on_start(self) -> None:
        self.write_log("策略启动")

    def on_stop(self) -> None:
        self.write_log("策略停止")

    def on_tick(self, tick: TickData) -> None:
        self.bg.update_tick(tick)

    def on_bar(self, bar: BarData) -> None:
        self.bg.update_bar(bar)
        self.put_event()

    def on_15min_bar(self, bar: BarData) -> None:
        self.cancel_all()
        self.am.update_bar(bar)
        if not self.am.inited:
            return

        fast_ma = self.am.sma(self.fast_window)
        slow_ma = self.am.sma(self.slow_window)
        price = bar.close_price

        long_roi = self.posMgr.get_long_roi(price)
        short_roi = self.posMgr.get_short_roi(price)

        # print(f"当前浮动盈亏 多：{long_roi} 空：{short_roi}")

        # 当前无持仓
        if self.posMgr.long_pos == 0 and self.posMgr.short_pos == 0:
            self.add_times = 0
            # 金叉做多，死叉做空
            if fast_ma > slow_ma:
                print("开仓（多）")
                self.buy(price, self.init_pos)
            elif fast_ma < slow_ma:
                print("开仓（空）")
                self.short(price, self.init_pos)
            return

        # 多头持仓
        if self.posMgr.long_pos > 0:
            # 死叉，平多开空
            if fast_ma < slow_ma:
                print("平多开空")
                self.sell(price, self.posMgr.long_pos)
                self.short(price, self.init_pos)
                self.add_times = 0
                return
            # 浮盈加仓
            if long_roi >= self.roi:
                if self.add_times < self.max_add_times:
                    print("浮盈加仓（多）")
                    self.buy(price, self.init_pos)
                    self.add_times += 1
                else:
                    print("止盈（多）")
                    self.sell(price, self.posMgr.long_pos)
                    self.add_times = 0
            elif long_roi <= -self.roi:
                print("止损（多）")
                self.sell(price, self.posMgr.long_pos)
                self.add_times = 0

        # 空头持仓
        elif self.posMgr.short_pos > 0:
            # 金叉，平空开多
            if fast_ma > slow_ma:
                print("平空开多")
                self.cover(price, self.posMgr.short_pos)
                self.buy(price, self.init_pos)
                self.add_times = 0
                return
            
            # 浮盈加仓
            if short_roi >= self.roi:
                print("浮盈加仓（空）")
                if self.add_times < self.max_add_times:
                    self.short(price, self.init_pos)
                    self.add_times += 1
                else:
                    print("止盈（空）")
                    self.cover(price, self.posMgr.short_pos)
                    self.add_times = 0
            elif short_roi <= -self.roi:
                print("止损（空）")
                self.cover(price, self.posMgr.short_pos)
                self.add_times = 0

        self.put_event()
