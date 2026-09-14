import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The publishing workflow, read as text because it only ever runs on GitHub.
 *
 * Each assertion names a mistake that would otherwise surface on release day: a
 * trigger that publishes on an ordinary push, a missing identity token that makes
 * trusted publishing fail, a publish that runs before the tests or before the tag is
 * checked, a version published without provenance or from the wrong package, and a
 * registry token that trusted publishing makes unnecessary and a leak makes costly.
 *
 * What the tag check itself decides is tested by running it, in the library's own
 * tests; here it only matters that the workflow runs it, and runs it first.
 */
const path = fileURLToPath(new URL('../.github/workflows/publish.yml', import.meta.url));

const workflow = (): string => {
  assert.ok(existsSync(path), 'the publishing workflow exists');

  return readFileSync(path, 'utf8');
};

test('it runs when a release is published, and on nothing else', () => {
  const text = workflow();

  assert.match(text, /^on:\s*\n\s+release:\s*\n\s+types:\s*\[\s*published\s*\]/m);
  assert.doesNotMatch(text, /^\s+(push|pull_request|workflow_dispatch|schedule):/m);
});

test('it asks for the identity token trusted publishing authenticates with', () => {
  assert.match(workflow(), /^\s+id-token:\s*write\s*$/m);
});

test('it installs, tests, builds and checks the tag before it publishes the library with provenance', () => {
  const text = workflow();

  const steps = [
    'npm ci',
    'npm test',
    'npm run build',
    'check-release-tag.ts',
    'npm publish --workspace sgf2text --provenance',
  ];
  const positions = steps.map((step) => text.indexOf(step));

  steps.forEach((step, index) => assert.notEqual(positions[index], -1, `${step} is run`));
  assert.deepEqual(
    [...positions].sort((a, b) => a - b),
    positions,
    'the steps run in the order install, test, build, check, publish',
  );
});

test('it names no registry token', () => {
  assert.doesNotMatch(workflow(), /secrets\.|NODE_AUTH_TOKEN|NPM_TOKEN/);
});
