import { ChangelogConfig, ChangelogWriterOptionsBase, CommitsParserOptionsBase } from '@public-js/cc-common-types';

import { CommitAtom } from './commit.t.js';
import { parserOptions } from './parser-options.js';
import { writerOptions } from './writer-options.js';

export const changelog: Promise<ChangelogConfig<CommitAtom>> = Promise.all([
    Promise.resolve(parserOptions),
    writerOptions,
]).then(([parserOpts, writerOpts]: [CommitsParserOptionsBase, ChangelogWriterOptionsBase]) => ({
    parserOpts,
    writerOpts,
}));
