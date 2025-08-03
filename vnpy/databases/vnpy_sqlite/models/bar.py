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
    TextField,
    DateTimeField,
    FloatField,
    IntegerField
)

from .base import BaseModel


class DbBarData(BaseModel):
    """K线数据表映射对象"""

    id: AutoField = AutoField()

    symbol: CharField = CharField()
    exchange: CharField = CharField()
    datetime: DateTimeField = DateTimeField()
    interval: CharField = CharField()

    volume: FloatField = FloatField()
    turnover: FloatField = FloatField()
    open_interest: FloatField = FloatField()
    open_price: FloatField = FloatField()
    high_price: FloatField = FloatField()
    low_price: FloatField = FloatField()
    close_price: FloatField = FloatField()

    extra: TextField = TextField(null=True)

    class Meta:
        indexes: tuple = ((("symbol", "exchange", "interval", "datetime"), True),)


class DbBarOverview(BaseModel):
    """K线汇总数据表映射对象"""

    id: AutoField = AutoField()

    symbol: CharField = CharField()
    exchange: CharField = CharField()
    interval: CharField = CharField()
    count: int = IntegerField()
    start: DateTimeField = DateTimeField()
    end: DateTimeField = DateTimeField()

    class Meta:
        indexes: tuple = ((("symbol", "exchange", "interval"), True),)