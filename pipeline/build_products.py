#!/usr/bin/env python3
"""Compatibility shim — equivalent to `python -m wem products`."""

import sys

from wem.cli import main

if __name__ == "__main__":
    sys.exit(main(["products", *sys.argv[1:]]))
