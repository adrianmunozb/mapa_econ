"""Metrics whose values are patched in from monthly/daily sources (see steps/current)."""

from __future__ import annotations

from ..models import Metric
from .sources import BIS, IMF_CPI

POLICY_RATE = Metric(
    id="policy_rate",
    label="Leitzins",
    label_en="Central bank policy rate",
    short_label="Leitzins",
    short_label_en="Policy rate",
    unit="%",
    unit_en="%",
    description="Leitzins der Zentralbank — aktueller Stand (BIS).",
    description_en="Central bank policy rate — latest level (BIS).",
    domain="economy",
    format="percent",
    higher_is_better=None,
    indicator_code="WS_CBPOL",
)
POLICY_RATE_SOURCE = BIS

# Inflation keeps its World Bank metric id but is re-sourced from the IMF monthly CPI.
INFLATION_ID = "inflation"
INFLATION_OVERRIDES = {
    "source": IMF_CPI.to_dict(),
    "description": "Verbraucherpreisinflation (Jahresrate) des aktuellsten verfügbaren Monats.",
    "descriptionEn": "Consumer price inflation (year-over-year rate) of the most recent available month.",
    "indicatorCode": "CPI:YOY_PCH_PA_PT",
}
