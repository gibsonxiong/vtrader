from datetime import datetime
from peewee import AutoField, CharField, DateTimeField, FloatField, IntegerField, TextField
from .base import BaseModel
from datetime import datetime


class DbBacktestingResult(BaseModel):
    """回测结果表映射对象"""

    id: AutoField = AutoField()

    # 策略参数
    class_name: CharField = CharField()  # 策略类名
    vt_symbol: CharField = CharField()   # 交易品种
    interval: CharField = CharField()    # 时间周期
    start: DateTimeField = DateTimeField()  # 开始时间
    end: DateTimeField = DateTimeField()    # 结束时间
    rate: FloatField = FloatField()      # 手续费率
    slippage: FloatField = FloatField()  # 滑点
    size: IntegerField = IntegerField()  # 合约大小
    pricetick: FloatField = FloatField() # 最小价格变动
    capital: IntegerField = IntegerField()  # 初始资金
    setting: TextField = TextField()     # 策略参数设置(JSON格式)
    status: CharField = CharField(default="inited")  # 回测状态: inited/data_loading/backtesting/analysing/finished/failed
    
    # 回测结果统计
    total_return: FloatField = FloatField(null=True)     # 总收益率
    annual_return: FloatField = FloatField(null=True)    # 年化收益率
    max_drawdown: FloatField = FloatField(null=True)     # 最大回撤
    sharpe_ratio: FloatField = FloatField(null=True)     # 夏普比率
    total_trades: IntegerField = IntegerField(null=True) # 总交易次数
    win_rate: FloatField = FloatField(null=True)         # 胜率
    
    # 时间戳
    created_time: DateTimeField = DateTimeField(default=datetime.now)
    updated_time: DateTimeField = DateTimeField(default=datetime.now)

    class Meta:
        indexes = (
            (("class_name", "vt_symbol", "interval"), False),
            (("created_time",), False),
        )