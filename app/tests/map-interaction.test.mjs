import test from 'node:test';
import assert from 'node:assert/strict';
import { frameCoalescer, nextFill } from '../src/map/interaction.ts';
import { numberFormatter } from '../src/lib/numberFormat.ts';

test('pointer storms emit the latest value once per frame, including frame id zero', () => {
  let callback; const emitted = []; let requests = 0; const canceled = [];
  const queue = frameCoalescer(value => emitted.push(value), cb => { callback = cb; return requests++; }, id => canceled.push(id));
  for (let i = 0; i < 1000; i++) queue.push(i);
  assert.equal(requests, 1);
  assert.deepEqual(emitted, []);
  callback(16);
  assert.deepEqual(emitted, [999]);
  queue.push('next');
  queue.cancel();
  assert.deepEqual(canceled, [1]);
  queue.push(null);
  callback(32);
  assert.deepEqual(emitted, [999, null]);
});

test('crossfade retains the displayed expression while updating the other slot', () => {
  const first = ['get', 'gdp']; const second = ['get', 'population']; const third = '#ff0000';
  const initial = { expression: first, colors: [first, first], active: 0 };
  assert.equal(nextFill(initial, first), initial);
  const next = nextFill(initial, second);
  assert.equal(next.active, 1);
  assert.equal(next.colors[0], first);
  assert.equal(next.colors[1], second);
  const last = nextFill(next, third);
  assert.equal(last.active, 0);
  assert.equal(last.colors[1], second);
  assert.deepEqual(initial.colors, [first, first]);
});

test('number formatter reuse preserves rounding, negative signs and compact notation', () => {
  for (const locale of ['en-US', 'es-ES']) {
    for (const notation of ['standard', 'compact']) {
      for (const maximumFractionDigits of [0, 1, 3]) {
        const options = { notation, maximumFractionDigits };
        const formatter = numberFormatter(locale, options);
        assert.equal(numberFormatter(locale, options), formatter);
        for (const value of [-1e12, -0.05, 0, 0.125, 99.99, 123456789]) {
          assert.equal(formatter.format(value), new Intl.NumberFormat(locale, options).format(value));
        }
      }
    }
  }
});
