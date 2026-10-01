"""Static catalog: what we fetch (metrics), from whom (sources), and how it is labelled."""

from .current import INFLATION_ID, INFLATION_OVERRIDES, POLICY_RATE, POLICY_RATE_SOURCE
from .hs2 import HS2_NAMES_DE, HS2_NAMES_EN
from .metrics import WORLD_BANK_METRICS
from .metrics_extra import WORLD_BANK_EXTRA
from .metrics_imf import IMF_DATAMAPPER_METRICS
from . import sources

# Every metric the snapshot/timeseries steps fetch, core first (order = UI order).
ALL_METRICS = (*WORLD_BANK_METRICS, *WORLD_BANK_EXTRA, *IMF_DATAMAPPER_METRICS)

assert len({m.id for m in ALL_METRICS}) == len(ALL_METRICS), "duplicate metric id in catalog"

__all__ = [
    "INFLATION_ID", "INFLATION_OVERRIDES", "POLICY_RATE", "POLICY_RATE_SOURCE",
    "HS2_NAMES_DE", "HS2_NAMES_EN", "WORLD_BANK_METRICS", "WORLD_BANK_EXTRA",
    "IMF_DATAMAPPER_METRICS", "ALL_METRICS", "sources",
]
