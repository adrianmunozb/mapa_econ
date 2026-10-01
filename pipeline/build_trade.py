#!/usr/bin/env python3
"""Compatibility shim — equivalent to `python -m wem trade`."""

import sys

from wem.cli import main

if __name__ == "__main__":
    sys.exit(main(["trade", *sys.argv[1:]]))
