"""Human-readable period labels for monthly / daily observations (German UI)."""

from __future__ import annotations

DE_MONTHS = ["", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]


def imf_period(p: str) -> tuple[str, int]:
    """'2026-M05' -> ('Mai 2026', 2026)."""
    year, month = p.split("-M")
    return f"{DE_MONTHS[int(month)]} {year}", int(year)


def bis_period(p: str) -> tuple[str, int]:
    """'2026-06-16' -> ('Jun 2026', 2026)."""
    parts = p.split("-")
    year, month = int(parts[0]), int(parts[1])
    return f"{DE_MONTHS[month]} {year}", year
