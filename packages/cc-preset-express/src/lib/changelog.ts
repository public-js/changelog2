import { ChangelogConfig, ChangelogWriterOptionsBase, CommitsParserOptionsBase } from '@public-js/cc-common-types';

import { CommitExpress } from './commit.t.js';
import { parserOptions } from './parser-options.js';
import { writerOptions } from './writer-options.js';

export const changelog: Promise<ChangelogConfig<CommitExpress>> = Promise.all([
    Promise.resolve(parserOptions),
    writerOptions,
]).then(([parserOpts, writerOpts]: [CommitsParserOptionsBase, ChangelogWriterOptionsBase]) => ({
    parserOpts,
    writerOpts,
}));
