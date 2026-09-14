/**
 * Type declarations for `@sabaki/sgf`, which ships none of its own.
 *
 * Only the surface this project uses is declared. The shape follows
 * `node_modules/@sabaki/sgf/src/parse.js`: a node holds its properties in
 * `data`, where every property maps to the list of its values, because SGF
 * allows a property to be repeated (`AB[dd][pd][dp][pp]`).
 */
declare module '@sabaki/sgf' {
  export type SgfNode = {
    id: number | null;
    data: Record<string, string[] | undefined>;
    parent: SgfNode | null;
    children: SgfNode[];
  };

  export type ParseOptions = {
    getId?: () => number;
    dictionary?: Record<string, unknown> | null;
    onProgress?: (event: { progress: number }) => void;
    onNodeCreated?: (event: { node: SgfNode }) => void;
  };

  /**
   * The package builds its exports with `Object.assign(exports, ...)`, which
   * cjs-module-lexer cannot analyse statically, so Node exposes only the
   * default export. Named imports fail at runtime — go through the default.
   */
  const sgf: {
    /** Parses SGF text into the game trees it contains, one per root node. */
    parse(contents: string, options?: ParseOptions): SgfNode[];
    stringify(nodes: SgfNode | SgfNode[]): string;
    escapeString(input: string): string;
    unescapeString(input: string): string;
  };

  export default sgf;
}
