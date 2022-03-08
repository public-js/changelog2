import { Commit } from './commit.t.js';
import { CommitsParserOptionsBase } from './commits-parser.t.js';

export interface WhatBumpResult {
    level?: number | undefined;
    reason?: string | undefined;
}

export type WhatBump = (commits: Commit[], options?: BumpOptionsBase) => WhatBumpResult;

export type ReleaseType = 'major' | 'minor' | 'patch';
export type ReleaseTypePre = ReleaseType | 'prerelease' | 'premajor' | 'preminor' | 'prepatch';

export interface Recommendation extends WhatBumpResult {
    releaseType?: ReleaseType | undefined;
}

export interface BumpOptionsBase {
    whatBump?: WhatBump | undefined;
    parserOpts?: CommitsParserOptionsBase | undefined;
}
