# Sovereign bond yields

Select **Government bond yield** in the metric picker, then choose **Bond maturity**.
The heatmap, ranking, tooltips and country comparison use the exact selected
maturity. Clicking a country opens its yield curve with dated observations,
currency, methods and a link to the provider. Clicking a tenor below the curve
also selects that maturity on the map. Metric, maturity and country are shareable
through the existing URL hash (for example `#m=bond_yield_60m&c=ESP`).

The central bank policy rate remains a separate indicator. Yields are in local
currency, with different sovereign risk and provider methods. They should not
be read as directly comparable investment returns.

## Current coverage

The saved snapshot contains 57 countries, with 54 recent 10-year observations
and 21 multi-tenor curves. Iceland's 2022 observation is historical and excluded
from the current map and ranking. This country-coverage update leaves the
existing maturity filter unchanged; it adds no maturity options.

| Country | Observation | Available tenors | Official source |
| --- | --- | --- | --- |
| Bangladesh | 2026-10-14 | 2Y, 5Y, 10Y, 15Y, 20Y | [Bangladesh Bank · Treasury data](https://www.bb.org.bd/en/index.php/monetaryactivity/treasury) |
| Botswana | 2026-10-19 | 3M, 6M, 1Y, 3Y, 5Y | [Bank of Botswana · government securities](https://www.bankofbotswana.bw/content/government-securities) |
| Canada | 2026-10-16 | 2Y, 3Y, 5Y, 7Y, 10Y | [Bank of Canada](https://www.bankofcanada.ca/valet/observations/BD.CDN.2YR.DQ.YLD,BD.CDN.3YR.DQ.YLD,BD.CDN.5YR.DQ.YLD,BD.CDN.7YR.DQ.YLD,BD.CDN.10YR.DQ.YLD/json?recent=10) |
| China | 2026-10-19 | 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 15Y, 20Y, 25Y, 30Y | [MOF-China Government Bond Yield Curve · ChinaBond](https://yield.chinabond.com.cn/cbweb-czb-web/czb/czbChartSearch) |
| Egypt | 2026-10-06 | 3M, 6M, 1Y | [Central Bank of Egypt · EGP T-Bills Secondary Market](https://www.cbe.org.eg/en/economic-research/statistics/egp-t-bills-secondary-market) |
| France | 2026-10-19 | 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 15Y, 20Y, 25Y, 30Y | [Banque de France · CNO-TEC](https://www.banque-france.fr/fr/statistiques/taux-et-cours/indices-obligataires-2026-10-19) |
| Germany | 2026-10-19 | 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 15Y, 20Y, 30Y | [Deutsche Bundesbank](https://www.bundesbank.de/en/statistics/money-and-capital-markets/interest-rates-and-yields/daily-term-structure-on-listed-federal-securities-651570) |
| Japan | 2026-10-19 | 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 15Y, 20Y, 25Y, 30Y, 40Y | [Ministry of Finance Japan · JGB interest-rate information](https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/jgbcme.csv) |
| Malaysia | 2026-10-20 | 3Y, 5Y, 7Y, 10Y | [Bank Negara Malaysia · Benchmark Yields](https://financialmarkets.bnm.gov.my/benchmark-yields) |
| New Zealand | 2026-10-19 | 1Y, 2Y, 5Y, 10Y | [Reserve Bank of New Zealand · Wholesale Interest Rates (B2)](https://www.rbnz.govt.nz/statistics/series/%20exchange-and-interest-rates/wholesale-interest-rates) |
| Norway | 2026-10-19 | 3M, 6M, 1Y, 3Y, 5Y, 7Y, 10Y | [Norges Bank · Generic yields](https://www.norges-bank.no/en/topics/Statistics/norwegian-government-securities/generiske-statsrenter/) |
| Russia | 2026-10-19 | 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 15Y, 20Y, 30Y | [Bank of Russia · zero-coupon curve](https://www.cbr.ru/eng/hd_base/zcyc_params/) |
| Singapore | 2026-10-20 | 6M, 1Y, 2Y, 5Y, 10Y, 15Y, 20Y, 30Y, 50Y | [Monetary Authority of Singapore · Daily SGS Prices](https://eservices.mas.gov.sg/Statistics/fdanet/SgsBenchmarkIssuePrices.aspx) |
| Spain | 2026-07 | 3Y, 5Y, 10Y, 15Y, 30Y | [Banco de España · table 22.7](https://www.bde.es/webbe/es/estadisticas/compartido/datos/csv/be2207.csv) |
| Sweden | 2026-10-19 | 2Y, 5Y, 7Y, 10Y | [Sveriges Riksbank · SWEA API](https://api.riksbank.se/swea/v1/Observations/Latest/ByGroup/7) |
| Switzerland | 2026-09-30 | 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y | [Swiss National Bank · data portal](https://data.snb.ch/en/topics/ziredev/cube/rendeiduebd) |
| Tanzania | 2026-09 | 5Y, 10Y, 15Y | [Bank of Tanzania · Treasury bond auctions](https://www.bot.go.tz/TBonds?lang=en) |
| Thailand | 2026-10-20 | 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 15Y, 20Y, 25Y, 30Y, 40Y, 50Y | [ThaiBMA · Government bond yield curve](https://www.thaibma.or.th/EN/Market/YieldCurve/Government.aspx) |
| United Kingdom | 2026-10-16 | 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 15Y, 20Y, 25Y, 30Y, 40Y | [Bank of England · UK nominal yield curve](https://www.bankofengland.co.uk/statistics/yield-curves) |
| United States | 2026-10-19 | 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y | [U.S. Treasury](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=2026) |
| Zambia | 2026-09-25 | 2Y, 3Y, 7Y, 10Y, 15Y | [Bank of Zambia · bond auctions](https://www.boz.zm/jsonapi/node/bond_auction?sort=-field_bond_auction_date&page%5Blimit%5D=5&include=field_auction_results,field_results_file) |

Malaysia's 2026-10-20 conventional MGS points were reviewed on BNM's official
benchmark page and recorded with retrieval provenance in
`pipeline/bond-seeds.json`. Automated requests to BNM returned HTTP 403 from this
build host, so the dated seed is retained and the failed refresh is recorded as
a warning. Thailand's daily ThaiBMA curve was retrieved automatically. Both use
only the app's existing supported maturity values.

Russia's daily Bank of Russia zero-coupon curve is included only at maturities
already supported by the app. The source's 9-month point is omitted because
that term is not in the existing maturity grid. Hong Kong and Taiwan each add
one monthly 10-year observation; their single points are shown on the map and
do not qualify for the multi-tenor curve selector. Taiwan is absent from the
World Bank country snapshot, so the bond layer supplies its ISO metadata and
uses the existing TWN map geometry; no other Taiwan macro metrics are inferred. Bangladesh adds five official standard-tenor auction yields. Botswana adds bill yields and benchmark bonds only when actual remaining term is within 45 days of an existing maturity. Zambia reports primary-market auction yields for exact issue tenors. Tanzania combines each tenor's latest auction in the latest eligible month, so points can come from different auction days. Egypt's three secondary-market bill bands are retained as a reviewed 2026-10-06 seed because direct requests to the CBE site were rejected; its labels reflect CBE residual-maturity bands.

## Additional country coverage

Earlier expansion passes added 19 countries. The latest follow-up adds five
more markets with multi-tenor records listed above, bringing total additions
since the initial snapshot to 24. The table below lists 13 monthly 10-year
observations and four later 10-year points for Hong Kong, Taiwan, Russia and
Peru. Those observations retain their source-specific dates and methods;
Russia's remaining supported curve points are listed in the current-coverage
table.

| Country | Observation | 10Y yield | Source |
| --- | --- | ---: | --- |
| Bulgaria | 2026-09 | 4.09% | [Eurostat · TEIMF050](https://ec.europa.eu/eurostat/databrowser/product/page/TEIMF050) |
| Chile | 2026-09 | 6.01% | [OECD via FRED](https://fred.stlouisfed.org/series/IRLTLT01CLM156N) |
| Colombia | 2026-09 | 12.73% | [OECD via FRED](https://fred.stlouisfed.org/series/COLIRLTLT01STM) |
| Costa Rica | 2026-08 | 6.28% | [OECD via FRED](https://fred.stlouisfed.org/series/CRIIRLTLT01STM) |
| Croatia | 2026-09 | 3.59% | [Eurostat · TEIMF050](https://ec.europa.eu/eurostat/databrowser/product/page/TEIMF050) |
| Cyprus | 2026-09 | 3.92% | [Eurostat · TEIMF050](https://ec.europa.eu/eurostat/databrowser/product/page/TEIMF050) |
| Estonia | 2026-09 | 4.09% | [Eurostat · TEIMF050](https://ec.europa.eu/eurostat/databrowser/product/page/TEIMF050) |
| Hong Kong | 2026-09 | 3.987% | [Hong Kong Monetary Authority](https://www.hkma.gov.hk/eng/data-publications-and-research/data-and-statistics/economic-financial-data-for-hong-kong) |
| India | 2026-09 | 7.06% | [OECD via FRED](https://fred.stlouisfed.org/series/INDIRLTLT01STM) |
| Latvia | 2026-08 | 3.82% | [OECD via FRED](https://fred.stlouisfed.org/series/LVAIRLTLT01STM) |
| Lithuania | 2026-08 | 2.88% | [OECD via FRED](https://fred.stlouisfed.org/series/LTUIRLTLT01STM) |
| Malta | 2026-09 | 4.19% | [Eurostat · TEIMF050](https://ec.europa.eu/eurostat/databrowser/product/page/TEIMF050) |
| Mexico | 2026-09 | 9.35% | [OECD via FRED](https://fred.stlouisfed.org/series/IRLTLT01MXM156N) |
| Peru | 2026-09 | 6.52% | [BCRPData · series PD31895MM](https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/resultados/PD31895MM/html) |
| Romania | 2026-09 | 6.71% | [Eurostat · TEIMF050](https://ec.europa.eu/eurostat/databrowser/product/page/TEIMF050) |
| Russia | 2026-10-19 | 16.47% | [Bank of Russia · zero-coupon curve](https://www.cbr.ru/eng/hd_base/zcyc_params/) |
| Taiwan | 2026-08 | 1.96% | [Central Bank of the Republic of China (Taiwan) · API](https://cpx.cbc.gov.tw/API/DataAPI/Get?FileName=EG43M01en) |

FRED's OECD series are monthly averages and link to the source series for each
country. Eurostat's TEIMF050 data are monthly average central-government
secondary-market yields, gross of tax, for bonds with around 10 years' residual
maturity; Eurostat identifies the ECB as the source. Bulgaria is labelled EUR
from its 2026 euro adoption. Malaysia's and Thailand's curves are daily provider
observations. These country values retain their own dates, currencies, and
method notes, and are not synthetic fills.

The Hong Kong Monetary Authority reports its 10-year government-bond yield in
percent per annum; the downloaded page labels the observation month. Taiwan's
Central Bank API supplies the secondary-market 10-year government-bond rate;
its SDDS definition is a weighted average for the most actively traded 10-year
bonds. Russia's 16.47% point is from the dated zero-coupon curve, not a par
yield.

Peru's BCRPData series PD31895MM reports the 10-year Peruvian government-bond
yield in soles and attributes the underlying series to the Ministry of Economy
and Finance. The latest snapshot observation is September 2026, at 6.5219%.

Other markets were investigated but not added where dated, reusable benchmark
yield data could not be retrieved reliably or the available measure did not
match the feature. Bank Indonesia's recent public entries are security-specific
coupon-rate notices, not a benchmark-yield series. The Philippine Bureau of the
Treasury's September 2026 PDF table lists 2026 values beyond its September
publication date, so its latest observation cannot be dated reliably. HNX
describes Viet Nam yield-curve delivery as a registered datafeed product; no
free stable download was verified. Brazil's public daily file is security-level
and does not identify a clean constant-maturity 10-year series. Turkey's OECD
long-term series available through FRED ends in 2010. Kenya's Central Bank
source exposes current bill and policy rates, while the most recent verified
full curve found was in its October 2025 report, outside the app's 180-day
recency window. RBA and RBNZ downloads remain blocked here; RBNZ is preserved
from a reviewed seed, while Australia has no multi-tenor seed.

All points within a country use one observation date or month. Providers publish
different measures: benchmark, par, actuarial or model-estimated spot yields;
methods and currencies are displayed in the country panel. Other countries
retain monthly OECD 10-year observations. Missing maturities are never filled
from policy rates, swaps or another tenor.

## Update and costs

Run `python pipeline/build_bonds.py` from the repository root, then rebuild the
app. This writes `app/src/data/bonds-snapshot.json`, which is bundled into both
normal and standalone builds. This feature adds no browser API requests, polling,
timers, API keys, subscriptions or paid services. Static hosting costs remain
subject to the hosting provider; the normalized snapshot is small.

Downloads use a 24-hour cache under ignored `pipeline/.cache/bonds/` (keyed by
URL for GETs and URL plus form body for POSTs), a 30-second request timeout and
no automatic retries. Requests and France's
publication-date fallback are bounded. Updates are manual, not scheduled. A
provider failure keeps its previous country records and is recorded in the
snapshot's `warnings`. Observation dates remain unchanged on a failed update;
`generatedAt` records the build attempt, not the age of every observation.

Source access and cost evidence checked 2026-10-20:

- [Bank of Canada API guide](https://www.bankofcanada.ca/valet-api-how-to/): explicitly free, with no registration or access key; recommends caching daily data.
- [U.S. Treasury XML files](https://home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics/interest-rate-xml-files): public official interest-rate downloads.
- [Banco de España financial market statistics](https://www.bde.es/webbe/es/estadisticas/temas/mercados-financieros.html): official downloadable CSV tables, including secondary sovereign yields.
- [Bundesbank daily curve](https://www.bundesbank.de/en/statistics/money-and-capital-markets/interest-rates-and-yields/daily-term-structure-on-listed-federal-securities-651570): official series and downloadable CSV.
- [Banque de France publication](https://www.banque-france.fr/fr/statistiques/taux-et-cours/indices-obligataires-2026-10-19): dated CNO-TEC observations and methodology.
- [FRED example and OECD attribution](https://fred.stlouisfed.org/series/IRLTLT01ESM156N): public download and required OECD source attribution. Each included country's panel links its actual series.
- [Eurostat TEIMF050](https://ec.europa.eu/eurostat/databrowser/product/page/TEIMF050): monthly long-term government bond yields, sourced from ECB data. The [Eurostat API access guide](https://ec.europa.eu/eurostat/en/web/user-guides/data-browser/api-data-access/api-introduction) documents free public API access; this pipeline makes one cached dataset request.
- [ThaiBMA government bond yield curve](https://www.thaibma.or.th/EN/Market/YieldCurve/Government.aspx): official provider curve and method notes; the pipeline requests one dated JSON resource at a time, with a six-day maximum date fallback.
- [Bank Negara Malaysia benchmark yields](https://financialmarkets.bnm.gov.my/benchmark-yields): dated conventional MGS benchmark closes, including a note that asterisked values are last traded. The page is a public official source; the build host currently returns HTTP 403, so a reviewed dated seed is retained.
- [HKMA Economic & Financial Data](https://www.hkma.gov.hk/eng/data-publications-and-research/data-and-statistics/economic-financial-data-for-hong-kong): official monthly 10-year government-bond yield, in percent per annum; the data are also documented in the [HKMA monetary-statistics API](https://apidocs.hkma.gov.hk/documentation/market-data-and-statistics/monthly-statistical-bulletin/financial/monetary-statistics/).
- [Taiwan CBC English API guide](https://cpx.cbc.gov.tw/Data/ExportToEnAPIInfo) and [interest-rate SDDS definition](https://www.cbc.gov.tw/en/cp-515-29985-C1D35-2.html): the public monthly series identifies the secondary-market 10-year government-bond rate; one cached API request retrieves it.
- [Bank of Russia zero-coupon yield curve](https://www.cbr.ru/eng/hd_base/zcyc_params/): official daily spot curve. The provider returns its full labelled grid, and the pipeline retains only exact maturities already supported in the app.
- [Bank of Botswana government securities](https://www.bankofbotswana.bw/content/government-securities): official daily workbook; on-the-run bonds are assigned only to an existing tenor when actual remaining term is within 45 days. The workbook uses the bounded 24-hour binary cache.
- [Bank of Zambia bond auctions](https://www.boz.zm/markets-securities/bonds): official JSON API; one cached request reads the latest dated auction and exact issue-tenor yields. These are primary-market observations.
- [Bank of Tanzania Treasury bond auctions](https://www.bot.go.tz/TBonds?lang=en): official auction results; the build caches the page and a result request per selected tenor, with no retries. Monthly points can have different auction dates.
- [Bangladesh Bank Treasury data](https://www.bb.org.bd/en/index.php/monetaryactivity/treasury): official cut-off and standard-tenor yields; one cached page request.
- [Central Bank of Egypt EGP T-Bills Secondary Market](https://www.cbe.org.eg/en/economic-research/statistics/egp-t-bills-secondary-market): official source listing. Direct retrieval returned “Request Rejected”, so the dated 2026-10-06 observation is a reviewed seed with retrieval provenance, not an automated feed.
- [BCRPData developer API](https://estadisticas.bcrp.gob.pe/estadisticas/series/ayuda/api) and [monthly 10-year yield series PD31895MM](https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/resultados/PD31895MM/html): open GET API, no sign-in required; the underlying series is sourced from Peru's Ministry of Economy and Finance.
- [Central Bank of Kenya October 2025 MPC report](https://www.centralbank.go.ke/uploads/monetary_policy_reports/1738379471_35th%20MPC%20Report%20October%202025%20Dec%2022%202025.pdf): official government securities yield-curve chart reviewed but too old for the current map.
- [Bureau of the Treasury Philippines monthly rates](https://www.treasury.gov.ph/?page_id=4596) and its [September 2026 report](https://www.treasury.gov.ph/wp-content/uploads/2026/09/GS-Rates_Monthly-2000-Sep2026.pdf): reviewed but excluded because the 2026 table's reported months extend past the page's stated update date.
- [HNX datafeed product guide](https://cbinfo.hnx.vn/vi-vn/dich-vu-cctt/huong-dan-yeu-cau-ky-thuat-sgtc.html): describes yield-curve data delivery as a subscribed market-data product; no paid access was added.
- [Council of the EU · Bulgaria's euro adoption](https://www.consilium.europa.eu/en/press/press-releases/2025/07/08/bulgaria-ready-to-use-the-euro-from-1-january-2026-council-takes-final-steps/): confirms Bulgaria's EUR adoption from 2026-01-01.

## Validation

`app/tests/bonds.test.mjs` checks exact-term selection, missing observations,
zero and negative yields, basis-point conversion, immutable snapshot enrichment,
policy-rate preservation, stale/future date exclusion and all bundled curve
records. Browser checks cover maturity selection, shareable hashes, country
navigation, a multi-point curve, a single-point country and a missing maturity.
The latest 2026-10-20 follow-up fetched the Botswana, Zambia, Tanzania and
Bangladesh providers and added Egypt as a reviewed dated seed after direct CBE
requests were rejected. The bundled snapshot was updated for these five markets;
no test suite was run for this data-only follow-up.
