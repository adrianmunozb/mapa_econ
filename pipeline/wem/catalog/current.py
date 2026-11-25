"""Metrics whose values are patched in from monthly/daily sources (see steps/current)."""

from __future__ import annotations

from ..models import Metric
from .sources import BIS, EUROSTAT_LTIR, IMF_CPI, REAL_RATE

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

# Same currency, same source, same month: the only comparable sovereign spread.
EURO_SPREAD = Metric(
    id="euro_spread_bund",
    label="Risikoaufschlag ggü. Bund (10 J.)",
    label_en="Sovereign spread vs Bund (10Y, euro area)",
    short_label="Spread ggü. Bund",
    short_label_en="Spread vs Bund",
    unit="Bp.",
    unit_en="bp",
    description="Rendite 10-jähriger Staatsanleihen minus Bundrendite, gleicher Monat, eine Quelle (Eurostat, Konvergenzkriterium). Nur Euroraum.",
    description_en="10-year government bond yield minus the German Bund yield, same month and single source (Eurostat, EMU convergence criterion). Euro area only: across currencies a spread also prices exchange-rate and inflation risk.",
    domain="economy",
    format="basisPoints",
    higher_is_better=False,
    indicator_code="irt_lt_mcby_m",
)
EURO_SPREAD_SOURCE = EUROSTAT_LTIR

REAL_POLICY_RATE = Metric(
    id="real_policy_rate",
    label="Realer Leitzins (ex post)",
    label_en="Real policy rate (ex post)",
    short_label="Realzins",
    short_label_en="Real rate",
    unit="%",
    unit_en="%",
    description="Leitzins (BIS) minus aktuellste Inflationsrate (IWF). Positiv = real restriktiv.",
    description_en="Policy rate (BIS) minus the latest year-over-year CPI inflation (IMF). Positive means restrictive in real terms; it uses past, not expected, inflation.",
    domain="economy",
    format="percent",
    higher_is_better=None,
    indicator_code="WS_CBPOL-CPI",
)
REAL_POLICY_RATE_SOURCE = REAL_RATE
