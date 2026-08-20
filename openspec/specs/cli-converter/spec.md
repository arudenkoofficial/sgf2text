# cli-converter Specification

## Purpose
TBD - created by archiving change add-sgf-text-converter. Update Purpose after archive.
## Requirements
### Requirement: Converting a file from the command line

The system SHALL provide a command-line entry point, run as `node cli.ts <file>`,
that writes the converted text to standard output. It SHALL NOT be registered as a
`bin` entry in `package.json`.

#### Scenario: File converted

- **WHEN** the command is run with the path of a valid SGF file
- **THEN** the converted text is written to standard output and the process exits
  with status 0

#### Scenario: Output redirected to a file

- **WHEN** standard output is redirected
- **THEN** the file receives only the converted text, with no progress or decoration
  mixed in

### Requirement: Reading from standard input

The system SHALL read the game from standard input when no file path is given, so
that it can be used in a pipeline.

#### Scenario: Piped game

- **WHEN** an SGF game is piped into the command with no path argument
- **THEN** the converted text is written to standard output

### Requirement: Choosing the language

The command SHALL accept a `--lang` option selecting the output language, defaulting
to the same locale as the library.

#### Scenario: Explicit language

- **WHEN** the command is run with `--lang en`
- **THEN** the output is rendered in English

#### Scenario: Unsupported language

- **WHEN** the command is run with a language that does not exist
- **THEN** it writes an error naming the supported languages to standard error and
  exits with a non-zero status

### Requirement: Failure reporting

The command SHALL report failures on standard error with a non-zero exit status, and
SHALL NOT write partial output to standard output.

#### Scenario: Missing file

- **WHEN** the given path does not exist
- **THEN** the command writes an error naming the path to standard error and exits
  with a non-zero status

#### Scenario: Invalid game

- **WHEN** the input cannot be parsed as SGF
- **THEN** the command writes the parsing error to standard error, writes nothing to
  standard output, and exits with a non-zero status

### Requirement: Usage help

The command SHALL describe its own usage on request.

#### Scenario: Help requested

- **WHEN** the command is run with `--help`
- **THEN** it prints the usage, the available options and the supported languages,
  and exits with status 0

