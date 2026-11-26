import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickActive, readOffset, scrollTop, sectionId } from '../dist/sections.js';

const page = 'https://example.com/docs/?tab=1#intro';

test('sectionId resolves same-page hash links', () => {
  assert.equal(sectionId('#work', page), 'work');
  assert.equal(sectionId('?tab=1#work', page), 'work');
  assert.equal(sectionId('/docs/?tab=1#work', page), 'work');
  assert.equal(sectionId('#como-funciona', page), 'como-funciona');
  assert.equal(sectionId('#servi%C3%A7os', page), 'serviços');
});

test('sectionId ignores other pages, empty hashes and bad input', () => {
  assert.equal(sectionId('/blog/#work', page), null);
  assert.equal(sectionId('https://other.dev/docs/?tab=1#work', page), null);
  assert.equal(sectionId('#', page), null);
  assert.equal(sectionId('/docs/?tab=1', page), null);
  assert.equal(sectionId('#%E0%A4%A', page), null);
});

test('pickActive returns the last intersecting section in document order', () => {
  const order = ['a', 'b', 'c'];
  assert.equal(pickActive(order, new Set(), false), null);
  assert.equal(pickActive(order, new Set(['a']), false), 'a');
  assert.equal(pickActive(order, new Set(['b', 'a']), false), 'b');
  assert.equal(pickActive(order, new Set(['a']), true), 'c');
  assert.equal(pickActive([], new Set(), true), null);
});

test('scrollTop subtracts the offset and never goes negative', () => {
  assert.equal(scrollTop(400, 1000, 88), 1312);
  assert.equal(scrollTop(10, 0, 88), 0);
});

test('readOffset defaults to 88', () => {
  assert.equal(readOffset(null), 88);
  assert.equal(readOffset(''), 88);
  assert.equal(readOffset('abc'), 88);
  assert.equal(readOffset('120'), 120);
  assert.equal(readOffset('-5'), 0);
});
