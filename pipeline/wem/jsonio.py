"""JSON read/write helpers with the formatting conventions of each data file."""

from __future__ import annotations

import json
from pathlib import Path

COMPACT = (",", ":")


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(
    path: Path,
    data,
    *,
    ensure_ascii: bool = False,
    separators: tuple[str, str] | None = None,
    allow_nan: bool = True,
) -> None:
    """Write ``data`` as UTF-8 JSON; ``allow_nan=False`` fails loudly on NaN/Inf."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, ensure_ascii=ensure_ascii, separators=separators, allow_nan=allow_nan),
        encoding="utf-8",
    )


def file_kb(path: Path) -> float:
    return path.stat().st_size / 1024
