"""Static catalog: what we fetch (metrics), from whom (sources), and how it is labelled."""

from .current import INFLATION_ID, INFLATION_OVERRIDES, POLICY_RATE, POLICY_RATE_SOURCE
from .hs2 import HS2_NAMES_DE, HS2_NAMES_EN
from .metrics import WORLD_BANK_METRICS
from . import sources

__all__ = [
    "INFLATION_ID", "INFLATION_OVERRIDES", "POLICY_RATE", "POLICY_RATE_SOURCE",
    "HS2_NAMES_DE", "HS2_NAMES_EN", "WORLD_BANK_METRICS", "sources",
]
