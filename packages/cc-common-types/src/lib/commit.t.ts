export type Field = string | null;

export type CommitType =
    | 'feat'
    | 'feature'
    | 'fix'
    | 'perf'
    | 'revert'
    | 'docs'
    | 'style'
    | 'chore'
    | 'refactor'
    | 'test'
    | 'build'
    | 'ci';

export interface CommitNote<TCommitTransformed extends CommitBase = CommitBase> {
    title: string;
    text: string;
    commit?: TCommitTransformed;
}

export interface CommitReference {
    action: Field;
    owner: Field;
    repository: Field;
    issue: string;
    raw: string;
    prefix: string;
}

export interface CommitRevert {
    header?: Field | undefined;
    hash?: Field | undefined;
    [field: string]: Field | undefined;
}

export interface CommitBase {
    type?: Field | undefined;
    scope?: Field | undefined;
    subject?: Field | undefined;
    header: Field;
    body: Field;
    footer: Field;
    notes: CommitNote[];
    references: CommitReference[];
    revert: CommitRevert | null;
    hash?: Field | undefined;
}

export interface Commit<TCommitRaw extends CommitBase = CommitBase> extends CommitBase {
    merge: Field;
    mentions: string[];
    shortHash?: Field | undefined;
    raw?: TCommitRaw;
    gitTags?: string;
    committerDate?: string;
}

///

export type TransformedCommit<TCommit extends Commit = Commit> = Omit<TCommit, 'raw'> & { raw: TCommit };

export interface CommitGroup<TCommit extends Commit = Commit> {
    title: string;
    commits: TransformedCommit<TCommit>[];
}

export interface NoteGroup {
    title: string;
    notes: CommitNote[];
}
