#!/usr/bin/env python3
"""Compatibility shim — equivalent to `python -m wem timeseries`."""

import sys

from wem.cli import main

if __name__ == "__main__":
    sys.exit(main(["timeseries", *sys.argv[1:]]))
