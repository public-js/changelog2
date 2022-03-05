import { isAbsolute } from 'node:path';

import { Commit, ConfigObjectBase } from '@public-js/cc-common-types';

import { Context } from './utils/core.t.js';
import { Context as WriterContext } from './utils/writer.t.js';

type PromisedData<TCommit extends Commit = Commit, TContext extends WriterContext = Context> =
    | ConfigObjectBase<TCommit, TContext>
    | Promise<ConfigObjectBase<TCommit, TContext>>;

const unwrapData = (promisedData) => (promisedData instanceof Promise ? promisedData : Promise.resolve(promisedData));

export function presetLoader<TCommit extends Commit = Commit, TContext extends WriterContext = Context>(
    preset: string | { name: string },
): Promise<ConfigObjectBase<TCommit, TContext>> {
    let name = '',
        scope = '',
        absolutePath = '';

    if (typeof preset === 'string') {
        name = preset.toLowerCase();
        if (isAbsolute(preset)) {
            absolutePath = preset;
        }
    } else if (typeof preset === 'object' && preset.name) {
        // Rather than a string preset name, options.preset can be an object
        // with a "name" key indicating the preset to load; additional key/value
        // pairs are assumed to be configuration for the preset. See the documentation
        // for a given preset for configuration available.
        name = preset.name.toLowerCase();
        if (isAbsolute(preset.name)) {
            absolutePath = preset.name;
        }
    } else {
        throw new Error('preset must be string or object with key name');
    }

    if (!absolutePath) {
        // eslint-disable-next-line unicorn/no-lonely-if
        if (name.startsWith('@')) {
            const parts = name.split('/');
            scope = parts.shift() + '/';
            name = parts.join('/');
        } else if (!name.includes('cc-preset-')) {
            name = `@public-js/cc-preset-${name}`;
        }
    }

    try {
        return import(absolutePath || `${scope}${name}`).then(
            (
                imported:
                    | PromisedData<TCommit, TContext>
                    | { default: PromisedData<TCommit, TContext> }
                    | { preset: PromisedData<TCommit, TContext> },
            ) =>
                ('default' in imported && unwrapData(imported.default)) ||
                ('preset' in imported && unwrapData(imported.preset)) ||
                unwrapData(imported),
        );

        // const config = requireMethod(absolutePath || `${scope}${name}`);
        // rather than returning a promise, presets can return a builder function
        // which accepts a config object (allowing for customization) and returns
        // a promise.
        // return config && !config.then && typeof path === 'object' ? config(path) : config;
    } catch {
        throw new Error('does not exist');
    }
}
