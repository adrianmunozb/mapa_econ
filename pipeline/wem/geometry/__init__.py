"""Geometry post-processing for the Natural Earth borders."""

from .adjustments import Adjustment, ParallelTransfer, apply_adjustments
from .registry import DEFAULT_ADJUSTMENTS

__all__ = ["Adjustment", "ParallelTransfer", "apply_adjustments", "DEFAULT_ADJUSTMENTS"]
