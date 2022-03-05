import { ChangelogConfig, ChangelogWriterOptionsBase, CommitsParserOptionsBase } from '@public-js/cc-common-types';

import { parserOptions } from './parser-options.js';
import { writerOptions } from './writer-options.js';

export const changelog: Promise<ChangelogConfig> = Promise.all([Promise.resolve(parserOptions), writerOptions]).then(
    ([parserOpts, writerOpts]: [CommitsParserOptionsBase, ChangelogWriterOptionsBase]) => ({
        parserOpts,
        writerOpts,
    }),
);
