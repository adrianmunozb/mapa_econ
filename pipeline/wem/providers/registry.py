"""Look up the IndicatorProvider named by ``Metric.provider`` (one instance per name)."""

from __future__ import annotations

from typing import Callable

from ..http import HttpClient
from .base import IndicatorProvider
from .imf_datamapper import ImfDataMapperClient
from .worldbank import WorldBankClient

FACTORIES: dict[str, Callable[[HttpClient], IndicatorProvider]] = {
    "worldbank": WorldBankClient,
    "imf_datamapper": ImfDataMapperClient,
}


class ProviderPool:
    """Lazily builds and caches providers sharing one HTTP client."""

    def __init__(self, http: HttpClient) -> None:
        self._http = http
        self._cache: dict[str, IndicatorProvider] = {}

    def get(self, name: str) -> IndicatorProvider:
        if name not in self._cache:
            try:
                self._cache[name] = FACTORIES[name](self._http)
            except KeyError:
                raise KeyError(f"unknown indicator provider {name!r}; known: {sorted(FACTORIES)}") from None
        return self._cache[name]
