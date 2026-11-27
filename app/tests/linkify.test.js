import assert from 'node:assert/strict';
import test from 'node:test';
import { linkSegments } from '../src/linkify.js';

const links = (text) => linkSegments(text).filter((segment) => segment.href);

test('segments cover the whole text in order', () => {
  const text = 'Read https://example.org/guide, then ask @alex.example.org.';
  assert.equal(linkSegments(text).map((segment) => segment.text).join(''), text);
  assert.deepEqual(links(text), [
    { text: 'https://example.org/guide', href: 'https://example.org/guide' },
    { text: '@alex.example.org', href: 'https://bsky.app/profile/alex.example.org' },
  ]);
});

test('trailing punctuation stays outside the link', () => {
  for (const [text, linked] of [
    ['See https://example.org.', 'https://example.org'],
    ['See https://example.org/a?b=1!', 'https://example.org/a?b=1'],
    ['Is it example.org/path?', 'example.org/path'],
    ['“https://example.org/quoted”', 'https://example.org/quoted'],
    ['One, https://example.org/x;', 'https://example.org/x'],
  ]) assert.equal(links(text)[0]?.text, linked, text);
});

test('brackets close outside the link unless the address opens them', () => {
  assert.equal(links('(see https://example.org/guide)')[0].text, 'https://example.org/guide');
  assert.equal(links('https://en.wikipedia.org/wiki/Repair_(disambiguation)')[0].text, 'https://en.wikipedia.org/wiki/Repair_(disambiguation)');
  assert.equal(links('[example.org/docs]')[0].text, 'example.org/docs');
  assert.equal(links('(@alex.example.org)')[0].text, '@alex.example.org');
  assert.equal(links('[ https://example.org/docs]')[0].text, 'https://example.org/docs');
});

test('bare domains link over HTTPS only with a known top-level domain', () => {
  assert.deepEqual(links('Find us at example.org/path today'), [{ text: 'example.org/path', href: 'https://example.org/path' }]);
  assert.equal(links('Repair.Cafe hosts us')[0].href, 'https://repair.cafe/');
  assert.equal(links('http://example.org/plain')[0].href, 'http://example.org/plain');
  for (const text of ['e.g. a guide', 'i.e. this', 'version 0.7.0', 'v0.7.0 shipped', 'built with Node.js', 'one.two.three']) {
    assert.deepEqual(links(text), [], text);
  }
});

test('mentions need a valid handle with a known top-level domain', () => {
  assert.equal(links('Thanks @Alex.Bsky.Social!')[0].href, 'https://bsky.app/profile/alex.bsky.social');
  for (const text of ['@alex', '@0.7.0', 'mail me@example.org', '@-bad.example.org', '@alex.notatld']) {
    assert.deepEqual(links(text), [], text);
  }
});

test('only web addresses are linked; other schemes and credentials are refused', () => {
  for (const text of [
    'javascript:alert(1)',
    'javascript://example.org/%0aalert(1)',
    'data:text/html,<script>alert(1)</script>',
    'ftp://example.org/file',
    'https://user:secret@example.org/',
  ]) {
    assert.deepEqual(links(text), [], text);
    assert.equal(linkSegments(text).map((segment) => segment.text).join(''), text);
  }
});

test('links inside other words are not detected', () => {
  assert.deepEqual(links('abc https://example.org'.replace(' ', '')), []);
  assert.deepEqual(links('x@example.org'), []);
});

test('empty and non-string input give no segments', () => {
  assert.deepEqual(linkSegments(''), []);
  assert.deepEqual(linkSegments(undefined), []);
});
