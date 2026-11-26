import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dashOffset, isShown, readShowAfter, readingProgress } from '../dist/progress.js';

test('readingProgress goes from 0 at the top to 1 at the bottom', () => {
  assert.equal(readingProgress(0, 3000, 1000), 0);
  assert.equal(readingProgress(1000, 3000, 1000), 0.5);
  assert.equal(readingProgress(2000, 3000, 1000), 1);
  assert.equal(readingProgress(2500, 3000, 1000), 1);
  assert.equal(readingProgress(-40, 3000, 1000), 0);
});

test('readingProgress is 0 when the page does not scroll', () => {
  assert.equal(readingProgress(0, 800, 800), 0);
  assert.equal(readingProgress(0, 600, 800), 0);
});

test('dashOffset maps progress onto a path length of 100', () => {
  assert.equal(dashOffset(0), 100);
  assert.equal(dashOffset(0.25), 75);
  assert.equal(dashOffset(1), 0);
  assert.equal(dashOffset(3), 0);
});

test('isShown waits for show-after viewports of scrolling', () => {
  assert.equal(isShown(0, 1000, 0.6), false);
  assert.equal(isShown(600, 1000, 0.6), false);
  assert.equal(isShown(601, 1000, 0.6), true);
  assert.equal(isShown(1, 1000, 0), true);
});

test('readShowAfter defaults to 0.6', () => {
  assert.equal(readShowAfter(null), 0.6);
  assert.equal(readShowAfter(''), 0.6);
  assert.equal(readShowAfter('x'), 0.6);
  assert.equal(readShowAfter('1.5'), 1.5);
  assert.equal(readShowAfter('-1'), 0);
});
