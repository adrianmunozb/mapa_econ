import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareCable, cablePulses } from '../src/map/cableFlow.ts';
import { cableProgress, cableRenderRoutes } from '../src/map/cableGeometry.ts';

test('flat GPU cable paths retain all coordinates, including continuous dateline crossings', () => {
  const raw = { id: 'pacific', name: 'Pacific', owners: 'test', lengthKm: 1, points: [[170, 40], [-175, 42], [-160, 35]] };
  const prepared = prepareCable(raw);
  const [gpu] = cableRenderRoutes([prepared]);
  assert.ok(gpu.path instanceof Float64Array);
  assert.deepEqual([...gpu.path], prepared.points.flat());
  assert.ok(gpu.path.at(-2) > 180);
  assert.deepEqual(raw.points, [[170, 40], [-175, 42], [-160, 35]]);
});

test('GPU segment distances and phases match the existing packet timing', () => {
  const route = prepareCable({ id: 'straight', name: 'Straight', owners: 'test', lengthKm: 1, points: [[0, 0], [52, 0]] });
  const routes = cableRenderRoutes([route, route]);
  const progress = cableProgress(routes);
  assert.equal(progress.length, routes.reduce((n, r) => n + r.points.length, 0) * 3);
  let offset = 0;
  routes.forEach((r, index) => {
    r.distances.forEach((distance, vertex) => {
      assert.ok(Math.abs(progress[offset++] - distance) < 1e-4);
      assert.ok(Math.abs(progress[offset++] - r.distances[Math.min(vertex + 1, r.distances.length - 1)]) < 1e-4);
      assert.equal(progress[offset++], index * 7);
    });
    for (const seconds of [0, 1, 2.5, 10]) {
      const reference = cablePulses([r], seconds + index * 7 / 5);
      for (let distance = 0.37; distance < r.total; distance++) {
        const phase = ((seconds * 5 + index * 7 - distance) % 26 + 26) % 26;
        const insideReference = reference.some(pulse => distance > pulse.points[0][0] && distance <= pulse.points.at(-1)[0]);
        assert.equal(phase < 4, insideReference);
      }
    }
  });
  assert.equal(cableProgress([]).length, 0);
});
