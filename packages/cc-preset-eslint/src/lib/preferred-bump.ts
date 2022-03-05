import { BumpOptionsBase, WhatBump, WhatBumpResult } from '@public-js/cc-common-types';

import { CommitEslint } from './commit.t.js';
import { parserOptions } from './parser-options.js';

const whatBump: WhatBump = (commits: CommitEslint[]): WhatBumpResult => {
    let level = 2;
    let breaks = 0;
    let features = 0;

    for (const commit of commits) {
        if (!commit.tag) continue;

        if (commit.tag.toLowerCase() === 'breaking') {
            breaks += 1;
            level = 0;
        } else if (commit.tag.toLowerCase() === 'new') {
            features += 1;
            if (level === 2) {
                level = 1;
            }
        }
    }

    return {
        level: level,
        reason: `There are ${breaks} breaking changes and ${features} features`,
    };
};

export const preferredBump: BumpOptionsBase = {
    parserOpts: parserOptions,
    whatBump,
};
