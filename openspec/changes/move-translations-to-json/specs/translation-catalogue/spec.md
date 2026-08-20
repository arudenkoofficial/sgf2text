## ADDED Requirements

### Requirement: Translations are data

The wording of every language SHALL live in a JSON file containing only text, with
no code, so that a translator can edit it without touching the program.

#### Scenario: A translator edits wording

- **WHEN** a value in a language's JSON file is changed
- **THEN** the converted output uses the new wording, and no other file needs
  changing

#### Scenario: Logic is not duplicated per language

- **WHEN** a new language is added
- **THEN** no new module of localisation logic is written: the language consists of
  its JSON file and its registration

### Requirement: Placeholders

Translated strings SHALL express variable parts as named placeholders, which the
loader substitutes.

#### Scenario: A move line is assembled

- **WHEN** a move template such as `{n}. {color} {coordinate}` is rendered with a
  move number, a colour and a vertex
- **THEN** each placeholder is replaced by its value

#### Scenario: A placeholder has no value

- **WHEN** a template names a placeholder the renderer does not supply
- **THEN** the system raises an error naming the template and the placeholder, and
  never emits the literal `{placeholder}` or the word `undefined` into the output

### Requirement: Plural forms by CLDR category

Where a string depends on a count, the translation SHALL provide one variant per
plural category the language uses, named by its CLDR category, and the loader SHALL
choose between them with `Intl.PluralRules` for that language.

#### Scenario: Russian plural categories

- **WHEN** the number of captured stones is 1, 2 and 5 in Russian
- **THEN** the output reads `1 камень`, `2 камня` and `5 камней` respectively

#### Scenario: Russian teens and compounds

- **WHEN** the count is 11, 21 or 104
- **THEN** the form follows the language rule rather than the last digit alone

#### Scenario: A language with two forms

- **WHEN** the count is 1 and then 2 in English
- **THEN** the output reads `1 stone` and `2 stones`, using only the categories that
  language declares

### Requirement: Every language is complete

The system SHALL verify that all language files carry the same set of keys.

#### Scenario: A key is missing from a translation

- **WHEN** one language file lacks a key another language defines
- **THEN** the test suite fails, naming the language and the missing key

#### Scenario: A key is misspelled in code

- **WHEN** the renderer asks for a key that the translations do not define
- **THEN** type checking fails, because the key type is derived from the
  translation files themselves

### Requirement: A language keeps its coordinate system

Registering a language SHALL pair it with the coordinate system its readers expect,
which is independent of its wording.

#### Scenario: Two languages sharing a notation

- **WHEN** Russian and English are rendered
- **THEN** both use western coordinates, and the pairing is stated once per
  language rather than assumed by the renderer

### Requirement: Output is unchanged by this refactor

The converted text SHALL be identical, character for character, to what the
TypeScript locales produced.

#### Scenario: The existing suite still passes

- **WHEN** the test suite written for the previous implementation is run unchanged
- **THEN** every test passes
