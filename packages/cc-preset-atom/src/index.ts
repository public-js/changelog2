import {
    BumpOptionsBase,
    ChangelogConfig,
    ChangelogWriterOptionsBase,
    CommitsParserOptionsBase,
} from '@public-js/cc-common-types';

import { changelog } from './lib/changelog.js';
import { parserOptions } from './lib/parser-options.js';
import { preferredBump } from './lib/preferred-bump.js';
import { writerOptions } from './lib/writer-options.js';

export default Promise.all([
    changelog,
    Promise.resolve(parserOptions),
    Promise.resolve(preferredBump),
    writerOptions,
]).then(
    ([conventionalChangelog, parserOpts, recommendedBumpOpts, writerOpts]: [
        ChangelogConfig,
        CommitsParserOptionsBase,
        BumpOptionsBase,
        ChangelogWriterOptionsBase,
    ]) => ({
        conventionalChangelog,
        parserOpts,
        recommendedBumpOpts,
        writerOpts,
    }),
);
