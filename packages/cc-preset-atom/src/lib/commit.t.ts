import { Commit, Field } from '@public-js/cc-common-types';

export interface CommitAtom extends Commit {
    emoji?: Field | undefined;
    shortDesc?: Field | undefined;
}
