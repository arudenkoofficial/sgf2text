## 1. Project setup

- [x] 1.1 Add `package.json`: name `sgf2text`, `"type": "module"`, MIT, `engines: ">=24"`, dependencies `@sabaki/sgf` and `@sabaki/go-board`, devDependencies `typescript` and `esbuild`, scripts for test, build and page bundle. No `bin` entry.
- [x] 1.2 Add `tsconfig.json`: `strict`, `nodenext`, `allowImportingTsExtensions`, `rewriteRelativeImportExtensions`, `verbatimModuleSyntax`, emit to `dist/`.
- [x] 1.3 Add `.nvmrc` pinning 26.7.0, `.gitignore` covering `node_modules`, `dist`, `.claude/worktrees`, and the MIT `LICENSE`.
- [x] 1.4 Add `test/fixtures/` with SGF files: a plain game, a game with a pass `B[]`, a game with a comment-only node, a game with two variations, a game whose player name is `FREDDY`, a four-stone handicap game, a game with a captured group, and a game with a ko.
- [x] 1.5 Verify the toolchain end to end: a placeholder test runs through `node --test` on a `.ts` file and `tsc --noEmit` passes.

## 2. Types and coordinates

- [x] 2.1 Write failing tests for `src/coords.ts`: `pd` on 19x19 is `Q16`, the ninth column is `J`, `I` never appears, and `cc` on 9x9 is `C7`.
- [x] 2.2 Define the shared types in `src/types.ts` — `Color`, `Vertex`, `GameEvent`, `GameMeta`, `GameRecord`, `CoordinateSystem` — using erasable syntax only, no `enum`.
- [x] 2.3 Implement `src/coords.ts` with the western coordinate system, behind a named coordinate-system type so another notation can be added later, until the tests pass.

## 3. Parsing

- [x] 3.1 Write failing tests for `src/parse.ts`: metadata from a standard game, `PB[FREDDY]` keeping its `RE`, absent `SZ` defaulting to 19, `SZ[19:9]` rejected, empty and malformed input rejected.
- [x] 3.2 Implement root-property extraction on top of `@sabaki/sgf`, including the result codes `R`, `T`, `F`, draws and unknown values.
- [x] 3.3 Write failing tests for move extraction: modern pass `B[]`, legacy pass `B[tt]` on 19x19 versus a real move on a larger board, comment-only nodes skipped without disturbing numbering, variations limited to the main line.
- [x] 3.4 Implement main-line traversal producing move and pass events.
- [x] 3.5 Write a failing test for setup stones: `HA[4]AB[dd][pd][dp][pp]` yields a setup event with four vertices, and `HA[4]` alone yields none.
- [x] 3.6 Implement setup event extraction from `AB` and `AW`.

## 4. Replay and captures

- [x] 4.1 Write a failing test capturing a single stone, and confirm from it how `@sabaki/go-board` reports the resulting position — this is the risk flagged in the design and must be settled before anything is built on top.
- [x] 4.2 Implement `src/replay.ts` deriving captured vertices by diffing the position before and after each move.
- [x] 4.3 Write failing tests for a captured group, a corner group, a ko recapture, a move that captures nothing, and a move placed on a vertex with no liberties of its own that captures an adjacent group — the last one pins down the removal order; make them pass.
- [x] 4.4 Write a failing test that a handicap setup is placed on the board before the first move, so captures in a handicap game are computed correctly; make it pass.

## 5. Rendering

- [x] 5.1 Write failing tests for `src/render.ts` against a record fixture: metadata block precedes moves, absent metadata lines are omitted rather than printed empty, move numbering is continuous.
- [x] 5.2 Implement the renderer over a locale interface, with no language strings in the renderer itself.
- [x] 5.3 Write failing tests for capture lines (three stones listed by coordinate, singular form for one stone) and handicap lines (four coordinates listed); make them pass.
- [x] 5.4 Write failing tests for result phrasing: `W+R`, `B+3.5`, `B+T`, a draw, and an absent result; make them pass.
- [x] 5.5 Add `src/locales/ru.ts` and `src/locales/en.ts`, each pairing its vocabulary with the coordinate system it uses.
- [x] 5.6 Write a failing test that an unknown locale raises an error naming the supported ones; make it pass.

## 6. Public API

- [x] 6.1 Write failing tests for `src/index.ts`: `sgfToText` with a locale option defaulting to `ru`, and `sgfToRecord` returning a record free of display strings.
- [x] 6.2 Implement `src/index.ts` and confirm `tsc` emits `dist/` with declarations.
- [x] 6.3 Add an end-to-end test converting every fixture in both locales, asserting that none of them throws — the regression net against the five defects of the Japanese converter.

## 7. CLI

- [x] 7.1 Write failing tests running `cli.ts` as a child process: a file path converts to standard output with exit code 0, and piped standard input converts with no path argument.
- [x] 7.2 Implement `cli.ts` reading from a path or standard input.
- [x] 7.3 Write failing tests for `--lang en`, an unsupported language, a missing file, invalid SGF and `--help`, asserting exit codes and that errors go to standard error with no partial standard output; make them pass.

## 8. Web page

- [ ] 8.1 Build `web/index.html`: labelled textarea, `.sgf` file input, language switcher, convert and copy controls, and a result region marked `aria-live="polite"`.
- [ ] 8.2 Implement `web/main.ts` wiring the controls to the core, rendering results and errors with `textContent` only, never `innerHTML` and never `alert`.
- [ ] 8.3 Implement re-rendering the current game when the language changes, and copying the result with a spoken confirmation.
- [ ] 8.4 Add the esbuild bundling script and verify the built page converts a fixture in a browser.
- [ ] 8.5 Walk the page with a screen reader and keyboard only, confirming every control is reachable, named, and that results and errors are announced.

## 9. Delivery

- [ ] 9.1 Add the CI workflow running `node --test` and `tsc --noEmit` on the Node 24 and 26 matrix.
- [ ] 9.2 Add the Pages workflow building `web/` with esbuild and deploying on pushes to the default branch.
- [x] 9.3 Write `README.md`: what the tool is for, how to use the page and the CLI, the supported languages, the main-line-only limitation, credit to aigo.tokyo as prior art, and a note that no personal data of any user appears in this repository.
- [ ] 9.4 Push the repository, enable Pages with GitHub Actions as the source, and confirm the published page converts a real game.
