from peewee import AutoField, CharField, DateTimeField, FloatField, IntegerField, ForeignKeyField
from datetime import datetime

from .base import BaseModel
from .backtesting_result import DbBacktestingResult


class DbBacktestTrade(BaseModel):
    """回测交易记录表映射对象"""

    id: AutoField = AutoField()

    # 外键关联回测结果
    backtest_result: ForeignKeyField = ForeignKeyField(DbBacktestingResult, backref='trades')
    
    # 交易基本信息
    gateway_name: CharField = CharField()  # 网关名称
    symbol: CharField = CharField()        # 交易品种
    exchange: CharField = CharField()      # 交易所
    orderid: CharField = CharField()       # 订单号
    tradeid: CharField = CharField()       # 成交号
    vt_symbol: CharField = CharField()     # 完整品种代码
    vt_orderid: CharField = CharField()    # 完整订单号
    vt_tradeid: CharField = CharField()    # 完整成交号
    
    # 交易详情
    direction: CharField = CharField(null=True)  # 交易方向
    offset: CharField = CharField()              # 开平仓
    price: FloatField = FloatField()             # 成交价格
    volume: FloatField = FloatField()            # 成交数量
    trade_time: DateTimeField = DateTimeField()    # 成交时间
    
    # 盈亏信息
    realized_pnl: FloatField = FloatField(default=0)  # 已实现盈亏
    commission: FloatField = FloatField(default=0)    # 手续费
    
    # 时间戳
    created_time: DateTimeField = DateTimeField(default=datetime.now)

    class Meta:
        indexes = (
            (("backtest_result", "trade_time"), False),
            (("symbol", "exchange"), False),
            (("vt_tradeid",), True),  # 唯一索引
        )