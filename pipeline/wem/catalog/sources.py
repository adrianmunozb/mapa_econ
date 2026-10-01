"""Every upstream data source, with the licence shown next to the values."""

from __future__ import annotations

from ..models import Source

WORLD_BANK = Source("World Bank Open Data", "https://data.worldbank.org", "CC BY 4.0")
NATURAL_EARTH = Source("Natural Earth", "https://www.naturalearthdata.com", "Public Domain")
IMF_CPI = Source("IMF – Consumer Price Index (CPI)", "https://data.imf.org", "IMF Terms (Quellenangabe erforderlich)")
IMF_TRADE = Source(
    "IMF – International Trade in Goods (IMTS)",
    "https://data.imf.org/en/datasets/IMF.STA:IMTS",
    "IMF Terms & Conditions",
)
BIS = Source("BIS – Central bank policy rates", "https://data.bis.org/topics/CBPOL", "BIS Terms (Quellenangabe erforderlich)")
COMTRADE = Source("UN Comtrade", "https://comtradeplus.un.org", "UN Comtrade Terms (Quellenangabe erforderlich)")
DOSE = Source(
    "DOSE — Global Dataset of Reported Sub-national Economic Output (v2.11)",
    "https://doi.org/10.5281/zenodo.16313760",
    "CC BY 4.0",
)
GEOBOUNDARIES = Source("geoBoundaries gbOpen ADM1", "https://www.geoboundaries.org/", "CC BY 4.0; attribution required")
