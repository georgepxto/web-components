import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attributeName, isTheme, opposite, readTheme, writeTheme } from '../dist/theme.js';
import { labelsFor } from '../dist/i18n.js';

const target = (attributes = {}, classes = []) => {
  const list = new Set(classes);
  return {
    attributes,
    list,
    getAttribute: (name) => attributes[name] ?? null,
    setAttribute: (name, value) => {
      attributes[name] = value;
    },
    classList: {
      contains: (token) => list.has(token),
      add: (token) => list.add(token),
      remove: (token) => list.delete(token),
    },
  };
};

test('isTheme accepts only light and dark', () => {
  assert.equal(isTheme('light'), true);
  assert.equal(isTheme('dark'), true);
  assert.equal(isTheme('sepia'), false);
  assert.equal(isTheme(null), false);
});

test('opposite flips the theme', () => {
  assert.equal(opposite('light'), 'dark');
  assert.equal(opposite('dark'), 'light');
});

test('attributeName falls back to data-theme for missing or invalid names', () => {
  assert.equal(attributeName(null), 'data-theme');
  assert.equal(attributeName(''), 'data-theme');
  assert.equal(attributeName('1bad'), 'data-theme');
  assert.equal(attributeName('x" onload="y'), 'data-theme');
  assert.equal(attributeName('data-mode'), 'data-mode');
  assert.equal(attributeName('class'), 'class');
});

test('reads and writes an attribute', () => {
  const element = target({ 'data-theme': 'light' });
  assert.equal(readTheme(element, 'data-theme'), 'light');
  writeTheme(element, 'data-theme', 'dark');
  assert.equal(element.attributes['data-theme'], 'dark');
  assert.equal(readTheme(target({ 'data-theme': 'blue' }), 'data-theme'), null);
});

test('class mode swaps the light and dark classes', () => {
  const element = target({}, ['page', 'light']);
  assert.equal(readTheme(element, 'class'), 'light');
  writeTheme(element, 'class', 'dark');
  assert.deepEqual([...element.list].sort(), ['dark', 'page']);
  assert.equal(readTheme(element, 'class'), 'dark');
  assert.equal(readTheme(target(), 'class'), null);
});

test('labels follow the language and accept overrides', () => {
  assert.equal(labelsFor('pt-BR').hintOn, 'puxe para acender');
  assert.equal(labelsFor('es').hintOff, 'tira para apagar');
  assert.equal(labelsFor('ja').label, 'Light mode');
  assert.equal(labelsFor('en', { hintOn: 'lights on' }).hintOn, 'lights on');
});
