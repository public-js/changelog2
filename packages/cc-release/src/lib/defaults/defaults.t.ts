import { CommitType } from '@public-js/cc-common-types';

export type SpecProperty =
    | 'header'
    | 'types'
    | 'preMajor'
    | 'commitUrlFormat'
    | 'compareUrlFormat'
    | 'issueUrlFormat'
    | 'userUrlFormat'
    | 'releaseCommitMessageFormat'
    | 'issuePrefixes';

export type SpecType = { type: CommitType; section: string } | { type: CommitType; hidden: boolean };

export type LifecycleStep = 'bump' | 'changelog' | 'commit' | 'tag';

export type HookName =
    | 'prerelease'
    | 'prebump'
    | 'postbump'
    | 'prechangelog'
    | 'postchangelog'
    | 'precommit'
    | 'postcommit'
    | 'pretag'
    | 'posttag';

type HookFn = (args: Defaults) => Promise<string | void>;

export interface Defaults {
    // Files
    packageFiles: string[];
    bumpFiles: string[];
    // Parameters
    infile: string;
    firstRelease: boolean;
    sign: boolean;
    verify: boolean;
    commitAll: boolean;
    silent: boolean;
    tagPrefix: string;
    scripts: Partial<Record<HookName, string | HookFn>>;
    skip: Partial<Record<LifecycleStep, boolean>>;
    dryRun: boolean;
    gitTagFallback: boolean;
    preset: string;
    // Spec Properties
    header: string;
    types: SpecType[];
    preMajor: boolean;
    commitUrlFormat: string;
    compareUrlFormat: string;
    issueUrlFormat: string;
    userUrlFormat: string;
    releaseCommitMessageFormat: string;
    issuePrefixes: string[];
}
