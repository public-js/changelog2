import { Readable } from 'node:stream';

import { Commit } from '@public-js/cc-common-types';

import { changelogCore } from './changelog-core.js';
import { presetLoader } from './preset-loader.js';
import { Context, CoreConfig } from './utils/core.t.js';
import { Context as WriterContext } from './utils/writer.t.js';

export function changelog<TCommit extends Commit = Commit, TContext extends WriterContext = Context>({
    options,
    context,
    gitRawCommitsOpts,
    parserOpts,
    writerOpts,
}: CoreConfig<TCommit, TContext>): Readable {
    options.warn = options.warn || (() => void 0);
    if (options.preset) {
        try {
            options.config = presetLoader<TCommit, TContext>(options.preset);
        } catch (error) {
            if (typeof options.preset === 'object') {
                options.warn(`Preset: "${options.preset.name}" ${error.message}`);
            } else if (typeof options.preset === 'string') {
                options.warn(`Preset: "${options.preset}" ${error.message}`);
            } else {
                options.warn(`Preset: ${error.message}`);
            }
        }
    }
    return changelogCore({
        options,
        context,
        gitRawCommitsOpts,
        parserOpts,
        writerOpts,
    });
}
