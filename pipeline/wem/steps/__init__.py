"""Pipeline stages. Each module exposes ``run(paths, args) -> int`` and writes one output."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Sequence

from ..paths import Paths
from . import audit, current, export, i18n, products, regions, snapshot, timeseries, trade

RunFn = Callable[[Paths, Sequence[str]], int]


@dataclass(frozen=True)
class Step:
    name: str
    summary: str
    run: RunFn
    in_full_run: bool = True  # included in ``python -m wem all``


# Order matters: later steps read the snapshot written by the first one.
STEPS: dict[str, Step] = {
    s.name: s
    for s in (
        Step("snapshot", "World Bank indicators + Natural Earth borders", snapshot.run),
        Step("regions", "reported regional GDP/population + ADM1 boundaries", regions.run),
        Step("timeseries", "2004–2024 history per metric", timeseries.run),
        Step("current", "current inflation (IMF) + policy rates (BIS)", current.run),
        Step("trade", "bilateral trade flows (IMF IMTS)", trade.run),
        Step("products", "export products (UN Comtrade)", products.run),
        Step("i18n", "bilingual labels (EN default, DE)", i18n.run),
        Step("export", "CSV history per indicator → data/csv/", export.run),
        Step("audit", "data consistency checks (read-only)", audit.run, in_full_run=False),
    )
}
