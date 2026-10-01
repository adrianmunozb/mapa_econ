"""Natural Earth admin-0 country borders (1:50m: includes small states the 110m drops)."""

from __future__ import annotations

from ..http import HttpClient

URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "master/geojson/ne_50m_admin_0_countries.geojson"
)

# NE uses proprietary codes for entities ISO has not coded. The ISO_A3 -> ISO_A3_EH ->
# ADM0_A3 ladder resolves all fully-recognised countries; only Kosovo needs an override
# so its polygon (KOS) joins World Bank data (XKX).
ISO3_OVERRIDE = {"KOS": "XKX"}


def resolve_iso3(props: dict) -> str | None:
    """Canonical ISO3 via the NE fallback ladder + override."""
    for key in ("ISO_A3", "ISO_A3_EH", "ADM0_A3"):
        val = props.get(key)
        if val and val != "-99":
            return ISO3_OVERRIDE.get(val, val)
    return None


def slim_features(geojson: dict) -> set[str]:
    """Reduce properties to ``{iso3, name}`` in place; return the ISO3 codes present."""
    present: set[str] = set()
    for feat in geojson.get("features", []):
        props = feat.get("properties", {})
        iso3 = resolve_iso3(props)
        name = props.get("NAME") or props.get("ADMIN") or props.get("NAME_LONG")
        feat["properties"] = {"iso3": iso3, "name": name}
        if iso3:
            present.add(iso3)
    return present


def fetch_borders(http: HttpClient) -> dict:
    return http.get_json(URL)
