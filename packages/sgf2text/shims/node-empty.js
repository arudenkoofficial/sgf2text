/**
 * An empty stand-in for the Node built-ins that `@sabaki/sgf` requires.
 *
 * The parser pulls in `fs`, `buffer` and `string_decoder` for its file-reading
 * entry points (`parseFile`, `parseBuffer`). The web page only ever calls
 * `parse` on a string, so those paths never execute — but the requires sit at
 * module top level, so the bundler still has to resolve them.
 *
 * The requires only destructure or assign, never call, so an empty object is
 * enough. If a future version of the library actually uses one of these at
 * load time, the page breaks loudly rather than silently, which is what we
 * want: the alternative is shipping a Node polyfill nobody needs.
 */
export default {};
