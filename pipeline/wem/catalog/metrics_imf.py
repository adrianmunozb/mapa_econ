"""Fiscal and external-balance indicators from the IMF DataMapper (WEO series)."""

from __future__ import annotations

from .metrics_extra import PCT_GDP, _make

IMF_DATAMAPPER_METRICS = _make("imf_datamapper", [
    ("gov_debt_gdp", "GGXWDG_NGDP", "economy", "percent", False,
     ("Staatsverschuldung", "Government debt"), ("Staatsschulden", "Gov. debt"), PCT_GDP,
     ("Brutto-Staatsverschuldung des Gesamtstaats als Anteil am BIP (IWF).", "General government gross debt as a share of GDP (IMF).")),
    ("fiscal_balance_gdp", "GGXCNL_NGDP", "economy", "percent", True,
     ("Haushaltssaldo", "Fiscal balance"), ("Haushaltssaldo", "Fiscal balance"), PCT_GDP,
     ("Finanzierungssaldo des Gesamtstaats als Anteil am BIP; negativ = Defizit (IWF).", "General government net lending/borrowing as a share of GDP; negative = deficit (IMF).")),
    ("gov_revenue_gdp", "GGR_NGDP", "economy", "percent", None,
     ("Staatseinnahmen", "Government revenue"), ("Einnahmen", "Revenue"), PCT_GDP,
     ("Einnahmen des Gesamtstaats als Anteil am BIP (IWF).", "General government revenue as a share of GDP (IMF).")),
    ("gov_expenditure_gdp", "GGX_NGDP", "economy", "percent", None,
     ("Staatsausgaben", "Government expenditure"), ("Ausgaben", "Spending"), PCT_GDP,
     ("Ausgaben des Gesamtstaats als Anteil am BIP (IWF).", "General government total expenditure as a share of GDP (IMF).")),
    ("current_account_gdp", "BCA_NGDPD", "economy", "percent", True,
     ("Leistungsbilanz", "Current account balance"), ("Leistungsbilanz", "Current account"), PCT_GDP,
     ("Leistungsbilanzsaldo als Anteil am BIP; negativ = Defizit (IWF).", "Current account balance as a share of GDP; negative = deficit (IMF).")),
    ("investment_gdp", "NID_NGDP", "economy", "percent", None,
     ("Investitionsquote", "Total investment"), ("Investitionen", "Investment"), PCT_GDP,
     ("Gesamtinvestitionen als Anteil am BIP (IWF).", "Total investment as a share of GDP (IMF).")),
    ("savings_gdp", "NGSD_NGDP", "economy", "percent", None,
     ("Sparquote", "Gross national savings"), ("Sparquote", "Savings"), PCT_GDP,
     ("Bruttonationalersparnis als Anteil am BIP (IWF).", "Gross national savings as a share of GDP (IMF).")),
])
