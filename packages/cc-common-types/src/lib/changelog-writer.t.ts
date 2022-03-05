import { Commit, CommitGroup, CommitNote, NoteGroup, TransformedCommit } from './commit.t.js';

export interface ChangelogWriterContextBase {
    host?: string | undefined;
    owner?: string | undefined;
    repository?: string | undefined;
    repoUrl?: string | undefined;
}

export interface ChangelogWriterOptionsBase<
    TCommit extends Commit = Commit,
    TContext extends ChangelogWriterContextBase = ChangelogWriterContextBase,
> {
    transform?: ChangelogWriterTransform<TCommit, TContext> | undefined;
    groupBy?: string | undefined;
    commitGroupsSort?: ChangelogWriterSort<CommitGroup<TCommit>> | undefined;
    commitsSort?: ChangelogWriterSort<TransformedCommit<TCommit>> | undefined;
    noteGroupsSort?: ChangelogWriterSort<NoteGroup> | undefined;
    notesSort?: ChangelogWriterSort<CommitNote> | undefined;

    mainTemplate?: string | undefined;
    headerPartial?: string | undefined;
    commitPartial?: string | undefined;
    footerPartial?: string | undefined;
}

type ChangelogWriterTransform<
    TCommit extends Commit = Commit,
    TContext extends ChangelogWriterContextBase = ChangelogWriterContextBase,
> = TransformObj | TransformFn<TCommit, TContext>;
type TransformFn<
    TCommit extends Commit = Commit,
    TContext extends ChangelogWriterContextBase = ChangelogWriterContextBase,
> = (commit: TCommit, context: TContext) => TCommit;
export type TransformObj = Record<string, TransformObjFn | object>;
type TransformObjFn<T = unknown> = (value: T, path: string) => T;

export type ChangelogWriterSort<T = unknown> = SortFn<T> | string | string[];
export type SortFn<T = unknown> = (a: T, b: T) => number;
