import { commitsParser } from '@public-js/cc-commits-parser';
import { Commit, Readable, Transform } from '@public-js/cc-common-types';
import { rawCommits } from '@public-js/cc-git-utils';

import { changelogWriter } from './changelog-writer.js';
import { Context, CoreConfig, MergedConfig } from './utils/core.t.js';
import { mergeConfig } from './utils/merge-config.js';
import { Context as WriterContext } from './utils/writer.t.js';

export function changelogCore<TCommit extends Commit = Commit, TContext extends WriterContext = Context>({
    options,
    context,
    gitRawCommitsOpts,
    parserOpts,
    writerOpts,
    gitRawExecOpts,
}: CoreConfig<TCommit, TContext>): Readable {
    const readable = new Readable({ objectMode: (writerOpts || {}).includeDetails });
    readable._read = () => void 0;
    // let commitsErrorThrown = false;
    const commitsStream = new Readable({ objectMode: true });
    commitsStream._read = () => void 0;

    // function commitsRange(from, to) {
    //     return rawCommits(Object.assign({}, gitRawCommitsOpts, { from: from, to: to })).on('error', (err) => {
    //         if (!commitsErrorThrown) {
    //             setImmediate(commitsStream.emit.bind(commitsStream), 'error', err);
    //             commitsErrorThrown = true;
    //         }
    //     });
    // }

    mergeConfig({
        options,
        context,
        gitRawCommitsOpts,
        parserOpts,
        writerOpts,
        gitRawExecOpts,
    })
        .then((data: MergedConfig) => {
            // try {
            //     execFileSync('git', ['rev-parse', '--verify', 'HEAD'], { stdio: 'ignore' });
            //
            //     let reverseTags = data.context.gitSemverTags.slice(0).reverse();
            //     reverseTags.push('HEAD');
            //
            //     if (data.gitRawCommitsOpts.from) {
            //         reverseTags = reverseTags.includes(data.gitRawCommitsOpts.from)
            //             ? reverseTags.slice(reverseTags.indexOf(data.gitRawCommitsOpts.from))
            //             : [data.gitRawCommitsOpts.from, 'HEAD'];
            //     }
            //
            //     let streams = reverseTags.map((to, i) => {
            //         const from = i > 0 ? reverseTags[i - 1] : '';
            //         return commitsRange(from, to);
            //     });
            //
            //     if (data.gitRawCommitsOpts.from) {
            //         streams = streams.splice(1);
            //     }
            //     if (data.gitRawCommitsOpts.reverse) {
            //         streams.reverse();
            //     }
            //
            //     streams
            //         .reduce((prev, next) => next.pipe(addStream(prev)))
            //         .on('data', (data) => {
            //             setImmediate(commitsStream.emit.bind(commitsStream), 'data', data);
            //         })
            //         .on('end', () => setImmediate(commitsStream.emit.bind(commitsStream), 'end'));
            // } catch {
            //     commitsStream = rawCommits(data.gitRawCommitsOpts, data.gitRawExecOpts);
            // }

            rawCommits(data.gitRawCommitsOpts, data.gitRawExecOpts)
                .on('error', (error) => {
                    error.message = 'Error in rawCommits: ' + error.message;
                    setImmediate(readable.emit.bind(readable), 'error', error);
                })
                .pipe(commitsParser(data.parserOpts))
                .on('error', (error) => {
                    error.message = 'Error in commitsParser: ' + error.message;
                    setImmediate(readable.emit.bind(readable), 'error', error);
                })
                // it would be better if `gitRawCommits` could spit out better formatted
                // data, so we don't need to transform here
                .pipe(
                    new Transform({
                        transform: function (chunk, enc, cb) {
                            try {
                                data.options.transform.call(this, chunk, cb);
                            } catch (error) {
                                cb(error);
                            }
                        },
                        objectMode: true,
                        highWaterMark: 16,
                    }),
                )
                .on('error', (err) => {
                    err.message = 'Error in options.transform: ' + err.message;
                    setImmediate(readable.emit.bind(readable), 'error', err);
                })
                .pipe(changelogWriter(data.context, data.writerOpts))
                .on('error', (err) => {
                    err.message = 'Error in changelogWriter: ' + err.message;
                    setImmediate(readable.emit.bind(readable), 'error', err);
                })
                .pipe(
                    new Transform({
                        transform: function (chunk, enc, cb) {
                            try {
                                readable.push(chunk);
                            } catch (error) {
                                setImmediate(() => {
                                    throw error;
                                });
                            }
                            cb();
                        },
                        flush: function (cb) {
                            readable.push(null);
                            cb();
                        },
                        objectMode: data.writerOpts.includeDetails,
                        highWaterMark: 16,
                    }),
                );
        })
        .catch((error) => setImmediate(readable.emit.bind(readable), 'error', error));

    return readable;
}
