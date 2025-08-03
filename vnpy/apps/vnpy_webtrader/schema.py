from pydantic import BaseModel
from vnpy.trader.constant import (
    Exchange,
    Direction,
    OrderType,
    Offset,
)

class TokenModel(BaseModel):
    """令牌数据"""
    access_token: str
    token_type: str

class OrderRequestModel(BaseModel):
    """委托请求模型"""
    symbol: str
    exchange: Exchange
    direction: Direction
    type: OrderType
    volume: float
    price: float = 0
    offset: Offset = Offset.NONE
    reference: str = ""

class BacktestingRequestModel(BaseModel):
    class_name: str
    vt_symbol: str
    interval: str
    start: str  # Expecting date string in YYYY-MM-DD format
    end: str    # Expecting date string in YYYY-MM-DD format
    rate: float
    slippage: float
    size: int
    pricetick: float
    capital: int
    setting: dict