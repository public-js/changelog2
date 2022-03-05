import { Commit, Field } from '@public-js/cc-common-types';

export interface CommitEmber extends Commit {
    tag?: Field | undefined;
    taggedAs?: Field | undefined;
    message?: Field | undefined;
    pr?: Field | undefined;
}
