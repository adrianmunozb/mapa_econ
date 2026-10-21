import test from 'node:test';
import assert from 'node:assert/strict';
import { clusterWebcams, CAMERA_SEPARATION, CAMERA_MARGIN } from '../src/map/webcamClusters.ts';

const camera = (id, x, y) => ({ id: String(id), coordinates: [x, y] });
const project = ([x, y]) => ({ x, y });

test('neighbours across cell edges join a group, without losing cameras', () => {
  const cameras = [camera(1, 71, 71), camera(2, 73, 73), camera(3, 200, 200)];
  const groups = clusterWebcams(cameras, project, 400, 400);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map(group => group.cameras.length), [2, 1]);
  assert.deepEqual(groups[0].center, cameras[0].coordinates);
});

test('all badges have separation even in dense and diagonal distributions', () => {
  const cameras = Array.from({ length: 10000 }, (_, i) => camera(i, (i * 37) % 1440, (i * 71) % 900));
  const groups = clusterWebcams(cameras, project, 1440, 900);
  assert.equal(groups.reduce((sum, group) => sum + group.cameras.length, 0), cameras.length);
  assert.equal(new Set(groups.flatMap(group => group.cameras.map(camera => camera.id))).size, cameras.length);
  for (let a = 0; a < groups.length; a++) {
    for (let b = a + 1; b < groups.length; b++) {
      assert.ok(Math.hypot(groups[a].x - groups[b].x, groups[a].y - groups[b].y) >= CAMERA_SEPARATION);
    }
  }
  assert.ok(groups.length < 300, 'DOM marker count must stay bounded by screen area');
  assert.deepEqual(clusterWebcams(cameras, project, 1440, 900), groups);
});

test('viewport culling includes badge margin and excludes invalid projections', () => {
  const cameras = [camera(1, -CAMERA_MARGIN, 50), camera(2, 200 + CAMERA_MARGIN, 50), camera(3, -100, 50), camera(4, 9000, 50), camera(5, NaN, 50)];
  const groups = clusterWebcams(cameras, project, 200, 100);
  assert.deepEqual(groups.flatMap(group => group.cameras.map(camera => camera.id)), ['1', '2']);
  assert.deepEqual(clusterWebcams([], project, 200, 100), []);
});

test('coincident cameras remain one selectable group and split when zoom separates them', () => {
  const cameras = Array.from({ length: 5000 }, (_, i) => camera(i, 40, 40));
  assert.equal(clusterWebcams(cameras, project, 400, 400)[0].cameras.length, 5000);
  const nearby = [camera(1, 10, 10), camera(2, 20, 20)];
  assert.equal(clusterWebcams(nearby, project, 400, 400).length, 1);
  assert.equal(clusterWebcams(nearby, ([x, y]) => ({ x: x * 10, y: y * 10 }), 400, 400).length, 2);
});