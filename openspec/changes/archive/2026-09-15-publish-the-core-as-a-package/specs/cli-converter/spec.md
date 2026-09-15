## MODIFIED Requirements

### Requirement: Converting a file from the command line

The system SHALL provide a command-line entry point, run as
`node packages/sgf2text/cli.ts <file>`, that writes the converted text to standard
output. It SHALL NOT be registered as a `bin` entry in `package.json`, and it SHALL
NOT be part of the published tarball.

The command belongs to this repository rather than to the package. It lives beside
the sources it exercises, which keeps its fixtures next to the library's own, but
publishing it would turn its flags into an interface strangers could depend on for
a tool written to serve the work here.

#### Scenario: File converted

- **WHEN** the command is run with the path of a valid SGF file
- **THEN** the converted text is written to standard output and the process exits
  with status 0

#### Scenario: Output redirected to a file

- **WHEN** standard output is redirected
- **THEN** the file receives only the converted text, with no progress or decoration
  mixed in

#### Scenario: Absent from what is published

- **WHEN** the package is packed
- **THEN** the command-line entry point is not among the files in the tarball
