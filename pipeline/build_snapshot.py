#!/usr/bin/env python3
"""Compatibility shim — equivalent to `python -m wem snapshot`."""

import sys

from wem.cli import main

if __name__ == "__main__":
    sys.exit(main(["snapshot", *sys.argv[1:]]))
