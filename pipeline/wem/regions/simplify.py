"""Douglas-Peucker simplification of ADM1 polygons (keeps files small for the browser)."""

from __future__ import annotations

SIMPLIFY_TOLERANCE_DEGREES = 0.012


def point_line_distance_sq(point: list[float], start: list[float], end: list[float]) -> float:
    dx, dy = end[0] - start[0], end[1] - start[1]
    if dx == 0 and dy == 0:
        return (point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2
    t = max(0.0, min(1.0, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)))
    x, y = start[0] + t * dx, start[1] + t * dy
    return (point[0] - x) ** 2 + (point[1] - y) ** 2


def simplify_path(points: list[list[float]], tolerance: float) -> list[list[float]]:
    if len(points) <= 2:
        return points
    keep = {0, len(points) - 1}
    stack = [(0, len(points) - 1)]
    limit = tolerance * tolerance
    while stack:
        first, last = stack.pop()
        distance, farthest = limit, None
        for index in range(first + 1, last):
            candidate = point_line_distance_sq(points[index], points[first], points[last])
            if candidate > distance:
                distance, farthest = candidate, index
        if farthest is not None:
            keep.add(farthest)
            stack.append((first, farthest))
            stack.append((farthest, last))
    return [points[index] for index in sorted(keep)]


def simplify_ring(ring: list[list[float]]) -> list[list[float]]:
    if len(ring) < 5:
        return [[round(value, 4) for value in point[:2]] for point in ring]
    vertices = [[round(value, 4) for value in point[:2]] for point in ring[:-1]]
    if len(vertices) < 4:
        return vertices + [vertices[0]]
    start = vertices[0]
    split = max(range(1, len(vertices)), key=lambda index: point_line_distance_sq(vertices[index], start, start))
    first = simplify_path(vertices[: split + 1], SIMPLIFY_TOLERANCE_DEGREES)
    second = simplify_path(vertices[split:] + [start], SIMPLIFY_TOLERANCE_DEGREES)
    result = first[:-1] + second[:-1] + [start]
    if len(result) < 4:
        return vertices + [vertices[0]]
    return result


def simplify_polygon(poly: list) -> list:
    return [simplify_ring(ring) for ring in poly]


def simplify_geometry(geometry: dict) -> dict:
    if geometry["type"] == "Polygon":
        return {"type": "Polygon", "coordinates": simplify_polygon(geometry["coordinates"])}
    return {
        "type": "MultiPolygon",
        "coordinates": [simplify_polygon(poly) for poly in geometry["coordinates"]],
    }
