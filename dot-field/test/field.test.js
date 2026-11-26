import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeAlpha, defaults, dotRadius, grid, influence, readNumber } from '../dist/field.js';

test('readNumber parses, clamps and falls back', () => {
  assert.equal(readNumber(null, 24, 4, 400), 24);
  assert.equal(readNumber('', 24, 4, 400), 24);
  assert.equal(readNumber('abc', 24, 4, 400), 24);
  assert.equal(readNumber('32', 24, 4, 400), 32);
  assert.equal(readNumber('1', 24, 4, 400), 4);
  assert.equal(readNumber('9999', 24, 4, 400), 400);
});

test('defaults match the documented values', () => {
  assert.deepEqual(defaults, { gap: 24, radius: 140, dotSize: 1, grow: 3.5 });
});

test('grid centres the dots in the box', () => {
  const layout = grid(100, 50, 24);
  assert.equal(layout.columns, 5);
  assert.equal(layout.rows, 3);
  assert.equal(layout.x, 2);
  assert.equal(layout.y, 1);
  assert.deepEqual(grid(0, 50, 24), { columns: 0, rows: 0, x: 0, y: 0 });
});

test('influence falls off smoothly to zero at the radius', () => {
  assert.equal(influence(0, 140), 1);
  assert.equal(influence(140, 140), 0);
  assert.equal(influence(300, 140), 0);
  assert.equal(influence(70, 140), 0.5);
  assert.ok(influence(35, 140) > influence(70, 140));
  assert.equal(influence(10, 0), 0);
});

test('dots grow to size × grow at full strength', () => {
  assert.equal(dotRadius(1, 3.5, 0), 1);
  assert.equal(dotRadius(1, 3.5, 1), 3.5);
  assert.equal(dotRadius(2, 3, 0.5), 4);
});

test('active opacity goes from 0.3 to 1', () => {
  assert.equal(activeAlpha(0), 0.3);
  assert.equal(activeAlpha(1), 1);
  assert.equal(activeAlpha(2), 1);
});
