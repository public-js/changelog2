import { Commit, Field } from '@public-js/cc-common-types';

export interface CommitEslint extends Commit {
    tag?: Field | undefined;
    message?: Field | undefined;
}
