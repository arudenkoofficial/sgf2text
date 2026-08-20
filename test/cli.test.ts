import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { execPath } from 'node:process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../cli.ts', import.meta.url));
const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

const run = (args: string[], input?: string) =>
  spawnSync(execPath, [cli, ...args], { encoding: 'utf8', input: input ?? '' });

test('converts a file to standard output', () => {
  const result = run([fixture('plain.sgf')]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Чёрные/);
  assert.match(result.stdout, /Q16/);
  assert.equal(result.stderr, '', 'nothing is written to standard error on success');
});

test('writes only the converted text, with no decoration', () => {
  const result = run([fixture('capture-single.sgf')]);
  const lines = result.stdout.trimEnd().split('\n');

  assert.equal(lines[0], 'Размер доски: 9×9');
  assert.equal(lines.at(-1), '3. Чёрные A8 — снято 1 камень белых: A9');
});

test('reads the game from standard input when no path is given', () => {
  const result = run([], '(;GM[1]SZ[19]PB[Alice]PW[Bob];B[pd];W[dp])');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Q16/);
});

test('renders in the requested language', () => {
  const spaced = run(['--lang', 'en', fixture('plain.sgf')]);
  assert.equal(spaced.status, 0);
  assert.match(spaced.stdout, /Black/);

  const equals = run([`--lang=en`, fixture('plain.sgf')]);
  assert.equal(equals.status, 0);
  assert.match(equals.stdout, /Black/);
});

test('rejects a language it does not support', () => {
  const result = run(['--lang', 'ja', fixture('plain.sgf')]);

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '', 'no partial output is written');
  assert.match(result.stderr, /ru/);
  assert.match(result.stderr, /en/);
});

test('reports a missing file', () => {
  const result = run(['no-such-game.sgf']);

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /no-such-game\.sgf/);
});

test('reports a file that is not a game record', () => {
  const result = run([], 'this is not a game record');

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /SGF/i);
});

test('prints its usage on request', () => {
  const result = run(['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /--lang/);
  assert.match(result.stdout, /ru, en/);
});
