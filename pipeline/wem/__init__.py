"""World Economic Map data pipeline.

Layers (each depends only on the ones above it):

  models / paths / http / jsonio   shared primitives
  catalog/                         static knowledge: metrics, sources, HS2 names
  providers/                       one module per remote API (fetch + pure parsers)
  geometry/ regions/               geometry post-processing and regional matching
  steps/                           orchestration: one runnable stage per output file
  cli                              ``python -m wem <step>`` entry point
"""
