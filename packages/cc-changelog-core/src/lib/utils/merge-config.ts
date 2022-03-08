import { readFileSync } from 'node:fs';
import { URL as nodeUrl } from 'node:url';

import { Commit } from '@public-js/cc-common-types';
import { getPkgRepo, GetPkgRepoOutput, semverTags } from '@public-js/cc-git-utils';

import dateFormat from 'dateformat';
import gitRemoteOriginUrl from 'git-remote-origin-url';
import normalizePackageData from 'normalize-package-data';
import { NormalizedPackageJson, readPackage } from 'read-pkg';
import { NormalizedReadResult, readPackageUp } from 'read-pkg-up';

import { ConfigObject, Context, HostOptions, MergeConfigInput, MergedConfig, Options } from './core.t.js';
import { presetResolver } from './preset-resolver.js';
import { Context as WriterContext } from './writer.t.js';

const rHosts = /github|bitbucket|gitlab/i;

function semverTagsPromise(options): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) =>
        semverTags(
            {
                lernaTags: !!options.lernaPackage,
                package: options.lernaPackage,
                tagPrefix: options.tagPrefix,
                skipUnstable: options.skipUnstable,
            },
            (error, data: string[]) => (error ? reject(error) : resolve(data)),
        ),
    );
}

function guessNextTag(previousTag: string | undefined, version: string | undefined): string | undefined {
    if (previousTag) {
        if (previousTag[0] === 'v' && version[0] !== 'v') {
            return 'v' + version;
        }
        if (previousTag[0] !== 'v' && version[0] === 'v') {
            return version.replace(/^v/, '');
        }
        return version;
    }
    if (version[0] !== 'v') {
        return 'v' + version;
    }
    return version;
}

