import { promisify } from 'node:util';

import { Commit } from '@public-js/cc-common-types';

import { Config, ConfigObject } from './core.t.js';
import { Context as WriterContext } from './writer.t.js';

export function presetResolver<TCommit extends Commit = Commit, TContext extends WriterContext = WriterContext>(
    loadedPreset: Config<TCommit, TContext>,
    onFail: 'error' | 'null',
): Promise<ConfigObject<TCommit, TContext>> {
    switch (typeof loadedPreset) {
        case 'function':
            return promisify<ConfigObject<TCommit, TContext>>(loadedPreset)();
        case 'object':
            return Promise.resolve(loadedPreset);
        default: {
            if (onFail === 'null') {
                return Promise.resolve(null);
            }
            throw new Error('Preset must be a promise, function, or object');
        }
    }
}
