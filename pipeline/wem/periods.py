"""Period labels for monthly / daily observations, as ISO ``YYYY-MM`` (language-neutral;
the frontend formats them for the UI language)."""

from __future__ import annotations


def imf_period(p: str) -> tuple[str, int]:
    """'2026-M05' -> ('2026-05', 2026)."""
    year, month = p.split("-M")
    return f"{year}-{int(month):02d}", int(year)


def bis_period(p: str) -> tuple[str, int]:
    """'2026-06-16' -> ('2026-06', 2026)."""
    parts = p.split("-")
    year, month = int(parts[0]), int(parts[1])
    return f"{year}-{month:02d}", year
