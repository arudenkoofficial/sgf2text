# TODO

## An off-board coordinate escapes as an English error

    (;GM[1]SZ[19]PB[a]PW[b];B[zz])

throws a bare `Error("Column 25 cannot be named in western notation")` from
`src/coords.ts` rather than an `SgfError`. It predates the problem work and is on
both the game and the problem path.

Consequences, in order of how much they matter:

- the web page falls back to `parseFailed`, "Не удалось разобрать файл", which is
  translated and vague but not wrong;
- the CLI prints the English sentence, which is what the whole `SgfError` design
  exists to prevent reaching a reader;
- the exit code is 0, so a script cannot tell the failure happened.

The fix is a code — `unreadable-move` covers it, since a coordinate off the board
is a move that cannot be read — thrown where the column is named. The wording for
it already exists in both languages. The exit code is a separate line in `cli.ts`
and worth checking against the other failure paths at the same time.
