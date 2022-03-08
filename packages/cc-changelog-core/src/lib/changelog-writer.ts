import { readFileSync } from 'node:fs';
import { URL as nodeUrl } from 'node:url';

import { Callback, Commit, Transform, TransformedCommit } from '@public-js/cc-common-types';

import dateFormat from 'dateformat';
import semver from 'semver';

import { functionify, generate, processCommit } from './utils/writer.js';
import {
    ChangelogWriterOptions,
    Context as WriterContext,
    GeFunction,
    GeneratedContext,
    WriterOptions,
} from './utils/writer.t.js';

function writerInit<TCommit extends Commit = Commit, TContext extends WriterContext = WriterContext>(
    context?: Partial<TContext>,
    options?: Partial<ChangelogWriterOptions>,
): { context: TContext; options: WriterOptions; generateOn: GeFunction<TContext, TCommit> } {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const _context: TContext = Object.assign(
        {},
        {
            commit: 'commits',
            issue: 'issues',
            date: dateFormat(new Date(), 'yyyy-mm-dd', true),
        },
        context || {},
    );

    if (
        typeof _context.linkReferences !== 'boolean' &&
        (_context.repository || _context.repoUrl) &&
        _context.commit &&
        _context.issue
    ) {
        _context.linkReferences = true;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const _options: WriterOptions = Object.assign(
        {},
        {
            groupBy: 'type',
            commitsSort: 'header',
            noteGroupsSort: 'title',
            notesSort: 'text',
            generateOn: (commit: TransformedCommit<TCommit>) => semver.valid(commit['version']),
            finalizeContext: (context: GeneratedContext<TCommit, TContext>) => context,
            debug: () => void 0,
            reverse: false,
            includeDetails: false,
            ignoreReverted: true,
            doFlush: true,
            mainTemplate: readFileSync(new nodeUrl('templates/template.hbs', import.meta.url), 'utf8'),
            headerPartial: readFileSync(new nodeUrl('templates/header.hbs', import.meta.url), 'utf8'),
            commitPartial: readFileSync(new nodeUrl('templates/commit.hbs', import.meta.url), 'utf8'),
            footerPartial: readFileSync(new nodeUrl('templates/footer.hbs', import.meta.url), 'utf8'),
        },
        options || {},
    );

    if (
        (_options.transform !== null &&
            typeof _options.transform !== 'function' &&
            typeof _options.transform === 'object') ||
        _options.transform === undefined
    ) {
        _options.transform = Object.assign(
            {},
            {
                hash: function (hash) {
                    if (typeof hash === 'string') {
                        return hash.slice(0, 7);
                    }
                },
                header: function (header) {
                    return header.slice(0, 100);
                },
                committerDate: function (date) {
                    if (!date) {
                        return;
                    }
                    return dateFormat(date, 'yyyy-mm-dd', true);
                },
            },
            _options.transform,
        );
    }

    let generateOn = _options.generateOn;
    if (typeof generateOn === 'string') {
        generateOn = (commit: TransformedCommit<TCommit>) => commit[_options.generateOn as string] !== undefined;
    } else if (typeof generateOn !== 'function') {
        generateOn = () => false;
    }

    _options.commitGroupsSort = functionify(_options.commitGroupsSort);
    _options.commitsSort = functionify(_options.commitsSort);
    _options.noteGroupsSort = functionify(_options.noteGroupsSort);
    _options.notesSort = functionify(_options.notesSort);

    return { context: _context, options: _options, generateOn: generateOn as GeFunction<TContext, TCommit> };
}

export function changelogWriter<TCommit extends Commit = Commit>(
    context?: Partial<WriterContext>,
    options?: Partial<ChangelogWriterOptions>,
): Transform {
    let commits: TransformedCommit<TCommit>[] = [],
        neverGenerated = true,
        savedKeyCommit: TCommit | TransformedCommit<TCommit>,
        firstRelease = true;

    const { context: _context, options: _options, generateOn: _generateOn } = writerInit(context, options);

    function transform(chunk: string | TCommit, enc: BufferEncoding, cb: Callback<void>): void {
        try {
            let result: string;
            const commit: TransformedCommit<TCommit> = processCommit(chunk, _options.transform, _context);
            const keyCommit: TCommit | TransformedCommit<TCommit> = commit || (chunk as TCommit);

            // previous blocks of logs
            if (_options.reverse) {
                if (commit) {
                    commits.push(commit);
                }

                if (_generateOn(keyCommit, commits, _context, _options)) {
                    neverGenerated = false;
                    result = generate(_options, commits, _context, keyCommit);
                    if (_options.includeDetails) {
                        this.push({
                            log: result,
                            keyCommit: keyCommit,
                        });
                    } else {
                        this.push(result);
                    }

                    commits = [];
                }
            } else {
                if (_generateOn(keyCommit, commits, _context, _options)) {
                    neverGenerated = false;
                    result = generate(_options, commits, _context, savedKeyCommit);

                    if (!firstRelease || _options.doFlush) {
                        if (_options.includeDetails) {
                            this.push({
                                log: result,
                                keyCommit: savedKeyCommit,
                            });
                        } else {
                            this.push(result);
                        }
                    }

                    firstRelease = false;
                    commits = [];
                    savedKeyCommit = keyCommit;
                }

                if (commit) {
                    commits.push(commit);
                }
            }

            cb();
        } catch (error) {
            cb(error);
        }
    }

    function flush(cb: Callback) {
        if (!_options.doFlush && (_options.reverse || neverGenerated)) {
            cb(null);
            return;
        }

        try {
            const result = generate(_options, commits, _context, savedKeyCommit);

            if (_options.includeDetails) {
                this.push({
                    log: result,
                    keyCommit: savedKeyCommit,
                });
            } else {
                this.push(result);
            }

            cb();
        } catch (error) {
            cb(error);
        }
    }

    return new Transform({
        transform,
        flush,
        objectMode: true,
        highWaterMark: 16,
    });
}

changelogWriter.parseArray = <TCommit extends Commit = Commit>(
    rawCommits: TCommit[],
    context?: Partial<WriterContext>,
    options?: Partial<ChangelogWriterOptions>,
): string => {
    const { context: _context, options: _options, generateOn: _generateOn } = writerInit(context, options);
    rawCommits = [...rawCommits];
    let commits: TransformedCommit<TCommit>[] = [],
        savedKeyCommit: TCommit | TransformedCommit<TCommit>;
    if (_options.reverse) {
        rawCommits.reverse();
    }
    const entries: string[] = [];
    for (const rawCommit of rawCommits) {
        const commit: TransformedCommit<TCommit> = processCommit(rawCommit, _options.transform, _context);
        const keyCommit: TCommit | TransformedCommit<TCommit> = commit || rawCommit;
        if (_generateOn(keyCommit, commits, _context, _options)) {
            // noinspection JSUnusedAssignment
            entries.push(generate(_options, commits, _context, savedKeyCommit));
            savedKeyCommit = keyCommit;
            commits = [];
        }
        if (commit) {
            commits.push(commit);
        }
    }
    if (_options.reverse) {
        entries.reverse();
        return generate(_options, commits, _context, savedKeyCommit) + entries.join('');
    } else {
        return entries.join('') + generate(_options, commits, _context, savedKeyCommit);
    }
};
