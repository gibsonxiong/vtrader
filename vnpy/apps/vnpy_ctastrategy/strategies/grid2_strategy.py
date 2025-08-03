from datetime import datetime

import talib
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
from vnpy.trader.utility import floor_to, round_to

grid_id = 0

def gen_id() -> str:
    global grid_id
    new_id = grid_id
    grid_id += 1
    return new_id

class GridItem:
    def __init__(
        self, 
        price: float,
        exit_price: float,
    ) -> None:
        self.id = gen_id()
        self.price = price
        self.exit_price = exit_price
        self.pos = 0
        self.order_id = ""


class Grid2Strategy(CtaTemplate):
    """"""

    author = "gibsonxiong"

    # 入场参数
    rsi_length = 14
    tema_length = 9
    bb_length = 20
    bb_dev = 2

    # 网格参数
    grid_step = 0.015
    grid_size = 40
    grid_capital = 10000
    min_volume: float = 0.01

    rsi_value = 0
    tema_value = 0
    last_tema_value = 0
    bb_mid = 0

    long_grid: list[GridItem] = []
    short_grid: list[GridItem] = []

    parameters = [
        'rsi_length',
        'tema_length',
        'bb_length',
        'bb_dev',

        'grid_step',
        'grid_size',
        'grid_capital',
        'min_volume',
    ]

    variables = [
        'rsi_value',
        'tema_value',
        'last_tema_value',
        'bb_mid',
    ]

    def on_init(self) -> None:
        """
        Callback when strategy is inited.
        """
        self.write_log("策略初始化")

        self.long_grid = []
        self.short_grid = []
        self.am = ArrayManager(50)
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

        # print(f"当前价格: {bar.close_price} 时间: {bar.datetime}")
        self.bg.update_bar(bar)

        if not self.am.inited:
            return

        # 网格逻辑
        self.grid_logic(bar.close_price)

    def on_1hour_bar(self, bar: BarData) -> None:
        self.am.update_bar(bar)
        if not self.am.inited:
            return
        
        # 典型价格
        typical_price = (self.am.high_array + self.am.low_array + self.am.close_array) / 3

        # RSI
        self.rsi_value = talib.RSI(self.am.close_array, timeperiod=self.rsi_length)[-1]
        # TEMA
        self.tema_value = talib.TEMA(self.am.close_array, timeperiod=self.tema_length)[-1]
        self.last_tema_value = talib.TEMA(self.am.close_array, timeperiod=self.tema_length)[-2]
        # 布林带（用典型价格）
        bb_mid, bb_up, bb_down = talib.BBANDS(
            typical_price,
            timeperiod=self.bb_length,
            nbdevup=self.bb_dev,
            nbdevdn=self.bb_dev,
            matype=0
        )
        self.bb_mid = bb_mid[-1]

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

        orderid = trade.vt_orderid
        finded = False
        for gridItem in self.long_grid:
            if gridItem.order_id == orderid:
                finded = True
                if gridItem.pos == 0:
                    # print(f"============开多仓")
                    # print(f"price: {trade.price}")
                    # print(f"volume: {trade.volume}")
                    # print(f"time: {trade.datetime}")
                    gridItem.pos = trade.volume
                else:
                    # print(f"===============平多仓")
                    # print(f"price: {trade.price}")
                    # print(f"volume: {trade.volume}")
                    # print(f"time: {trade.datetime}")
                    gridItem.pos = 0
                gridItem.order_id = ""
                break

        if not finded:
            for gridItem in self.short_grid:
                if gridItem.order_id == orderid:
                    finded = True
                    if gridItem.pos == 0:
                        # print(f"============开空仓")
                        # print(f"price: {trade.price}")
                        # print(f"volume: {trade.volume}")
                        # print(f"time: {trade.datetime}")
                        gridItem.pos = trade.volume
                    else:
                        # print(f"============平空仓")
                        # print(f"price: {trade.price}")
                        # print(f"volume: {trade.volume}")
                        # print(f"time: {trade.datetime}")
                        gridItem.pos = 0
                    gridItem.order_id = ""
                    break

        # print("--------------当前持仓--------------")
        # print(f"多仓 {self.posMgr.long_pos}")
        # print(f"空仓 {self.posMgr.short_pos}")

        self.put_event()

    def grid_logic(self, price: float) -> None:
        long_grid = self.long_grid
        short_grid = self.short_grid

        # 多仓网格
        if len(long_grid) == 0:
            # 多头开仓
            if (
                self.rsi_value > 35
                and self.tema_value <= self.bb_mid
                and self.tema_value > self.last_tema_value
            ):
                self.init_grid(price, is_long=True)

        # 平仓
        for gridItem in long_grid:
            if gridItem.pos > 0 and not gridItem.order_id and gridItem.price >= price:
                order_ids = self.sell(gridItem.exit_price, gridItem.pos)
                gridItem.order_id = order_ids[0]

        # 开仓
        for gridItem in reversed(long_grid):
            if gridItem.pos == 0 and not gridItem.order_id and gridItem.price <= price:
                volume = self.get_volume(gridItem.price)
                order_ids = self.buy(gridItem.price, volume)
                gridItem.order_id = order_ids[0]


        # 空仓网格
        if len(short_grid) == 0:
            # 空头开仓
            if (
                self.rsi_value > 65
                and self.tema_value > self.bb_mid
                and self.tema_value < self.last_tema_value
            ):
                self.init_grid(price, is_long=False)

        # 平仓
        for gridItem in short_grid:
            if gridItem.pos > 0 and not gridItem.order_id and gridItem.price <= price:
                order_ids = self.cover(gridItem.exit_price,  gridItem.pos)
                gridItem.order_id = order_ids[0]
        # 开仓
        for gridItem in reversed(short_grid):
            if gridItem.pos == 0 and not gridItem.order_id and gridItem.price >= price:
                volume = self.get_volume(gridItem.price)
                order_ids = self.short(gridItem.price, volume)
                gridItem.order_id = order_ids[0]

    def get_volume(self, price: float) -> float:
        """
        获取当前网格的买入数量
        :param price: 当前价格
        """
        volume = self.grid_capital / self.grid_size / price / 2
        volume = floor_to(volume, self.min_volume)
        volume = max(volume, self.min_volume)

        return volume
    
    def init_grid(self, entry_price: float, is_long: bool) -> None:
        left_size = self.grid_size // 2
        right_size = self.grid_size - left_size - 1
        grid_step = self.grid_step
        grid = self.long_grid if is_long else self.short_grid

        def get_step_price(cur_price: float) -> float:
            step_price = cur_price * grid_step
            return step_price

        grid.append(GridItem(
            price= entry_price,
            exit_price = entry_price + get_step_price(entry_price) if is_long else entry_price - get_step_price(entry_price),
        ))

        prev_price = entry_price
        for i in range(left_size):
            cur_price = prev_price - get_step_price(prev_price)
            grid.insert(0, GridItem(
                price = cur_price,
                exit_price = cur_price + get_step_price(cur_price) if is_long else cur_price - get_step_price(cur_price),
            ))
            prev_price = cur_price

        prev_price = entry_price
        for i in range(right_size):
            cur_price = prev_price + get_step_price(prev_price)
            grid.append(GridItem(
                price = cur_price,
                exit_price = cur_price + get_step_price(cur_price) if is_long else cur_price - get_step_price(cur_price),
            ))
            prev_price = cur_price
