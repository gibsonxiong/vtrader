#
# Copyright (c) 2015-present, Xiaoyou Chen
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

from peewee import (
    AutoField,
    CharField,
    DateTimeField,
    FloatField,
    IntegerField
)

from .base import BaseModel


class DbTickData(BaseModel):
    """TICK数据表映射对象"""

    id: AutoField = AutoField()

    symbol: CharField = CharField()
    exchange: CharField = CharField()
    datetime: DateTimeField = DateTimeField()

    name: CharField = CharField()
    volume: FloatField = FloatField()
    turnover: FloatField = FloatField()
    open_interest: FloatField = FloatField()
    last_price: FloatField = FloatField()
    last_volume: FloatField = FloatField()
    limit_up: FloatField = FloatField()
    limit_down: FloatField = FloatField()

    open_price: FloatField = FloatField()
    high_price: FloatField = FloatField()
    low_price: FloatField = FloatField()
    pre_close: FloatField = FloatField()

    bid_price_1: FloatField = FloatField()
    bid_price_2: FloatField = FloatField(null=True)
    bid_price_3: FloatField = FloatField(null=True)
    bid_price_4: FloatField = FloatField(null=True)
    bid_price_5: FloatField = FloatField(null=True)

    ask_price_1: FloatField = FloatField()
    ask_price_2: FloatField = FloatField(null=True)
    ask_price_3: FloatField = FloatField(null=True)
    ask_price_4: FloatField = FloatField(null=True)
    ask_price_5: FloatField = FloatField(null=True)

    bid_volume_1: FloatField = FloatField()
    bid_volume_2: FloatField = FloatField(null=True)
    bid_volume_3: FloatField = FloatField(null=True)
    bid_volume_4: FloatField = FloatField(null=True)
    bid_volume_5: FloatField = FloatField(null=True)

    ask_volume_1: FloatField = FloatField()
    ask_volume_2: FloatField = FloatField(null=True)
    ask_volume_3: FloatField = FloatField(null=True)
    ask_volume_4: FloatField = FloatField(null=True)
    ask_volume_5: FloatField = FloatField(null=True)

    localtime: DateTimeField = DateTimeField(null=True)

    class Meta:
        indexes: tuple = ((("symbol", "exchange", "datetime"), True),)


class DbTickOverview(BaseModel):
    """Tick汇总数据表映射对象"""

    id: AutoField = AutoField()

    symbol: CharField = CharField()
    exchange: CharField = CharField()
    count: int = IntegerField()
    start: DateTimeField = DateTimeField()
    end: DateTimeField = DateTimeField()

    class Meta:
        indexes: tuple = ((("symbol", "exchange"), True),)