import {
    ChangelogWriterContextBase,
    ChangelogWriterOptionsBase,
    Commit,
    CommitGroup,
    CommitNote,
    LogFn,
    NoteGroup,
    SortFn,
    TransformedCommit,
} from '@public-js/cc-common-types';

import Handlebars from 'handlebars';

export interface Context extends ChangelogWriterContextBase {
    version?: string | undefined;
    title?: string | undefined;
    isPatch?: boolean | undefined;
    linkReferences?: boolean | undefined;
    commit: string;
    issue: string;
    date: string;
}

export interface ChangelogWriterOptions<TCommit extends Commit = Commit, TContext extends Context = Context>
    extends ChangelogWriterOptionsBase<TCommit, TContext> {
    generateOn?: GenerateOn<TContext, TCommit> | undefined;
    finalizeContext?: FinalizeContext<TContext, TCommit> | undefined;
    debug?: LogFn | undefined;
    reverse?: boolean | undefined;
    includeDetails?: boolean | undefined;
    ignoreReverted?: boolean | undefined;
    doFlush?: boolean | undefined;
    partials?: Record<string, string> | undefined;
}

export interface WriterOptions<TCommit extends Commit = Commit, TContext extends Context = Context>
    extends ChangelogWriterOptions<TCommit, TContext> {
    groupBy: string | undefined;
    commitGroupsSort: SortFn<CommitGroup<TCommit>> | undefined;
    commitsSort: SortFn<TransformedCommit<TCommit>> | undefined;
    noteGroupsSort: SortFn<NoteGroup> | undefined;
    notesSort: SortFn<CommitNote> | undefined;
    generateOn: GenerateOn<TContext, TCommit> | undefined;
}

type GenerateOn<TContext extends Context = Context, TCommit extends Commit = Commit> =
    | GeFunction<TContext, TCommit>
    | string
    | object;
export type GeFunction<TContext extends Context = Context, TCommit extends Commit = Commit> = (
    commit: TransformedCommit<TCommit> | TCommit,
    commits: Array<TransformedCommit<TCommit>>,
    context: Partial<GeneratedContext<TCommit, TContext>>,
    options: ChangelogWriterOptions<TCommit, TContext>,
) => boolean | string;
export type GeneratedContext<TCommit extends Commit = Commit, TContext extends Context = Context> = TContext &
    TransformedCommit<TCommit> &
    ExtraContext<TCommit>;

export interface ExtraContext<TCommit extends Commit = Commit> {
    commitGroups: CommitGroup<TCommit>[];
    noteGroups: NoteGroup[];
}

type FinalizeContext<TContext extends Context = Context, TCommit extends Commit = Commit> = (
    context: GeneratedContext<TCommit, TContext>,
    options?: ChangelogWriterOptions<TCommit, TContext>,
    filteredCommits?: Array<TransformedCommit<TCommit>>,
    keyCommit?: TransformedCommit<TCommit> | TCommit | undefined,
    originalCommits?: Array<TransformedCommit<TCommit>> | undefined,
) => GeneratedContext<TCommit, TContext>;

///

export type HbTD<TCommit extends Commit = Commit, TContext extends Context = Context> = Handlebars.TemplateDelegate<
    GeneratedContext<TCommit, TContext>
>;
