# TODO

What is left after `read-sgf-problems` and the review of it. Neither item is
urgent; both were found by trying inputs rather than by reading code, which is
worth repeating on the next collection of files that turns up.

## `AE` is ignored, so a stone the file removes stays on the board

`parseSetup` in `src/parse.ts` reads `AB` and `AW` and nothing else. `AE` empties
a point, and SGF uses it both to set a position out and to take a stone back
mid-branch:

    (;GM[1]SZ[9]AB[cc][dd]AW[cd][dc]PL[W];W[ce];AE[cc];B[de])

C7 is announced in the position and never removed. The text and the reader's
board still agree with each other — the stone is on both — so this is quieter
than a missed capture, but the position is not the one the file records and the
answer to it may make no sense.

Two halves to it, and they are not the same size. Reading `AE` into the opening
position is a change to `parseSetup` alone. Reading it mid-branch also needs the
rules to accept a removal (`replay` only ever calls `board.set` with a colour)
and wording in both locales, alongside `locale.placed` — say "снято" and it is
indistinguishable from a capture, which is exactly the fact a blind reader is
relying on the converter to get right.

Nothing in the reference collection uses it. Worth checking a few more files
before building the second half.

## An off-board coordinate escapes as an English error

    (;GM[1]SZ[19]PB[a]PW[b];B[zz])

throws a bare `Error("Column 25 cannot be named in western notation")` from
`src/coords.ts` rather than an `SgfError`. It predates this change and is on both
the game and the problem path.

Consequences, in order of how much they matter:

- the web page falls back to `parseFailed`, "Не удалось разобрать файл", which is
  translated and vague but not wrong;
- the CLI prints the English sentence, which is what the whole `SgfError` design
  exists to prevent reaching a reader;
- the exit code is 0, so a script cannot tell the failure happened.

The fix is a code — `unreadable-move` covers it, since a coordinate off the board
is a move that cannot be read — thrown where the column is named. The wording for
it already exists in both languages.
