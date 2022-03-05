import { CommitsParserOptions } from '@public-js/cc-commits-parser';
import {
    Callback,
    Commit,
    ConfigObjectBase,
    LogFn,
    RawCommitsOptions,
    SemverTagsOptionsBase,
    TransformFn,
} from '@public-js/cc-common-types';
import { ExecOptions } from '@public-js/cc-git-utils';

import { Package } from 'normalize-package-data';
import { NormalizedPackageJson } from 'read-pkg';

import { Context as WriterContext, WriterOptions as BaseWriterOptions } from './writer.t.js';

export interface ConfigObject<TCommit extends Commit = Commit, TContext extends WriterContext = WriterContext>
    extends ConfigObjectBase<TCommit, TContext> {
    context?: Partial<TContext> | undefined;
}

type FunctionCallback<TCommit extends Commit = Commit, TContext extends WriterContext = WriterContext> = Callback<
    ConfigObject<TCommit, TContext>
>;
export type ConfigFunction<TCommit extends Commit = Commit, TContext extends WriterContext = WriterContext> = (
    callback: FunctionCallback<TCommit, TContext>,
) => void;

export type Config<TCommit extends Commit = Commit, TContext extends WriterContext = WriterContext> =
    | Promise<ConfigObject<TCommit, TContext>>
    | ConfigFunction<TCommit, TContext>
    | ConfigObject<TCommit, TContext>;

interface Pkg {
    path?: string | undefined;
    transform?: ((pkg: Record<string, unknown>) => Record<string, unknown>) | undefined;
}

type Transform<T extends Commit = Commit> = TransformFn<Commit, T>;

export interface Options<TCommit extends Commit = Commit, TContext extends WriterContext = WriterContext>
    extends SemverTagsOptionsBase {
    config?: Config<TCommit, TContext> | undefined;
    pkg?: Pkg | undefined;
    append?: boolean | undefined;
    releaseCount?: number | undefined;
    debug?: LogFn | undefined;
    warn?: LogFn | undefined;
    transform?: Transform<TCommit> | undefined;
    outputUnreleased?: boolean | undefined;
    lernaPackage?: string | null | undefined;
    preset?: string | { name: string } | undefined;
}

export interface Context extends WriterContext {
    previousTag?: string | undefined;
    currentTag?: string | undefined;
    linkCompare?: boolean | undefined;
}

interface ExtraContext {
    readonly gitSemverTags?: ReadonlyArray<string> | undefined;
    readonly packageData?: Readonly<Partial<Package>> | undefined;
}

type MergedContext<TContext extends WriterContext = WriterContext> = TContext & ExtraContext;

export interface WriterOptions<TCommit extends Commit = Commit, TContext extends WriterContext = WriterContext>
    extends Partial<BaseWriterOptions<TCommit, MergedContext<TContext>>> {
    finalizeContext?: BaseWriterOptions<TCommit, MergedContext<TContext>>['finalizeContext'] | undefined;
    reverse?: BaseWriterOptions['reverse'] | undefined;
    doFlush?: BaseWriterOptions['doFlush'] | undefined;
}

///

export interface MergeConfigInput<TCommit extends Commit = Commit, TContext extends WriterContext = Context> {
    options?: Options<TCommit, TContext>;
    context?: Partial<TContext>;
    gitRawCommitsOpts?: RawCommitsOptions;
    parserOpts?: CommitsParserOptions;
    writerOpts: WriterOptions<TCommit, TContext>;
    gitRawExecOpts?: Partial<ExecOptions>;
}

export type CoreConfig<TCommit extends Commit = Commit, TContext extends WriterContext = Context> = Partial<
    MergeConfigInput<TCommit, TContext>
>;

export interface MergedConfig extends MergeConfigInput {
    context?: MergeConfigInput['context'] & {
        packageData?: Partial<NormalizedPackageJson>;
        gitSemverTags?: string[];
        resetChangelog?: boolean;
    };
}

export interface HostOptions {
    issue: string;
    commit: string;
    referenceActions: string[];
    issuePrefixes: string[];
}
