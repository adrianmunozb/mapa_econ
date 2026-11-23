"""Explicit DOSE-region -> boundary-name exceptions.

Some DOSE regions are reported under an aggregate name, or use a synonym for the
current boundary name. Keeping these explicit avoids silent, unsafe fuzzy matches.
"""

from __future__ import annotations

ALIASES: dict[tuple[str, str], list[str]] = {
    ("ESP", "Ceuta y Melilla"): ["Ciudad Autónoma de Ceuta", "Ciudad Autónoma de Melilla"],
    ("ESP", "Comunidad Valenciana"): ["Comunitat Valenciana"],
    ("ESP", "Cataluña"): ["Catalunya"],
    ("ESP", "País Vasco"): ["Euskadi"],
    ("IND", "Andaman Nicobar"): ["Andaman and Nicobar Islands"],
    ("IND", "Chattisgarh"): ["Chhattisgarh"],
    ("IND", "Jammu & Kashmir"): ["Jammu and Kashmir", "Ladakh"],
    ("CHN", "Ningxia"): ["Ningxia Ningxia Hui Autonomous Region"],
    ("CZE", "Central Bohemia Region"): ["Středočeský kraj"],
    ("CZE", "Prague"): ["Hlavní město Praha"],
    ("CZE", "South Bohemia Region"): ["Jihočeský kraj"],
    ("CZE", "The Hradec Kralove Region"): ["Královéhradecký kraj"],
    ("CZE", "The Karlovy Vary Region"): ["Karlovarský kraj"],
    ("CZE", "The Liberec Region"): ["Liberecký kraj"],
    ("CZE", "The Moravian-Silesian Region"): ["Moravskoslezský kraj"],
    ("CZE", "The Olomouc Region"): ["Olomoucký kraj"],
    ("CZE", "The Pardubice Region"): ["Pardubický kraj"],
    ("CZE", "The Plzen Region"): ["Plzeňský kraj"],
    ("CZE", "The South Moravian Region"): ["Jihomoravský kraj"],
    ("CZE", "The Usti Region"): ["Ústecký kraj"],
    ("CZE", "The Vysocina Region"): ["Kraj Vysočina"],
    ("CZE", "The Zlin Region"): ["Zlínský kraj"],
    ("POL", "Dolnośląskie"): ["Lower Silesian Voivodeship"],
    ("POL", "Kujawsko-Pomorskie"): ["Kuyavian-Pomeranian Voivodeship"],
    ("POL", "Lubelskie"): ["Lublin Voivodeship"],
    ("POL", "Lubuskie"): ["Lubusz Voivodeship"],
    ("POL", "Mazowieckie"): ["Masovian Voivodeship"],
    ("POL", "Małopolskie"): ["Lesser Poland Voivodeship"],
    ("POL", "Opolskie"): ["Opole Voivodeship"],
    ("POL", "Podkarpackie"): ["Subcarpathian Voivodeship"],
    ("POL", "Podlaskie"): ["Podlaskie Voivodeship"],
    ("POL", "Pomorskie"): ["Pomeranian Voivodeship"],
    ("POL", "Warmińsko-Mazurskie"): ["Warmian-Masurian Voivodeship"],
    ("POL", "Wielkopolskie"): ["Greater Poland Voivodeship"],
    ("POL", "Zachodniopomorskie"): ["West Pomeranian Voivodeship"],
    ("POL", "Łódzkie"): ["Łódź Voivodeship"],
    ("POL", "Śląskie"): ["Silesian Voivodeship"],
    ("POL", "Świętokrzyskie"): ["Świętokrzyskie Voivodeship"],
}
