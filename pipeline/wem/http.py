"""Thin HTTP client shared by all providers (retry + backoff in one place)."""

from __future__ import annotations

import time

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class HttpClient:
    """``requests.Session`` wrapper with a User-Agent, JSON helper and linear backoff."""

    def __init__(
        self,
        user_agent: str,
        *,
        retries: int = 4,
        backoff: float = 1.5,
        timeout: int = 90,
        transport_retry: Retry | None = None,
        pool_size: int | None = None,
    ) -> None:
        self.retries, self.backoff, self.timeout = retries, backoff, timeout
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": user_agent})
        if transport_retry is not None:
            kwargs = {"pool_connections": pool_size, "pool_maxsize": pool_size} if pool_size else {}
            self.session.mount("https://", HTTPAdapter(max_retries=transport_retry, **kwargs))

    def get(self, url: str, params: dict | None = None, *, timeout: int | None = None):
        """Single GET without retry/validation (callers decide how to react)."""
        return self.session.get(url, params=params, timeout=timeout or self.timeout)

    def get_json(self, url: str, params: dict | None = None):
        """GET + decode JSON with linear backoff; raises after the last attempt."""
        last_exc: Exception | None = None
        for attempt in range(self.retries):
            try:
                resp = self.session.get(url, params=params, timeout=self.timeout)
                if resp.status_code == 200:
                    return resp.json()
                last_exc = RuntimeError(f"HTTP {resp.status_code} for {resp.url}")
            except requests.RequestException as exc:  # network hiccup
                last_exc = exc
            time.sleep(self.backoff * (attempt + 1))
        raise RuntimeError(f"Request failed after {self.retries} tries: {url}") from last_exc
