"""Additional indicators (all optional: an unreachable/empty series is skipped, not fatal).

Rows are ``(id, code, domain, format, higher_is_better, (de, en) label, (de, en) short
label, (de, en) unit, (de, en) description)`` — compact on purpose, one line per metric.
"""

from __future__ import annotations

from ..models import Metric

PCT = ("% der Bevölkerung", "% of population")
PCT_GDP = ("% des BIP", "% of GDP")
PER_1000 = ("pro 1.000", "per 1,000")


def _make(provider: str, rows) -> tuple[Metric, ...]:
    return tuple(
        Metric(
            id=mid, indicator_code=code, domain=domain, format=fmt, higher_is_better=hib,
            label=label[0], label_en=label[1], short_label=short[0], short_label_en=short[1],
            unit=unit[0], unit_en=unit[1], description=desc[0], description_en=desc[1],
            provider=provider, optional=True,
        )
        for mid, code, domain, fmt, hib, label, short, unit, desc in rows
    )


WORLD_BANK_EXTRA: tuple[Metric, ...] = _make("worldbank", [
    # --- economy
    ("gni_per_capita", "NY.GNP.PCAP.CD", "economy", "currency", True,
     ("BNE pro Kopf", "GNI per capita"), ("BNE/Kopf", "GNI/capita"), ("US$", "US$"),
     ("Bruttonationaleinkommen pro Einwohner (Atlas-Methode, US$).", "Gross national income per capita (Atlas method, US$).")),
    ("gdp_per_capita_growth", "NY.GDP.PCAP.KD.ZG", "economy", "percent", True,
     ("BIP-Wachstum pro Kopf", "GDP per capita growth"), ("Wachstum/Kopf", "Growth/capita"), ("% pro Jahr", "% per year"),
     ("Reales jährliches Wachstum des BIP pro Kopf.", "Real annual growth of GDP per capita.")),
    ("imports_gdp", "NE.IMP.GNFS.ZS", "economy", "percent", None,
     ("Importe (Anteil am BIP)", "Imports (% of GDP)"), ("Importe", "Imports"), PCT_GDP,
     ("Importe von Waren und Dienstleistungen als Anteil am BIP.", "Imports of goods and services as a share of GDP.")),
    ("fdi_inflows_gdp", "BX.KLT.DINV.WD.GD.ZS", "economy", "percent", None,
     ("Ausländische Direktinvestitionen", "Foreign direct investment"), ("ADI", "FDI"), PCT_GDP,
     ("Netto-Zuflüsse ausländischer Direktinvestitionen als Anteil am BIP.", "Net inflows of foreign direct investment as a share of GDP.")),
    ("capital_formation_gdp", "NE.GDI.TOTL.ZS", "economy", "percent", None,
     ("Bruttoinvestitionen", "Gross capital formation"), ("Investitionen", "Investment"), PCT_GDP,
     ("Bruttoanlageinvestitionen plus Vorratsveränderung als Anteil am BIP.", "Gross fixed capital formation plus inventory change, as a share of GDP.")),
    ("tax_revenue_gdp", "GC.TAX.TOTL.GD.ZS", "economy", "percent", None,
     ("Steuereinnahmen", "Tax revenue"), ("Steuern", "Taxes"), PCT_GDP,
     ("Steuereinnahmen des Zentralstaats als Anteil am BIP.", "Central-government tax revenue as a share of GDP.")),
    ("agriculture_gdp", "NV.AGR.TOTL.ZS", "economy", "percent", None,
     ("Landwirtschaft (Anteil am BIP)", "Agriculture (% of GDP)"), ("Landwirtschaft", "Agriculture"), PCT_GDP,
     ("Wertschöpfung der Land-, Forst- und Fischereiwirtschaft als Anteil am BIP.", "Value added of agriculture, forestry and fishing as a share of GDP.")),
    ("industry_gdp", "NV.IND.TOTL.ZS", "economy", "percent", None,
     ("Industrie (Anteil am BIP)", "Industry (% of GDP)"), ("Industrie", "Industry"), PCT_GDP,
     ("Wertschöpfung der Industrie (inkl. Bau) als Anteil am BIP.", "Value added of industry (incl. construction) as a share of GDP.")),
    ("services_gdp", "NV.SRV.TOTL.ZS", "economy", "percent", None,
     ("Dienstleistungen (Anteil am BIP)", "Services (% of GDP)"), ("Dienstleistungen", "Services"), PCT_GDP,
     ("Wertschöpfung des Dienstleistungssektors als Anteil am BIP.", "Value added of the services sector as a share of GDP.")),
    ("total_reserves", "FI.RES.TOTL.CD", "economy", "currency", True,
     ("Währungsreserven", "Total reserves"), ("Reserven", "Reserves"), ("US$", "US$"),
     ("Gesamtreserven inkl. Gold, aktuelle US-Dollar.", "Total reserves including gold, current US dollars.")),
    ("youth_unemployment", "SL.UEM.1524.ZS", "economy", "percent", False,
     ("Jugendarbeitslosigkeit", "Youth unemployment"), ("Jugendarbeitslos.", "Youth unempl."), ("% der Erwerbspersonen 15–24", "% of labor force 15–24"),
     ("Arbeitslosenquote der 15- bis 24-Jährigen (ILO-Schätzung).", "Unemployment rate of 15–24 year-olds (ILO estimate).")),
    ("labor_participation", "SL.TLF.CACT.ZS", "economy", "percent", None,
     ("Erwerbsquote", "Labor force participation"), ("Erwerbsquote", "Participation"), ("% der Bevölkerung 15+", "% of population 15+"),
     ("Anteil der Erwerbspersonen an der Bevölkerung ab 15 Jahren (ILO-Schätzung).", "Share of the population aged 15+ that is economically active (ILO estimate).")),
    ("rd_expenditure", "GB.XPD.RSDV.GD.ZS", "economy", "percent", True,
     ("Forschungsausgaben (F&E)", "R&D expenditure"), ("F&E", "R&D"), PCT_GDP,
     ("Ausgaben für Forschung und Entwicklung als Anteil am BIP.", "Research and development expenditure as a share of GDP.")),
    # --- trade
    ("tourism_arrivals", "ST.INT.ARVL", "trade", "number", None,
     ("Internationale Touristenankünfte", "International tourist arrivals"), ("Touristen", "Tourists"), ("Ankünfte", "arrivals"),
     ("Ankünfte internationaler Touristen pro Jahr.", "Number of international tourist arrivals per year.")),
    # --- social
    ("literacy", "SE.ADT.LITR.ZS", "social", "percent", True,
     ("Alphabetisierungsrate", "Literacy rate"), ("Alphabetisierung", "Literacy"), ("% der Erwachsenen", "% of adults"),
     ("Anteil der Erwachsenen (15+), die lesen und schreiben können.", "Share of adults (15+) who can read and write.")),
    ("secondary_enrollment", "SE.SEC.ENRR", "social", "percent", True,
     ("Sekundarschul-Einschulung", "Secondary school enrollment"), ("Sekundarstufe", "Secondary"), ("% brutto", "% gross"),
     ("Brutto-Einschulungsquote der Sekundarstufe (kann über 100 % liegen).", "Gross enrollment ratio in secondary education (can exceed 100%).")),
    ("women_parliament", "SG.GEN.PARL.ZS", "social", "percent", True,
     ("Frauenanteil im Parlament", "Women in parliament"), ("Frauen Parlament", "Women MPs"), ("% der Sitze", "% of seats"),
     ("Anteil der Parlamentssitze, die von Frauen gehalten werden.", "Share of parliamentary seats held by women.")),
    ("homicide_rate", "VC.IHR.PSRC.P5", "social", "number", False,
     ("Mordrate", "Homicide rate"), ("Morde", "Homicides"), ("pro 100.000", "per 100,000"),
     ("Vorsätzliche Tötungen pro 100.000 Einwohner.", "Intentional homicides per 100,000 people.")),
    # --- health
    ("infant_mortality", "SP.DYN.IMRT.IN", "health", "number", False,
     ("Säuglingssterblichkeit", "Infant mortality"), ("Säuglingssterbl.", "Infant mort."), ("pro 1.000 Lebendgeburten", "per 1,000 live births"),
     ("Gestorbene Säuglinge vor dem ersten Geburtstag pro 1.000 Lebendgeburten.", "Infants dying before their first birthday per 1,000 live births.")),
    ("under5_mortality", "SH.DYN.MORT", "health", "number", False,
     ("Kindersterblichkeit (unter 5)", "Under-5 mortality"), ("Kindersterbl.", "Under-5 mort."), ("pro 1.000 Lebendgeburten", "per 1,000 live births"),
     ("Sterberate von Kindern unter 5 Jahren pro 1.000 Lebendgeburten.", "Mortality rate of children under 5 per 1,000 live births.")),
    ("physicians", "SH.MED.PHYS.ZS", "health", "number", True,
     ("Ärztedichte", "Physicians"), ("Ärzte", "Doctors"), PER_1000,
     ("Ärztinnen und Ärzte pro 1.000 Einwohner.", "Physicians per 1,000 people.")),
    ("hospital_beds", "SH.MED.BEDS.ZS", "health", "number", True,
     ("Krankenhausbetten", "Hospital beds"), ("Betten", "Beds"), PER_1000,
     ("Krankenhausbetten pro 1.000 Einwohner.", "Hospital beds per 1,000 people.")),
    ("safe_water", "SH.H2O.BASW.ZS", "health", "percent", True,
     ("Sauberes Trinkwasser", "Basic drinking water"), ("Trinkwasser", "Water"), PCT,
     ("Anteil der Bevölkerung mit Zugang zu grundlegender Trinkwasserversorgung.", "Share of the population using at least basic drinking-water services.")),
    ("sanitation", "SH.STA.BASS.ZS", "health", "percent", True,
     ("Sanitärversorgung", "Basic sanitation"), ("Sanitär", "Sanitation"), PCT,
     ("Anteil der Bevölkerung mit Zugang zu grundlegender Sanitärversorgung.", "Share of the population using at least basic sanitation services.")),
    # --- demographics
    ("population_growth", "SP.POP.GROW", "demographics", "percent", None,
     ("Bevölkerungswachstum", "Population growth"), ("Bev.-Wachstum", "Pop. growth"), ("% pro Jahr", "% per year"),
     ("Jährliche Wachstumsrate der Bevölkerung.", "Annual population growth rate.")),
    ("population_65plus", "SP.POP.65UP.TO.ZS", "demographics", "percent", None,
     ("Bevölkerung ab 65", "Population aged 65+"), ("65+", "65+"), PCT,
     ("Anteil der Bevölkerung ab 65 Jahren.", "Share of the population aged 65 and above.")),
    ("birth_rate", "SP.DYN.CBRT.IN", "demographics", "number", None,
     ("Geburtenziffer", "Crude birth rate"), ("Geburtenziffer", "Birth rate"), PER_1000,
     ("Lebendgeburten pro 1.000 Einwohner.", "Live births per 1,000 people.")),
    ("net_migration", "SM.POP.NETM", "demographics", "number", None,
     ("Netto-Migration", "Net migration"), ("Migration", "Migration"), ("Personen (5 Jahre)", "people (5-year)"),
     ("Netto-Zuwanderung über fünf Jahre (negativ = Abwanderung).", "Net migration over five years (negative = emigration).")),
    # --- environment
    ("renewable_energy", "EG.FEC.RNEW.ZS", "environment", "percent", True,
     ("Erneuerbare Energien", "Renewable energy"), ("Erneuerbare", "Renewables"), ("% des Endenergieverbrauchs", "% of final energy"),
     ("Anteil erneuerbarer Energien am Endenergieverbrauch.", "Renewable energy as a share of total final energy consumption.")),
    ("forest_area", "AG.LND.FRST.ZS", "environment", "percent", None,
     ("Waldfläche", "Forest area"), ("Wald", "Forest"), ("% der Landfläche", "% of land area"),
     ("Waldfläche als Anteil an der Landesfläche.", "Forest area as a share of land area.")),
    ("pm25", "EN.ATM.PM25.MC.M3", "environment", "number", False,
     ("Feinstaub (PM2,5)", "Air pollution (PM2.5)"), ("PM2,5", "PM2.5"), ("µg/m³", "µg/m³"),
     ("Mittlere jährliche Feinstaubbelastung (PM2,5).", "Mean annual exposure to fine particulate matter (PM2.5).")),
    ("energy_use_per_capita", "EG.USE.PCAP.KG.OE", "environment", "number", None,
     ("Energieverbrauch pro Kopf", "Energy use per capita"), ("Energie/Kopf", "Energy/capita"), ("kg Öläquivalent", "kg of oil equivalent"),
     ("Primärenergieverbrauch pro Kopf in Kilogramm Öläquivalent.", "Primary energy use per capita in kilograms of oil equivalent.")),
    # --- infrastructure
    ("broadband", "IT.NET.BBND.P2", "infrastructure", "number", True,
     ("Festnetz-Breitband", "Fixed broadband"), ("Breitband", "Broadband"), ("pro 100 Einw.", "per 100 people"),
     ("Festnetz-Breitbandanschlüsse pro 100 Einwohner.", "Fixed broadband subscriptions per 100 people.")),
])
