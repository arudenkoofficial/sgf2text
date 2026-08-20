## Why

A blind Go player can save a finished game from any server, but the saved file is
SGF — a dense machine format that a screen reader reads as gibberish. The game is
therefore unreplayable: without a spoken move list there is no way to set the
stones out on a tactile board and study what happened. The only converter that
exists today is the Japanese one at https://aigo.tokyo/sgf-txt, which answers in
Japanese only, and which — verified by running its code — throws an error on any
game containing a pass or a comment, and silently corrupts games containing
variations.

## What Changes

- New package `sgf2text` converting SGF into a numbered, spoken-language move list.
- Output states, for every move, which player played where; for a capturing move it
  also names the stones that must be taken off the board — information the Japanese
  converter never provides, yet without which a tactile board cannot be kept in sync
  with the record.
- Handicap games list the coordinates of each handicap stone, not merely how many.
- Three languages: Russian, English and Japanese. Each carries its own coordinate
  convention, because Japanese notation numbers columns right-to-left while western
  notation letters them left-to-right.
- Coordinates in Russian and English match what the existing OGS userscript speaks
  during live play (`A-T` without `I`, rows counted bottom-up), so a player hears the
  same board described the same way live and in review.
- A web page on GitHub Pages that works with a screen reader: a real textarea, file
  upload for `.sgf`, results announced through a live region, and errors printed on
  the page rather than thrown into a modal dialog.
- A CLI for converting files locally and in bulk.
- Games that defeat the Japanese converter — passes, comments, variations, player
  names containing property letters — convert correctly.

## Capabilities

### New Capabilities
- `game-record`: parsing an SGF file into a neutral, language-independent record of
  the game, replaying it under Go rules so that captured stones are known.
- `text-rendering`: turning that record into a screen-reader-friendly text in a
  chosen language, including that language's coordinate convention.
- `web-converter`: an accessible browser page that converts pasted or uploaded SGF.
- `cli-converter`: a command-line entry point for converting files.

### Modified Capabilities

None — this is a new project.

## Impact

- New standalone public repository, MIT licensed, published to npm as `sgf2text`.
- Runtime dependencies: `@sabaki/sgf` for parsing, `@sabaki/go-board` for replay.
  Both MIT.
- Development on Node 26.7.0; the package supports Node >= 24 so it installs on the
  current LTS.
- GitHub Actions publishes the web page to GitHub Pages and runs tests on Node 24
  and 26.
- The `sgfToRecord` half of the API is deliberately public so the existing
  `ogs-voice-assistant` userscript can later reuse the parsing and capture logic
  without the text layer.
