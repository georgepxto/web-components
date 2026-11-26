import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeIndex, pad, readMode, readStepHeight, resolveLayout, scrollProgress } from '../dist/steps.js';

test('pad gives two-digit step numbers', () => {
  assert.equal(pad(1), '01');
  assert.equal(pad(4), '04');
  assert.equal(pad(12), '12');
});

test('readMode defaults to reveal', () => {
  assert.equal(readMode(null), 'reveal');
  assert.equal(readMode('reveal'), 'reveal');
  assert.equal(readMode('pinned'), 'pinned');
  assert.equal(readMode('sticky'), 'reveal');
});

test('readStepHeight accepts CSS lengths and falls back to 70vh', () => {
  assert.equal(readStepHeight(null), '70vh');
  assert.equal(readStepHeight('80vh'), '80vh');
  assert.equal(readStepHeight('600px'), '600px');
  assert.equal(readStepHeight(' 50SVH '), '50svh');
  assert.equal(readStepHeight('calc(1px)'), '70vh');
  assert.equal(readStepHeight('10'), '70vh');
  assert.equal(readStepHeight('red; color: blue'), '70vh');
});

test('pinned falls back to a list on narrow screens and with reduced motion', () => {
  assert.equal(resolveLayout('pinned', false, false), 'pinned');
  assert.equal(resolveLayout('pinned', true, false), 'list');
  assert.equal(resolveLayout('pinned', false, true), 'list');
  assert.equal(resolveLayout('reveal', true, true), 'reveal');
});

test('scrollProgress measures the scroll inside the component', () => {
  assert.equal(scrollProgress(200, 2800, 1000), 0);
  assert.equal(scrollProgress(0, 2800, 1000), 0);
  assert.equal(scrollProgress(-900, 2800, 1000), 0.5);
  assert.equal(scrollProgress(-1800, 2800, 1000), 1);
  assert.equal(scrollProgress(-5000, 2800, 1000), 1);
  assert.equal(scrollProgress(10, 500, 1000), 0);
  assert.equal(scrollProgress(-10, 500, 1000), 1);
});

test('activeIndex splits the progress evenly between steps', () => {
  assert.equal(activeIndex(0, 4), 0);
  assert.equal(activeIndex(0.24, 4), 0);
  assert.equal(activeIndex(0.25, 4), 1);
  assert.equal(activeIndex(0.99, 4), 3);
  assert.equal(activeIndex(1, 4), 3);
  assert.equal(activeIndex(0.5, 0), -1);
});
