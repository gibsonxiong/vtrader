import datetime
from typing import List, Optional
from vnpy.rpc import RpcServer
from vnpy.trader.database import get_database
from vnpy.trader.engine import BaseEngine, MainEngine
from vnpy.trader.event import (
    EVENT_TICK,
    EVENT_ORDER,
    EVENT_TRADE,
    EVENT_POSITION,
    EVENT_ACCOUNT
)
from vnpy.event import EventEngine, Event
from vnpy.apps.vnpy_ctabacktester import BacktesterEngine


APP_NAME = "RpcService"


class WebEngine(BaseEngine):
    """Web服务引擎"""

    def __init__(self, main_engine: MainEngine, event_engine: EventEngine) -> None:
        """"""
        super().__init__(main_engine, event_engine, APP_NAME)

        self.server: RpcServer = RpcServer()

        self.init_server()
        self.register_event()

    def init_server(self) -> None:
        """初始化RPC服务器"""
        self.server.register(self.main_engine.connect)
        self.server.register(self.main_engine.subscribe)
        self.server.register(self.main_engine.send_order)
        self.server.register(self.main_engine.cancel_order)

        self.server.register(self.main_engine.get_contract)
        self.server.register(self.main_engine.get_order)
        self.server.register(self.main_engine.get_all_ticks)
        self.server.register(self.main_engine.get_all_orders)
        self.server.register(self.main_engine.get_all_trades)
        self.server.register(self.main_engine.get_all_positions)
        self.server.register(self.main_engine.get_all_accounts)
        self.server.register(self.main_engine.get_all_contracts)

        self.server.register(self.backtesting_get_strategy_class_names)
        self.server.register(self.backtesting_get_default_setting)
        self.server.register(self.backtesting_start)
        self.server.register(self.backtesting_get_results)
        self.server.register(self.backtesting_get_result_by_id)
        self.server.register(self.backtesting_delete_result)

    def start_server(
        self,
        rep_address: str,
        pub_address: str,
    ) -> None:
        """启动RPC服务器"""
        if self.server.is_active():
            return

        self.server.start(rep_address, pub_address)

    def register_event(self) -> None:
        """注册事件监听"""
        self.event_engine.register(EVENT_TICK, self.process_event)
        self.event_engine.register(EVENT_TRADE, self.process_event)
        self.event_engine.register(EVENT_ORDER, self.process_event)
        self.event_engine.register(EVENT_POSITION, self.process_event)
        self.event_engine.register(EVENT_ACCOUNT, self.process_event)

    def process_event(self, event: Event) -> None:
        """处理事件"""
        self.server.publish(event.type, event.data)

    def close(self):
        """关闭"""
        self.server.stop()
        self.server.join()

    @property
    def backtester_engine(self) -> BacktesterEngine:
        """获取回测引擎"""
        return self.main_engine.get_engine("CtaBacktester")

    def backtesting_get_strategy_class_names(self) -> list:
        """获取回测引擎策略类"""
        return self.backtester_engine.get_strategy_class_names()

    def backtesting_get_default_setting(self, class_name: str) -> dict:
        """获取回测引擎默认配置"""
        default_setting = self.backtester_engine.get_default_setting(class_name)
        
        # 转换为包含value和type的格式
        result = {}
        for key, value in default_setting.items():
            result[key] = {
                "value": value,
                "type": type(value).__name__
            }
        
        return result

    def backtesting_start(
        self,
        class_name: str,
        vt_symbol: str,
        interval: str,
        start: datetime,
        end: datetime,
        rate: float,
        slippage: float,
        size: int,
        pricetick: float,
        capital: int,
        setting: dict
    ) -> bool:
        """开始回测"""
        from datetime import datetime

        return self.backtester_engine.start_backtesting(
            class_name=class_name,
            vt_symbol=vt_symbol,
            interval=interval,
            start=start,
            end=end,
            rate=rate,
            slippage=slippage,
            size=size,
            pricetick=pricetick,
            capital=capital,
            setting=setting
        )

    def backtesting_get_results(
        self,
        class_name: Optional[str] = None,
        vt_symbol: Optional[str] = None,
        interval: Optional[str] = None,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[dict]:
        """获取回测结果列表"""
        database = get_database()
        if hasattr(database, 'get_backtesting_results'):
            return database.get_backtesting_results(
                class_name=class_name,
                vt_symbol=vt_symbol,
                interval=interval,
                limit=limit,
                offset=offset
            )
        else:
            return []

    def backtesting_get_result_by_id(self, result_id: int) -> Optional[dict]:
        """根据ID获取单个回测结果"""
        database = get_database()
        if hasattr(database, 'get_backtesting_result_by_id'):
            return database.get_backtesting_result_by_id(result_id)
        else:
            return None

    def backtesting_delete_result(self, result_id: int) -> bool:
        """删除回测结果"""
        database = get_database()
        if hasattr(database, 'delete_backtesting_result'):
            return database.delete_backtesting_result(result_id)
        else:
            return False
