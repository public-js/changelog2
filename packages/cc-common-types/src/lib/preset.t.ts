import { ChangelogWriterContextBase, ChangelogWriterOptionsBase } from './changelog-writer.t.js';
import { Commit } from './commit.t.js';
import { CommitsParserOptionsBase } from './commits-parser.t.js';
import { BumpOptionsBase } from './preferred-bump.t.js';
import { RawCommitsOptions } from './raw-commits.t.js';

export interface ChangelogConfig<
    TCommit extends Commit = Commit,
    TContext extends ChangelogWriterContextBase = ChangelogWriterContextBase,
> {
    parserOpts: CommitsParserOptionsBase;
    writerOpts: ChangelogWriterOptionsBase<TCommit, TContext>;
}

export interface ConfigObjectBase<
    TCommit extends Commit = Commit,
    TContext extends ChangelogWriterContextBase = ChangelogWriterContextBase,
> {
    conventionalChangelog?: ChangelogConfig<TCommit, TContext> | undefined;
    gitRawCommitsOpts?: RawCommitsOptions | undefined;
    parserOpts?: CommitsParserOptionsBase | undefined;
    recommendedBumpOpts?: BumpOptionsBase | undefined;
    writerOpts?: ChangelogWriterOptionsBase<TCommit, TContext> | undefined;
}
