import { ParserOptions } from './parser.t.js';

export type RegexOptions = Partial<ParserOptions>;

export interface RegexOutput {
    notes: RegExp;
    referenceParts: RegExp;
    references: RegExp;
    mentions: RegExp;
}
