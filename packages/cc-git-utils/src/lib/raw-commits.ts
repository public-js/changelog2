import { execFile } from 'node:child_process';

import { Callback, FlushFn, GitOptions, Readable, Transform, TransformFn } from '@public-js/cc-common-types';

import dargs from 'dargs';
import split2 from 'split2';

import { ExecOptions } from './raw.t.js';

const DELIMITER = '------------------------ >8 ------------------------';

function normalizeExecOpts(execOpts?: Partial<ExecOptions>): ExecOptions {
    execOpts = execOpts || {};
    execOpts.cwd = execOpts.cwd || process.cwd();
    return execOpts as ExecOptions;
}

function normalizeGitOpts(gitOpts?: Partial<GitOptions>): GitOptions {
    gitOpts = gitOpts || {};
    gitOpts.format = gitOpts.format || '%B';
    gitOpts.from = gitOpts.from || '';
    gitOpts.to = gitOpts.to || 'HEAD';
    return gitOpts as GitOptions;
}

function getGitArgs(gitOpts: GitOptions): string[] {
    const gitFormat = `--format=${gitOpts.format}%n${DELIMITER}`;
    const gitFromTo = [gitOpts.from, gitOpts.to].filter(Boolean).join('..');

    const gitArgs = ['log', gitFormat, gitFromTo].concat(
        dargs(gitOpts as unknown as Record<string, string>, {
            excludes: ['debug', 'from', 'to', 'format', 'path'],
        }),
    );

    // allow commits to focus on a single directory
    // this is useful for monorepos.
    if (gitOpts.path) {
        gitArgs.push('--', gitOpts.path);
    }

    return gitArgs;
}

export function rawCommits(rawGitOpts?: Partial<GitOptions>, rawExecOpts?: Partial<ExecOptions>): Readable {
    const readable = new Readable();
    readable._read = () => void 0;

    const gitOpts: GitOptions = normalizeGitOpts(rawGitOpts);
    const execOpts: ExecOptions = normalizeExecOpts(rawExecOpts);
    const args: string[] = getGitArgs(gitOpts);

    if (gitOpts.debug) {
        gitOpts.debug('Your git-log command is:\ngit ' + args.join(' '));
    }

    let isError = false;

    const child = execFile('git', args, {
        cwd: execOpts.cwd,
        maxBuffer: Infinity,
    });

    const transformOut: TransformFn<unknown, void> = (chunk: unknown, enc: BufferEncoding, cb: Callback<void>) => {
        readable.push(chunk);
        isError = false;
        cb();
    };

    const flushOut: FlushFn = (cb: Callback) =>
        setImmediate(function () {
            if (!isError) {
                readable.push(null);
                readable.emit('close');
            }
            cb();
        });

    child.stdout.pipe(split2(DELIMITER + '\n')).pipe(
        new Transform({
            transform: transformOut,
            flush: flushOut,
        }),
    );

    const transformErr: TransformFn<string> = (chunk: string) => {
        isError = true;
        readable.emit('error', new Error(chunk));
        readable.emit('close');
    };

    child.stderr.pipe(
        new Transform({
            transform: transformErr,
            objectMode: true,
            highWaterMark: 16,
        }),
    );

    return readable;
}
