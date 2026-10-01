#!/usr/bin/env python3
"""Compatibility shim — equivalent to `python -m wem i18n`."""

import sys

from wem.cli import main

if __name__ == "__main__":
    sys.exit(main(["i18n", *sys.argv[1:]]))
