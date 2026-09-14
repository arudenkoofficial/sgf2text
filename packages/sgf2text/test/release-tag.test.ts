import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { execPath } from 'node:process';
import { fileURLToPath } from 'node:url';

/**
 * The check the release workflow runs before it publishes anything.
 *
 * A release drawn with a tag that does not match `package.json` would publish a
 * version nobody named, or fail at npm after the tag is already public. The check
 * stops both before the registry is touched. The version is read from the manifest
 * here rather than written down, so raising it does not break the test.
 */
const script = fileURLToPath(new URL('../scripts/check-release-tag.ts', import.meta.url));
const manifest = fileURLToPath(new URL('../package.json', import.meta.url));

const { version } = JSON.parse(readFileSync(manifest, 'utf8')) as { version: string };

const check = (...args: string[]) => spawnSync(execPath, [script, ...args], { encoding: 'utf8' });

test('a tag naming the version in package.json passes, with or without a leading v', () => {
  assert.equal(check(`v${version}`).status, 0);
  assert.equal(check(version).status, 0);
});

test('a tag naming another version is refused, and the refusal names both', () => {
  const result = check('v999.0.0');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /v999\.0\.0/);
  assert.ok(result.stderr.includes(version), `the message names ${version}`);
});

test('a missing tag is refused', () => {
  assert.notEqual(check().status, 0);
  assert.notEqual(check('').status, 0);
});
