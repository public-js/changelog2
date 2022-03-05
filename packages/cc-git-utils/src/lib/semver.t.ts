import { SemverTagsOptionsBase } from '@public-js/cc-common-types';

export interface SemverTagsOptions extends SemverTagsOptionsBase {
    lernaTags?: boolean | undefined;
    package?: string | undefined;
}

export interface SemverOptions extends SemverTagsOptions {
    maxBuffer: number;
    cwd: string;
}
