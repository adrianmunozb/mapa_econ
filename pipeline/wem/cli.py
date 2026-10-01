"""Command line entry point: ``python -m wem <step> [args]`` / ``all`` / ``list``."""

from __future__ import annotations

import sys
from typing import Sequence

from .paths import Paths
from .steps import STEPS


def _usage() -> str:
    width = max(map(len, STEPS))
    lines = ["usage: python -m wem <step> [step args]", "       python -m wem all", "", "steps:"]
    lines += [f"  {s.name:<{width}}  {s.summary}" for s in STEPS.values()]
    lines += [f"  {'all':<{width}}  every step above except those marked read-only, in order"]
    return "\n".join(lines)


def main(argv: Sequence[str] | None = None, paths: Paths | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    if not argv or argv[0] in {"-h", "--help", "list"}:
        print(_usage())
        return 0 if argv else 2
    name, args = argv[0], argv[1:]
    paths = paths or Paths.default()

    if name == "all":
        for step in (s for s in STEPS.values() if s.in_full_run):
            print(f"\n=== {step.name} ===")
            code = step.run(paths, ())
            if code:
                return code
        return 0
    step = STEPS.get(name)
    if step is None:
        print(f"unknown step: {name}\n\n{_usage()}", file=sys.stderr)
        return 2
    return step.run(paths, args)
