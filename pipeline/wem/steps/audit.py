"""Read-only consistency & sanity audit of snapshot.json.

Flags implausible values and internal inconsistencies so genuine data differences
(e.g. nominal vs PPP GDP) can be told apart from bugs.
"""

from __future__ import annotations

from ..jsonio import read_json
from ..paths import Paths

# Plausible [min, max] per metric; values outside are reported.
PLAUSIBLE_RANGES = {
    "life_expectancy": (35, 90),
    "gini": (15, 70),
    "health_expenditure_gdp": (1, 25),
    "unemployment": (0, 60),
    "inflation": (-15, 200),
    "co2_per_capita": (0, 50),
    "fertility": (0.7, 8),
    "urban_population": (0, 100),
    "internet_users": (0, 100),
    "electricity_access": (0, 100),
    "poverty": (0, 100),
    "education_expenditure": (0, 15),
    "exports_gdp": (0, 240),
    "mobile_subscriptions": (0, 260),
    "gdp_growth": (-30, 35),
}


def _val(c, m):
    mv = c["metrics"].get(m)
    return mv["value"] if mv else None


def _yr(c, m):
    mv = c["metrics"].get(m)
    return mv["year"] if mv else None


def check_nominal_vs_ppp(countries) -> None:
    print("=== 1) BIP/Kopf nominal vs. KKP ===")
    ratios = []
    for c in countries:
        n, p = _val(c, "gdp_per_capita"), _val(c, "gdp_per_capita_ppp")
        if n and p and n > 0:
            ratios.append((p / n, c["name"], n, p))
    ratios.sort()
    if ratios:
        rs = sorted(r[0] for r in ratios)
        print(f"  {len(ratios)} Länder mit beiden Werten")
        print(f"  Verhältnis KKP/nominal: min {rs[0]:.2f}, median {rs[len(rs)//2]:.2f}, max {rs[-1]:.2f}")
        print("  Extreme (Verhältnis < 0.7 oder > 3.5):")
        for r, name, n, p in ratios:
            if r < 0.7 or r > 3.5:
                print(f"    {name}: nominal {n:,.0f} / KKP {p:,.0f} → {r:.2f}")


def check_gdp_consistency(countries) -> None:
    print("\n=== 2) Interne Konsistenz: BIP gesamt / Bevölkerung ≈ BIP/Kopf ===")
    flagged = 0
    for c in countries:
        g, pop, pc = _val(c, "gdp_total"), _val(c, "population"), _val(c, "gdp_per_capita")
        if g and pop and pc and pop > 0 and pc > 0:
            implied = g / pop
            factor = implied / pc
            if factor > 1.4 or factor < 0.71:
                flagged += 1
                print(
                    f"    {c['name']}: BIP/Kopf {pc:,.0f} vs BIP_gesamt/Bev {implied:,.0f} "
                    f"(Faktor {factor:.2f}); Jahre pc={_yr(c,'gdp_per_capita')} "
                    f"total={_yr(c,'gdp_total')} pop={_yr(c,'population')}"
                )
    if not flagged:
        print("  ✓ alle konsistent (Faktor 0.71–1.4)")


def check_ranges(countries) -> None:
    print("\n=== 3) Plausibilitäts-Bereiche ===")
    any_bad = False
    for m, (lo, hi) in PLAUSIBLE_RANGES.items():
        bad = [(c["name"], _val(c, m), _yr(c, m)) for c in countries if _val(c, m) is not None and not (lo <= _val(c, m) <= hi)]
        if bad:
            any_bad = True
            print(f"  {m} außerhalb [{lo}, {hi}]:")
            for name, v, y in bad:
                print(f"    {name}: {v} ({y})")
    if not any_bad:
        print("  ✓ alle Werte in plausiblen Bereichen")


def report_years(countries) -> None:
    print("\n=== 4) Jahre je Metrik ===")
    years: dict[str, list[int]] = {}
    for c in countries:
        for m, mv in c["metrics"].items():
            years.setdefault(m, []).append(mv["year"])
    for m, ys in sorted(years.items()):
        ys.sort()
        print(f"  {m}: {ys[0]}–{ys[-1]} (median {ys[len(ys)//2]}, n={len(ys)})")


def run(paths: Paths, args=()) -> int:
    countries = read_json(paths.snapshot)["countries"]
    for check in (check_nominal_vs_ppp, check_gdp_consistency, check_ranges, report_years):
        check(countries)
    return 0
