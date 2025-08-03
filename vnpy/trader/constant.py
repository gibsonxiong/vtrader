"""
General constant enums used in the trading platform.
"""

from enum import Enum

from .locale import _


class Direction(Enum):
    """
    Direction of order/trade/position.
    """
    LONG = _("多")
    SHORT = _("空")
    NET = _("净")


class Offset(Enum):
    """
    Offset of order/trade.
    """
    NONE = ""
    OPEN = _("开")
    CLOSE = _("平")


class Status(Enum):
    """
    Order status.
    """
    SUBMITTING = _("提交中")
    NOTTRADED = _("未成交")
    PARTTRADED = _("部分成交")
    ALLTRADED = _("全部成交")
    CANCELLED = _("已撤销")
    REJECTED = _("拒单")


class Product(Enum):
    """
    Product class.
    """
    EQUITY = _("股票")
    FUTURES = _("期货")
    OPTION = _("期权")
    INDEX = _("指数")
    FOREX = _("外汇")
    SPOT = _("现货")
    ETF = "ETF"
    BOND = _("债券")
    WARRANT = _("权证")
    SPREAD = _("价差")
    FUND = _("基金")
    CFD = "CFD"
    SWAP = _("互换")


class OrderType(Enum):
    """
    Order type.
    """
    LIMIT = _("限价")
    MARKET = _("市价")
    STOP = "STOP"
    FAK = "FAK"
    FOK = "FOK"
    RFQ = _("询价")


class OptionType(Enum):
    """
    Option type.
    """
    CALL = _("看涨期权")
    PUT = _("看跌期权")


class Exchange(Enum):
    """
    Exchange.
    """
    BINANCE = "BINANCE"
    HUOBI = "HUOBI"

    # Special Function
    LOCAL = "LOCAL"         # For local generated data


class Currency(Enum):
    """
    Currency.
    """
    USD = "USD"
    HKD = "HKD"
    CNY = "CNY"
    CAD = "CAD"


class Interval(Enum):
    """
    Interval of bar data.
    """
    MINUTE = "1m"
    HOUR = "1h"
    DAILY = "d"
    WEEKLY = "w"
    TICK = "tick"
