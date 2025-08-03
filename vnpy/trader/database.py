from abc import ABC, abstractmethod
from datetime import datetime
from types import ModuleType
from dataclasses import dataclass
from importlib import import_module

from .constant import Interval, Exchange
from .object import BarData, TickData
from .setting import SETTINGS
from .utility import ZoneInfo
from .locale import _


DB_TZ = ZoneInfo(SETTINGS["database.timezone"])


def convert_tz(dt: datetime) -> datetime:
    """
    Convert timezone of datetime object to DB_TZ.
    """
    dt = dt.astimezone(DB_TZ)
    return dt.replace(tzinfo=None)


@dataclass
class BarOverview:
    """
    Overview of bar data stored in database.
    """

    symbol: str = ""
    exchange: Exchange | None = None
    interval: Interval | None = None
    count: int = 0
    start: datetime | None = None
    end: datetime | None = None


@dataclass
class TickOverview:
    """
    Overview of tick data stored in database.
    """

    symbol: str = ""
    exchange: Exchange | None = None
    count: int = 0
    start: datetime | None = None
    end: datetime | None = None


class BaseDatabase(ABC):
    """
    Abstract database class for connecting to different database.
    """

    @abstractmethod
    def save_bar_data(self, bars: list[BarData], stream: bool = False) -> bool:
        """
        Save bar data into database.
        """
        pass

    @abstractmethod
    def save_tick_data(self, ticks: list[TickData], stream: bool = False) -> bool:
        """
        Save tick data into database.
        """
        pass

    @abstractmethod
    def load_bar_data(
        self,
        symbol: str,
        exchange: Exchange,
        interval: Interval,
        start: datetime,
        end: datetime
    ) -> list[BarData]:
        """
        Load bar data from database.
        """
        pass

    @abstractmethod
    def load_tick_data(
        self,
        symbol: str,
        exchange: Exchange,
        start: datetime,
        end: datetime
    ) -> list[TickData]:
        """
        Load tick data from database.
        """
        pass

    @abstractmethod
    def delete_bar_data(
        self,
        symbol: str,
        exchange: Exchange,
        interval: Interval
    ) -> int:
        """
        Delete all bar data with given symbol + exchange + interval.
        """
        pass

    @abstractmethod
    def delete_tick_data(
        self,
        symbol: str,
        exchange: Exchange
    ) -> int:
        """
        Delete all tick data with given symbol + exchange.
        """
        pass

    @abstractmethod
    def get_bar_overview(self) -> list[BarOverview]:
        """
        Return bar data avaible in database.
        """
        pass

    @abstractmethod
    def get_tick_overview(self) -> list[TickOverview]:
        """
        Return tick data avaible in database.
        """
        pass

    @abstractmethod
    def save_backtesting_result(
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
        setting: str,
        total_return: float = None,
        annual_return: float = None,
        max_drawdown: float = None,
        sharpe_ratio: float = None,
        total_trades: int = None,
        win_rate: float = None
    ) -> int:
        """
        Save backtesting result into database.
        """
        pass

    @abstractmethod
    def get_backtesting_results(
        self,
        class_name: str = None,
        vt_symbol: str = None,
        interval: str = None,
        limit: int = None
    ) -> list[dict]:
        """
        Get backtesting results from database.
        """
        pass

    @abstractmethod
    def get_backtesting_result_by_id(self, result_id: int) -> dict:
        """
        Get backtesting result by ID from database.
        """
        pass

    @abstractmethod
    def update_backtesting_result(self, result_id: int, **kwargs) -> bool:
        """
        Update backtesting result in database.
        """
        pass

    @abstractmethod
    def delete_backtesting_result(self, result_id: int) -> bool:
        """
        Delete backtesting result from database.
        """
        pass

    @abstractmethod
    def delete_backtesting_results_by_filter(
        self,
        class_name: str = None,
        vt_symbol: str = None,
        interval: str = None
    ) -> int:
        """
        Delete backtesting results by filter from database.
        """
        pass

    @abstractmethod
    def count_backtesting_results(
        self,
        class_name: str = None,
        vt_symbol: str = None,
        interval: str = None
    ) -> int:
        """
        Count backtesting results in database.
        """
        pass

    


database: BaseDatabase | None = None


def get_database() -> BaseDatabase:
    """"""
    # Return database object if already inited
    global database
    if database:
        return database

    # Read database related global setting
    database_name: str = SETTINGS["database.name"]
    module_name: str = f"vnpy_{database_name}"

    # Try to import database module
    try:
        module: ModuleType = import_module(f"vnpy.databases.{module_name}")
    except ModuleNotFoundError:
        print(_("找不到数据库驱动{}，使用默认的SQLite数据库").format(module_name))
        module = import_module("vnpy.databases.vnpy_sqlite")

    # Create database object from module
    database = module.Database()
    return database     # type: ignore
