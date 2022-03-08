import { Commit, Field } from '@public-js/cc-common-types';

export interface CommitExpress extends Commit {
    component?: Field | undefined;
    shortDesc?: Field | undefined;
}