export function mergeConfig<TCommit extends Commit = Commit, TContext extends WriterContext = Context>({
    options,
    context,
    gitRawCommitsOpts,
    parserOpts,
    writerOpts,
    gitRawExecOpts,
}: MergeConfigInput): Promise<MergedConfig> {
    const {
        _context,
        _gitRawCommitsOpts,
        _parserOpts,
        _writerOpts,
    }: {
        _context: MergeConfigInput['context'];
        _gitRawCommitsOpts: MergeConfigInput['gitRawCommitsOpts'];
        _parserOpts: MergeConfigInput['parserOpts'];
        _writerOpts: MergeConfigInput['writerOpts'];
    } = {
        _context: context || {},
        _gitRawCommitsOpts: gitRawCommitsOpts || {},
        _parserOpts: parserOpts || {},
        _writerOpts: writerOpts || {},
    };

    const rtag = options?.tagPrefix
        ? new RegExp(`tag:\\s*[=]?${options.tagPrefix}(.+?)[,)]`, 'gi')
        : /tag:\s*[=v]?(.+?)[),]/gi;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const _options: Options<TCommit, TContext> = Object.assign(
        {},
        {
            pkg: {
                transform: function (pkg) {
                    return pkg;
                },
            },
            append: false,
            releaseCount: 1,
            skipUnstable: false,
            debug: () => void 0,
            transform: function (commit, cb) {
                if (typeof commit.gitTags === 'string') {
                    const match = rtag.exec(commit.gitTags);
                    rtag.lastIndex = 0;

                    if (match) {
                        commit.version = match[1];
                    }
                }

                if (commit.committerDate) {
                    commit.committerDate = dateFormat(commit.committerDate, 'yyyy-mm-dd', true);
                }

                cb(null, commit);
            },
            lernaPackage: null,
        },
        options || {},
    );
    _options.warn = _options.warn || _options.debug;

    const configPromise: Promise<ConfigObject<TCommit, TContext> | null> = presetResolver(_options.config, 'null');

    const pkgPromise: Promise<NormalizedPackageJson | NormalizedReadResult | null> = _options.pkg
        ? _options.pkg.path
            ? readPackage({ cwd: _options.pkg.path })
            : readPackageUp()
        : Promise.resolve(null);

    const gitRemoteOriginUrlPromise: Promise<string> = gitRemoteOriginUrl();

    return Promise.allSettled([configPromise, pkgPromise, semverTagsPromise(_options), gitRemoteOriginUrlPromise]).then(
        ([configObj, pkgObj, tagsObj, gitRemoteOriginUrlObj]: [
            PromiseSettledResult<ConfigObject<TCommit, TContext> | null>,
            PromiseSettledResult<NormalizedPackageJson | NormalizedReadResult | null>,
            PromiseSettledResult<string[]>,
            PromiseSettledResult<string>,
        ]) => {
            let xConfig: Partial<ConfigObject<TCommit, TContext>>,
                xPkg: Partial<NormalizedPackageJson>,
                fromTag: string | null,
                repo: GetPkgRepoOutput,
                hostOpts: Partial<HostOptions>,
                gitSemverTags: string[] = [];

            if (configObj.status === 'rejected') {
                _options.warn('Error in config' + configObj.reason.toString());
                xConfig = {};
            } else if (configObj.value) {
                xConfig = configObj.value;
            } else {
                xConfig = {};
            }

            const mOptions: MergedConfig['options'] = Object.assign({}, _options),
                mParserOpts: MergedConfig['parserOpts'] = Object.assign(
                    {},
                    xConfig.parserOpts,
                    { warn: mOptions.warn },
                    _parserOpts,
                );
            let mContext: MergedConfig['context'] = Object.assign({}, _context, xConfig.context);

            if (pkgObj.status === 'rejected') {
                _options.warn(pkgObj.reason.toString());
            } else if (pkgObj.value) {
                xPkg = mOptions.pkg.path
                    ? (pkgObj.value as NormalizedPackageJson)
                    : (pkgObj.value as NormalizedReadResult).packageJson || {};
                xPkg = mOptions.pkg.transform(xPkg);
            }

            if (gitRemoteOriginUrlObj.status === 'fulfilled' && !xPkg?.repository?.url) {
                xPkg = xPkg || {};
                xPkg.repository = xPkg.repository || { type: '', url: '' };
                xPkg.repository.url = gitRemoteOriginUrlObj.value;
                normalizePackageData(xPkg);
            }

            if (xPkg) {
                mContext.version = mContext.version || xPkg.version;

                try {
                    repo = getPkgRepo(xPkg);
                } catch {
                    repo = {};
                }

                if (repo.browse) {
                    const browse = repo.browse();
                    if (!mContext.host) {
                        if (repo.domain) {
                            const parsedBrowse = new URL(browse);
                            mContext.host = parsedBrowse.origin.includes('//')
                                ? parsedBrowse.protocol + '//' + repo.domain
                                : parsedBrowse.protocol + repo.domain;
                        } else {
                            mContext.host = null;
                        }
                    }
                    mContext.owner = mContext.owner || repo.user || '';
                    mContext.repository = mContext.repository || repo.project;
                    mContext.repoUrl = repo.host && repo.project && repo.user ? browse : mContext.host;
                    // mContext.repoUrl = (repo.host||repo.domain) && repo.project && repo.user ? browse : mContext.host;
                }

                mContext.packageData = xPkg;
            }

            mContext.version = mContext.version || '';

            if (tagsObj.status === 'fulfilled') {
                gitSemverTags = mContext.gitSemverTags = tagsObj.value;
                fromTag = gitSemverTags[mOptions.releaseCount - 1];
                const lastTag = gitSemverTags[0];

                if (lastTag === mContext.version || lastTag === 'v' + mContext.version) {
                    if (mOptions.outputUnreleased) {
                        mContext.version = 'Unreleased';
                    } else {
                        mOptions.outputUnreleased = false;
                    }
                }
            }

            if (typeof mOptions.outputUnreleased !== 'boolean') {
                mOptions.outputUnreleased = true;
            }

            if (mContext.host && (!mContext.issue || !mContext.commit || !_parserOpts.referenceActions)) {
                let type;

                if (mContext.host) {
                    const match = mContext.host.match(rHosts);
                    if (match) {
                        type = match[0];
                    }
                } else if (repo && repo.type) {
                    type = repo.type;
                }

                if (type) {
                    hostOpts = JSON.parse(readFileSync(new nodeUrl(`hosts/${type}.json`, import.meta.url), 'utf8'));

                    mContext = Object.assign(
                        {},
                        {
                            issue: hostOpts.issue,
                            commit: hostOpts.commit,
                        },
                        mContext,
                    );
                } else {
                    _options.warn('Host: "' + mContext.host + '" does not exist');
                    hostOpts = {};
                }
            } else {
                hostOpts = {};
            }

            if (mContext.resetChangelog) {
                fromTag = null;
            }
            const mGitRawCommitsOpts: MergedConfig['gitRawCommitsOpts'] = Object.assign(
                {},
                {
                    format: '%B%n-hash-%n%H%n-gitTags-%n%d%n-committerDate-%n%ci',
                    from: fromTag,
                    merges: false,
                    debug: mOptions.debug,
                },
                xConfig.gitRawCommitsOpts,
                _gitRawCommitsOpts,
            );
            if (mOptions.append) {
                mGitRawCommitsOpts.reverse = mGitRawCommitsOpts.reverse || true;
            }

            if (hostOpts.referenceActions) {
                mParserOpts.referenceActions = hostOpts.referenceActions;
            }
            if ((!mParserOpts.issuePrefixes || mParserOpts.issuePrefixes.length === 0) && hostOpts.issuePrefixes) {
                mParserOpts.issuePrefixes = hostOpts.issuePrefixes;
            }

            const finalizeContext: MergedConfig['writerOpts']['finalizeContext'] = (
                fciContext,
                fciWriterOpts,
                fciFilteredCommits,
                fciKeyCommit,
                fciOriginalCommits,
            ) => {
                const firstCommit = fciOriginalCommits[0];
                const lastCommit = fciOriginalCommits[fciOriginalCommits.length - 1];
                const firstCommitHash = firstCommit ? firstCommit.hash : null;
                const lastCommitHash = lastCommit ? lastCommit.hash : null;

                if ((!fciContext.currentTag || !fciContext.previousTag) && fciKeyCommit) {
                    const match = /tag:\s*(.+?)[),]/gi.exec(fciKeyCommit.gitTags);
                    const currentTag = fciContext.currentTag;
                    fciContext.currentTag = currentTag || match ? match[1] : null;
                    const index = gitSemverTags.indexOf(fciContext.currentTag);

                    // if `keyCommit.gitTags` is not a semver
                    if (index === -1) {
                        fciContext.currentTag = currentTag || null;
                    } else {
                        const previousTag = (fciContext.previousTag = gitSemverTags[index + 1]);
                        if (!previousTag) {
                            fciContext.previousTag = mOptions.append
                                ? fciContext.previousTag || firstCommitHash
                                : fciContext.previousTag || lastCommitHash;
                        }
                    }
                } else {
                    fciContext.previousTag = fciContext.previousTag || gitSemverTags[0];

                    if (fciContext.version === 'Unreleased') {
                        fciContext.currentTag = mOptions.append
                            ? fciContext.currentTag || lastCommitHash
                            : fciContext.currentTag || firstCommitHash;
                    } else if (!fciContext.currentTag) {
                        if (mOptions.lernaPackage) {
                            fciContext.currentTag = mOptions.lernaPackage + '@' + fciContext.version;
                        } else if (mOptions.tagPrefix) {
                            fciContext.currentTag = mOptions.tagPrefix + fciContext.version;
                        } else {
                            fciContext.currentTag = guessNextTag(gitSemverTags[0], fciContext.version);
                        }
                    }
                }

                if (typeof fciContext.linkCompare !== 'boolean' && fciContext.previousTag && fciContext.currentTag) {
                    fciContext.linkCompare = true;
                }

                return fciContext;
            };

            const mWriterOpts: MergedConfig['writerOpts'] = Object.assign(
                {},
                {
                    finalizeContext,
                    debug: mOptions.debug,
                },
                xConfig.writerOpts,
                {
                    reverse: mOptions.append,
                    doFlush: mOptions.outputUnreleased,
                },
                _writerOpts,
            );

            return {
                options: mOptions,
                context: mContext,
                gitRawCommitsOpts: mGitRawCommitsOpts,
                parserOpts: mParserOpts,
                writerOpts: mWriterOpts,
                gitRawExecOpts: gitRawExecOpts || {},
            };
        },
    );
}
