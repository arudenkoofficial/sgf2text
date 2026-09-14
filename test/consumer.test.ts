import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sgfToText } from 'sgf2text';

/**
 * The package as a consumer reaches it: by name, through `node_modules`, and so
 * through the `exports` map rather than a path into the sources.
 *
 * Imported from the repository root, where `sgf2text` resolves through the workspace
 * link exactly as it would through an install. From inside the package the same
 * import would resolve to the package itself, which is not the route anyone else
 * takes. A wrong entry in `exports` fails here before it fails for a stranger.
 */
test('the package converts a game when imported by its name', () => {
  // One black stone on a 9×9 board. `ee` is the fifth column, and counting rows
  // from the bottom it is also the fifth row.
  const text = sgfToText('(;GM[1]FF[4]SZ[9];B[ee])', { locale: 'en' });

  assert.match(text, /^1\. Black E5$/m);
});
