import { LogFn } from './misc.t.js';

export interface GitOptions {
    format: string;
    from: string;
    to: string;
    path?: string;
    debug: LogFn;
    since?: string;
}

export interface RawCommitsOptions extends Partial<GitOptions> {
    format?: GitOptions['format'] | undefined;
    from?: GitOptions['from'] | undefined;
    reverse?: boolean | undefined;
    debug?: LogFn | undefined;
    merges?: boolean | null | undefined;
}
