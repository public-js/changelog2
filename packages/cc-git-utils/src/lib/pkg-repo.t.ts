import GitHost from 'hosted-git-info';

export interface ParsedUrlOutput {
    browse: () => string;
    domain: string;
    project: string | null;
    type: 'github' | 'gitlab' | null;
    user: string | null;

    host?: string;
}

export type GetPkgRepoOutput = (Partial<GitHost> & { host?: string }) | ParsedUrlOutput;
