"""Name normalisation used to join DOSE region names to boundary shape names."""

from __future__ import annotations

import re
import unicodedata


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", "", value)


ADMIN_NAME_TOKENS = {
    "and", "autonomous", "city", "county", "department", "district", "hui", "municipality",
    "of", "prefecture", "province", "region", "special", "state", "the", "voivodeship",
    "uyghur", "zhuang",
}


def normalize_admin_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    tokens = [token for token in re.findall(r"[a-z0-9]+", value) if token not in ADMIN_NAME_TOKENS]
    collapsed: list[str] = []
    for token in tokens:
        if not collapsed or token != collapsed[-1]:
            collapsed.append(token)
    return "".join(collapsed)
