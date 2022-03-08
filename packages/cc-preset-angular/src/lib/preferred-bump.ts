import { BumpOptionsBase, Commit, WhatBump, WhatBumpResult } from '@public-js/cc-common-types';

import { parserOptions } from './parser-options.js';

const whatBump: WhatBump = (commits: Commit[]): WhatBumpResult => {
    let level = 2;
    let breaks = 0;
    let features = 0;

    for (const commit of commits) {
        if (commit.notes.length > 0) {
            breaks += commit.notes.length;
            level = 0;
        } else if (commit.type === 'feat') {
            features += 1;
            if (level === 2) {
                level = 1;
            }
        }
    }

    return {
        level: level,
        reason:
            breaks === 1
                ? `There is ${breaks} BREAKING CHANGE and ${features} features`
                : `There are ${breaks} BREAKING CHANGES and ${features} features`,
    };
};

export const preferredBump: BumpOptionsBase = {
    parserOpts: parserOptions,
    whatBump,
};
