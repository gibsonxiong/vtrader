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
import numpy as np
import talib

class FSampleVnpyStrategy(CtaTemplate):
    author = "你的名字"
    
    # 策略参数
    rsi_length = 14
    tema_length = 9
    bb_length = 20
    bb_dev = 2
    minimal_roi = 0.02  # 2%止盈
    stop_loss = -0.01  # 2%止损

    # 策略变量
    rsi_value = 0
    tema_value = 0
    bb_mid = 0
    bb_up = 0
    bb_down = 0
    entry_price = None

    stake_amount = 10000

    parameters = ["rsi_length", "tema_length", "bb_length", "bb_dev", "minimal_roi", "stop_loss", "stake_amount"]
    variables = ["rsi_value", "tema_value", "bb_mid", "bb_up", "bb_down", "entry_price"]

    def on_init(self):
        self.write_log("策略初始化")
        self.bg = BarGenerator(self.on_bar)
        self.am = ArrayManager(27)

    def on_start(self):
        self.write_log("策略启动")

    def on_stop(self):
        self.write_log("策略停止")

    def on_tick(self, tick: TickData):
        self.bg.update_tick(tick)

    def on_bar(self, bar: BarData):
        
        if bar.datetime < datetime(2025, 3, 1, 8, 0, 0).replace(tzinfo=bar.datetime.tzinfo):
            return
        
        self.am.update_bar(bar)
        if not self.am.inited:
            return
        

        # 典型价格
        typical_price = (self.am.high_array + self.am.low_array + self.am.close_array) / 3

        # RSI
        self.rsi_value = talib.RSI(self.am.close_array, timeperiod=self.rsi_length)[-1]
        # TEMA
        self.tema_value = talib.TEMA(self.am.close_array, timeperiod=self.tema_length)[-1]
        tema_last = talib.TEMA(self.am.close_array, timeperiod=self.tema_length)[-2]
        # 布林带（用典型价格）
        bb_mid, bb_up, bb_down = talib.BBANDS(
            typical_price,
            timeperiod=self.bb_length,
            nbdevup=self.bb_dev,
            nbdevdn=self.bb_dev,
            matype=0
        )
        self.bb_mid = bb_mid[-1]
        self.bb_up = bb_up[-1]
        self.bb_down = bb_down[-1]

        volume = self.stake_amount / bar.close_price

        # ROI止盈逻辑（多头）
        if self.posMgr.long_pos > 0 and self.entry_price:
            roi = (bar.close_price - self.entry_price) / self.entry_price
            if roi >= self.minimal_roi or roi <= self.stop_loss:
                self.sell(bar.close_price, self.posMgr.long_pos)
                self.entry_price = None
                return

        # ROI止盈逻辑（空头）
        if self.posMgr.short_pos > 0 and self.entry_price:
            roi = (self.entry_price - bar.close_price) / self.entry_price
            if roi >= self.minimal_roi or roi <= self.stop_loss:
                self.cover(bar.close_price, self.posMgr.short_pos)
                self.entry_price = None
                return

        # 多头开仓
        if (
            self.rsi_value > 30
            and self.tema_value <= self.bb_mid
            and self.tema_value > tema_last
        ):
            if self.posMgr.long_pos == 0:
                self.buy(bar.close_price, volume)
                self.entry_price = bar.close_price
                return
            
            elif self.posMgr.short_pos > 0:
                self.cover(bar.close_price, self.posMgr.short_pos)
                self.entry_price = None
                return

        # 空头开仓
        if (
            self.rsi_value > 70
            and self.tema_value > self.bb_mid
            and self.tema_value < tema_last
        ):
            if self.posMgr.short_pos == 0:
                self.short(bar.close_price, volume)
                self.entry_price = bar.close_price
                return
            
            elif self.posMgr.long_pos > 0:
                self.sell(bar.close_price, self.posMgr.long_pos)
                self.entry_price = None
                return

    def on_order(self, order):
        pass

    def on_trade(self, trade):
        pass

    def on_stop_order(self, stop_order):
        pass