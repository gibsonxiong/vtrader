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


class Grid3Strategy(CtaTemplate):
    """"""

    author = "gibsonxiong"

    # 入场参数
    rsi_length = 14
    rsi_down = 25
    rsi_up = 75
    tema_length = 9
    bb_length = 20
    bb_dev = 2

    # 网格参数
    grid_step = 0.015
    grid_size = 80
    grid_capital = 100000
    min_volume: float = 0.001
    base_pos_count: int = 20
    use_ajust_grid: bool = True

    rsi_value = 0
    tema_value = 0
    last_tema_value = 0
    bb_mid = 0

    long_grid: list[GridItem] = []
    short_grid: list[GridItem] = []

    parameters = [
        'rsi_length',
        'rsi_down',
        'rsi_up',
        'tema_length',
        'bb_length',
        'bb_dev',

        'grid_step',
        'grid_size',
        'grid_capital',
        'min_volume',
        'base_pos_count',
        'use_ajust_grid',
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

        self.long_count = 0
        self.short_count = 0

        self.long_grid = []
        self.short_grid = []
        self.long_remove_order_id = ''
        self.short_remove_order_id = ''
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
        self.last_rsi_value = talib.RSI(self.am.close_array, timeperiod=self.rsi_length)[-2]
        self.last2_rsi_value = talib.RSI(self.am.close_array, timeperiod=self.rsi_length)[-3]
        
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

        self.enter_long = True
        self.enter_short = True

        self.enter_long = (
            self.rsi_value >= self.rsi_down and self.last_rsi_value < self.rsi_down and self.last2_rsi_value < self.rsi_down
            and self.tema_value <= self.bb_mid
            and self.tema_value > self.last_tema_value
        )

        self.enter_short = (
            self.rsi_value <= self.rsi_up and self.last_rsi_value > self.rsi_up and self.last2_rsi_value > self.rsi_up
            and self.tema_value > self.bb_mid
            and self.tema_value < self.last_tema_value
        )

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

        if orderid == self.long_remove_order_id:
            self.long_remove_order_id = ''
            return
        if orderid == self.short_remove_order_id:
            self.short_remove_order_id = ''
            return

        finded = False
        for gridItem in self.long_grid:
            if gridItem.order_id == orderid:
                finded = True
                # 开仓订单完成
                if gridItem.pos == 0:
                    # print(f"============开多仓")
                    # print(f"price: {trade.price}")
                    # print(f"volume: {trade.volume}")
                    # print(f"time: {trade.datetime}")
                    gridItem.pos = trade.volume
                    self.long_count += 1
                else:
                    # print(f"===============平多仓")
                    # print(f"price: {trade.price}")
                    # print(f"volume: {trade.volume}")
                    # print(f"time: {trade.datetime}")
                    gridItem.pos = 0
                    self.long_count -= 1
                gridItem.order_id = ""
                break

        if not finded:
            for gridItem in self.short_grid:
                if gridItem.order_id == orderid:
                    finded = True
                    # 开仓订单完成
                    if gridItem.pos == 0:
                        # print(f"============开空仓")
                        # print(f"price: {trade.price}")
                        # print(f"volume: {trade.volume}")
                        # print(f"time: {trade.datetime}")
                        gridItem.pos = trade.volume
                        self.short_count += 1
                    else:
                        # print(f"============平空仓")
                        # print(f"price: {trade.price}")
                        # print(f"volume: {trade.volume}")
                        # print(f"time: {trade.datetime}")
                        gridItem.pos = 0
                        self.short_count -= 1
                    gridItem.order_id = ""
                    break

        # print("--------------当前持仓--------------")
        # print(f"多仓 {self.posMgr.long_pos}")
        # print(f"空仓 {self.posMgr.short_pos}")

        self.put_event()

    def init_grid(self, entry_price: float, is_long: bool) -> None:
        if self.long_remove_order_id != '' and is_long:
            print("移除多仓网格订单未成交，无法再初始化")
            return
        if self.short_remove_order_id != '' and not is_long:
            print("移除空仓网格订单未成交，无法再初始化")
            return

        left_size = self.grid_size // 2
        right_size = self.grid_size - left_size - 1
        grid = self.long_grid if is_long else self.short_grid
        get_step_price = self.get_step_price

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

    def adjust_grid(self, price: float, is_long: bool) -> None:
        """
        调整网格
        :param price: 当前价格
        """
        grid = self.long_grid if is_long else self.short_grid
        if len(grid) == 0:
            return

        get_step_price = self.get_step_price
        min_price = grid[0].price
        max_price = grid[-1].price

        while price <= min_price:
            new_price = min_price - get_step_price(min_price)
            newGrid = GridItem(
                price=new_price,
                exit_price = new_price + get_step_price(new_price) if is_long else new_price - get_step_price(new_price),
            )

            last_grid_item = grid[-1]

            if (last_grid_item.pos > 0):
                newGrid.pos = last_grid_item.pos

                # if is_long: self.long_count +=1
                # else: self.short_count +1

            if (last_grid_item.order_id != ""):
                # 取消订单
                self.cancel_order(last_grid_item.order_id)

            grid.insert(0, newGrid)
            grid.pop(-1)
            min_price = new_price

        while price >= max_price:
            new_price = max_price + get_step_price(max_price)
            newGrid = GridItem(
                price=new_price,
                exit_price = new_price + get_step_price(new_price) if is_long else new_price - get_step_price(new_price),
            )

            first_grid_item = grid[0]

            if (first_grid_item.pos > 0):
                newGrid.pos = first_grid_item.pos

                # if is_long: self.long_count +=1
                # else: self.short_count +1

            if (first_grid_item.order_id != ""):
                # 取消订单
                self.cancel_order(first_grid_item.order_id)

            grid.append(newGrid)
            grid.pop(0)
            max_price = new_price
        pass

    def grid_logic(self, price: float) -> None:
        long_grid = self.long_grid
        short_grid = self.short_grid

        # 多仓网格
        if len(long_grid) == 0:
            if self.enter_long or self.enter_short:
                self.init_grid(price, is_long=True)
                
        # elif self.enter_short:
        #     self.remove_grid(price, is_long=True)
        elif self.use_ajust_grid:
            # 调整网格
            self.adjust_grid(price, is_long=True)

        # 建底仓
        if self.long_count == 0 and len(long_grid) > 0:
            self.open_base_pos(price, is_long=True)

        # 平仓
        for gridItem in long_grid:
            if gridItem.pos > 0 and not gridItem.order_id:
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
            if self.enter_short or self.enter_long:
                self.init_grid(price, is_long=False)
        # elif self.enter_long:
        #     self.remove_grid(price, is_long=False)
        elif self.use_ajust_grid:
            # 调整网格
            self.adjust_grid(price, is_long=False)

        # 建底仓
        if self.short_count == 0 and len(short_grid) > 0:
            self.open_base_pos(price, is_long=False)

        # 平仓
        for gridItem in reversed(short_grid):
            if gridItem.pos > 0 and not gridItem.order_id:
                order_ids = self.cover(gridItem.exit_price,  gridItem.pos)
                gridItem.order_id = order_ids[0]
        # 开仓
        for gridItem in short_grid:
            if gridItem.pos == 0 and not gridItem.order_id and gridItem.price >= price:
                volume = self.get_volume(gridItem.price)
                order_ids = self.short(gridItem.price, volume)
                gridItem.order_id = order_ids[0]

    def remove_grid(self, price: float, is_long: bool) -> None:
        if is_long:
            # 如果有仓位，平掉所有仓位
            if self.posMgr.long_pos > 0:
                order_ids = self.sell(price, self.posMgr.long_pos)
                self.long_remove_order_id = order_ids[0]
            # 取消所有订单
            [self.cancel_order(gridItem.order_id) for gridItem in self.long_grid if gridItem.order_id]
            self.long_grid.clear()
            self.long_count = 0
        else:
            # 如果有仓位，平掉所有仓位
            if self.posMgr.short_pos > 0:
                order_ids = self.cover(price, self.posMgr.short_pos)
                self.short_remove_order_id = order_ids[0]
            # 取消所有订单
            [self.cancel_order(gridItem.order_id) for gridItem in self.short_grid if gridItem.order_id]
            self.short_grid.clear()
            self.short_count = 0

    # 建底仓
    def open_base_pos(self, price: float, is_long: bool) -> None:
        left_count = self.base_pos_count

        if is_long:
            for gridItem in self.long_grid:
                if left_count > 0 and gridItem.price >= price:
                    if gridItem.pos != 0:
                        raise ValueError("网格中已有仓位，无法开底仓")
                    volume = self.get_volume(gridItem.price)
                    order_ids = self.buy(price, volume)
                    gridItem.order_id = order_ids[0]
                    left_count -= 1
        else:
            for gridItem in reversed(self.short_grid):
                if left_count > 0 and gridItem.price <= price:
                    if gridItem.pos != 0:
                        raise ValueError("网格中已有仓位，无法开底仓")
                    volume = self.get_volume(gridItem.price)
                    order_ids = self.short(price, volume)
                    gridItem.order_id = order_ids[0]
                    left_count -= 1
        pass


    def get_volume(self, price: float) -> float:
        """
        获取当前网格的买入数量
        :param price: 当前价格
        """
        volume = self.grid_capital / self.grid_size / price / 2
        volume = floor_to(volume, self.min_volume)
        volume = max(volume, self.min_volume)

        return volume
    
    def get_step_price(self, cur_price: float) -> float:
        step_price = cur_price * self.grid_step
        return step_price

