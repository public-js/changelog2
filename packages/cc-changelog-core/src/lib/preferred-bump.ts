import { commitsFilter, commitsParser, CommitsParserOptions } from '@public-js/cc-commits-parser';
import { Callback, Commit, Recommendation } from '@public-js/cc-common-types';
import { rawCommits, semverTags } from '@public-js/cc-git-utils';

import concat from 'concat-stream';

import { presetLoader } from './preset-loader.js';
import { BumpOptions } from './utils/bump.t.js';
import { ConfigObject } from './utils/core.t.js';
import { presetResolver } from './utils/preset-resolver.js';
import { Context as WriterContext } from './utils/writer.t.js';

const VERSIONS = ['major', 'minor', 'patch'];

export function preferredBump<TCommit extends Commit = Commit, TContext extends WriterContext = WriterContext>(
    options: BumpOptions,
    parserOpts?: CommitsParserOptions | undefined,
    cb?: Callback<Recommendation>,
): void {
    if (typeof options !== 'object') {
        throw new TypeError('The "options" argument must be an object');
    }
    if (typeof cb !== 'function') {
        throw new TypeError('You must provide a callback function.');
    }

    const _options: BumpOptions = Object.assign({ ignoreReverted: true }, options);

    let presetPackage = _options.config || {};
    if (_options.preset) {
        try {
            presetPackage = presetLoader<TCommit, TContext>(_options.preset);
        } catch (error) {
            if (error.message === 'does not exist') {
                const preset = typeof _options.preset === 'object' ? _options.preset.name : _options.preset;
                return cb(new Error(`Unable to load the "${preset}" preset package. Please make sure it's installed.`));
            } else {
                return cb(error);
            }
        }
    }

    presetResolver(presetPackage, 'error')
        .then((config: ConfigObject<TCommit, TContext>) => {
            const whatBump = _options.whatBump || config.recommendedBumpOpts?.whatBump || (() => void 0);

            if (typeof whatBump !== 'function') {
                throw new TypeError('whatBump must be a function');
            }

            // For now, we defer to `config.recommendedBumpOpts.parserOpts` if it exists, as our initial refactor
            // efforts created a `parserOpts` object under the `recommendedBumpOpts` object in each preset package.
            // In the future we want to merge differences found in `recommendedBumpOpts.parserOpts` into the top-level
            // `parserOpts` object and remove `recommendedBumpOpts.parserOpts` from each preset package if it exists.
            const _parserOpts = Object.assign(
                {},
                config.recommendedBumpOpts?.parserOpts || config.parserOpts,
                parserOpts || {},
            );
            const warn = typeof _parserOpts.warn === 'function' ? _parserOpts.warn : () => void 0;

            semverTags(
                {
                    lernaTags: !!_options.lernaPackage,
                    package: _options.lernaPackage,
                    tagPrefix: _options.tagPrefix,
                    skipUnstable: _options.skipUnstable,
                },
                (err, tags: string[]) => {
                    if (err) {
                        return cb(err);
                    }

                    rawCommits({
                        format: '%B%n-hash-%n%H',
                        from: tags[0] || '',
                        path: _options.path,
                    })
                        .pipe(commitsParser(_parserOpts))
                        .pipe(
                            concat((data: unknown) => {
                                const commits: Commit[] = _options.ignoreReverted
                                    ? commitsFilter(data as Commit[])
                                    : (data as Commit[]);

                                if (!commits || commits.length === 0) {
                                    warn('No commits since last release');
                                }

                                let result = whatBump(commits, _options);

                                if (result && result.level != null) {
                                    result.releaseType = VERSIONS[result.level];
                                } else if (result == null) {
                                    result = {};
                                }

                                cb(null, result);
                            }),
                        );
                },
            );
        })
        .catch((error) => cb(error));
}
