"""Plain data types shared across the pipeline."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Source:
    """Provenance record attached to every dataset and metric."""

    name: str
    url: str
    license: str

    def to_dict(self) -> dict:
        return {"name": self.name, "url": self.url, "license": self.license}


@dataclass(frozen=True)
class Metric:
    """One indicator in the catalog (bilingual labels, formatting hints)."""

    id: str
    label: str
    label_en: str
    short_label: str
    short_label_en: str
    unit: str
    unit_en: str
    description: str
    description_en: str
    domain: str
    format: str
    higher_is_better: bool | None
    indicator_code: str
    # Pipeline-only (not serialized): which IndicatorProvider serves this series, and
    # whether a failing/empty fetch may be skipped instead of aborting the run.
    provider: str = "worldbank"
    optional: bool = False

    def to_dict(self, source: Source | None = None) -> dict:
        """Wire format consumed by the frontend (camelCase, optional ``source``)."""
        data = {
            "id": self.id,
            "label": self.label,
            "labelEn": self.label_en,
            "shortLabel": self.short_label,
            "shortLabelEn": self.short_label_en,
            "unit": self.unit,
            "unitEn": self.unit_en,
            "description": self.description,
            "descriptionEn": self.description_en,
            "domain": self.domain,
            "format": self.format,
            "higherIsBetter": self.higher_is_better,
            "indicatorCode": self.indicator_code,
        }
        if source is not None:
            data["source"] = source.to_dict()
        return data
