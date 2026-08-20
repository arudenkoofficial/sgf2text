/**
 * Type declarations for `@sabaki/go-board`.
 *
 * The package ships its own, but they describe a CommonJS module in ESM style
 * (`export default GoBoard` in a `.d.ts` next to `module.exports = GoBoard`).
 * Under `nodenext` that makes the default import resolve to a namespace, so
 * the class cannot be used as a type and its statics are invisible. These
 * declarations describe the same runtime shape in a form the compiler can use;
 * `paths` in tsconfig points the module here.
 *
 * Only the surface this project uses is declared.
 */
declare module '@sabaki/go-board' {
  export type Vertex = [number, number];
  export type Sign = 0 | -1 | 1;
  export type SignMap = Sign[][];

  export type MoveOptions = {
    preventSuicide?: boolean;
    preventOverwrite?: boolean;
    preventKo?: boolean;
  };

  export default class GoBoard {
    constructor(signMap?: SignMap);
    static fromDimensions(width: number, height?: number): GoBoard;

    signMap: SignMap;
    width: number;
    height: number;

    get(vertex: Vertex): Sign | null;
    set(vertex: Vertex, sign: Sign): GoBoard;
    has(vertex: Vertex): boolean;

    /** Applies a move and returns the resulting position. Does not mutate. */
    makeMove(sign: Sign, vertex: Vertex, options?: MoveOptions): GoBoard;

    /** The vertices where two positions differ, or null if sizes differ. */
    diff(board: GoBoard): Vertex[] | null;

    getChain(vertex: Vertex): Vertex[];
    getLiberties(vertex: Vertex): Vertex[];
    hasLiberties(vertex: Vertex): boolean;
    getCaptures(sign: Sign): number;
    clone(): GoBoard;

    stringifyVertex(vertex: Vertex): string;
    parseVertex(coord: string): Vertex;
    getHandicapPlacement(count: number): Vertex[];
  }
}
