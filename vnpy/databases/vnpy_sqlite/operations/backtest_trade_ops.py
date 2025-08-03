from typing import List, Optional
from datetime import datetime

from vnpy.trader.object import TradeData
from vnpy.trader.database import convert_tz

from ..models import DbBacktestTrade
from .base import BaseOperations


class BacktestTradeOperations(BaseOperations):
    """回测交易记录数据库操作类"""

    def save_backtest_trade(
        self,
        backtest_result_id: int,
        trade: TradeData
    ) -> int:
        """
        保存回测交易记录到数据库
        返回新创建记录的ID
        """
        # 转换时区
        trade_time = convert_tz(trade.trade_time) if trade.trade_time else datetime.now()
        
        # 创建回测交易记录
        db_trade = DbBacktestTrade.create(
            backtest_result=backtest_result_id,
            gateway_name=trade.gateway_name,
            symbol=trade.symbol,
            exchange=trade.exchange.value,
            orderid=trade.orderid,
            tradeid=trade.tradeid,
            vt_symbol=trade.vt_symbol,
            vt_orderid=trade.vt_orderid,
            vt_tradeid=trade.vt_tradeid,
            direction=trade.direction.value if trade.direction else None,
            offset=trade.offset.value,
            price=trade.price,
            volume=trade.volume,
            trade_time=trade_time,
            realized_pnl=trade.realized_pnl,
            commission=trade.commission
        )
        
        return db_trade.id

    def save_backtest_trades(
        self,
        backtest_result_id: int,
        trades: List[TradeData]
    ) -> List[int]:
        """
        批量保存回测交易记录到数据库
        返回新创建记录的ID列表
        """
        trade_ids = []
        for trade in trades:
            trade_id = self.save_backtest_trade(backtest_result_id, trade)
            trade_ids.append(trade_id)
        return trade_ids

    def get_backtest_trades(
        self,
        backtest_result_id: int,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[dict]:
        """
        查询指定回测结果的交易记录列表
        """
        query = DbBacktestTrade.select().where(
            DbBacktestTrade.backtest_result == backtest_result_id
        )
        
        # 按交易时间排序
        query = query.order_by(DbBacktestTrade.trade_time)
        
        # 分页
        if limit:
            query = query.limit(limit).offset(offset)
            
        trades = []
        for trade in query:
            trade_dict = {
                'id': trade.id,
                'backtest_result_id': trade.backtest_result.id,
                'gateway_name': trade.gateway_name,
                'symbol': trade.symbol,
                'exchange': trade.exchange,
                'orderid': trade.orderid,
                'tradeid': trade.tradeid,
                'vt_symbol': trade.vt_symbol,
                'vt_orderid': trade.vt_orderid,
                'vt_tradeid': trade.vt_tradeid,
                'direction': trade.direction,
                'offset': trade.offset,
                'price': trade.price,
                'volume': trade.volume,
                'trade_time': trade.trade_time,
                'realized_pnl': trade.realized_pnl,
                'commission': trade.commission,
                'created_time': trade.created_time
            }
            trades.append(trade_dict)
            
        return trades

    def get_backtest_trade_by_id(self, trade_id: int) -> Optional[dict]:
        """
        根据ID获取单个回测交易记录
        """
        try:
            trade = DbBacktestTrade.get_by_id(trade_id)
            return {
                'id': trade.id,
                'backtest_result_id': trade.backtest_result.id,
                'gateway_name': trade.gateway_name,
                'symbol': trade.symbol,
                'exchange': trade.exchange,
                'orderid': trade.orderid,
                'tradeid': trade.tradeid,
                'vt_symbol': trade.vt_symbol,
                'vt_orderid': trade.vt_orderid,
                'vt_tradeid': trade.vt_tradeid,
                'direction': trade.direction,
                'offset': trade.offset,
                'price': trade.price,
                'volume': trade.volume,
                'trade_time': trade.trade_time,
                'realized_pnl': trade.realized_pnl,
                'commission': trade.commission,
                'created_time': trade.created_time
            }
        except DbBacktestTrade.DoesNotExist:
            return None

    def delete_backtest_trades_by_result_id(self, backtest_result_id: int) -> int:
        """
        删除指定回测结果的所有交易记录
        返回删除的记录数
        """
        query = DbBacktestTrade.delete().where(
            DbBacktestTrade.backtest_result == backtest_result_id
        )
        return query.execute()

    def delete_backtest_trade(self, trade_id: int) -> bool:
        """
        删除单个回测交易记录
        """
        try:
            trade = DbBacktestTrade.get_by_id(trade_id)
            trade.delete_instance()
            return True
        except DbBacktestTrade.DoesNotExist:
            return False

    def get_backtest_trades_count(self, backtest_result_id: int) -> int:
        """
        获取指定回测结果的交易记录总数
        """
        return DbBacktestTrade.select().where(
            DbBacktestTrade.backtest_result == backtest_result_id
        ).count()