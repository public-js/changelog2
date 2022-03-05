import { LogFn, ReleaseType } from '@public-js/cc-common-types';

import { Defaults } from './defaults/defaults.t.js';

export interface YArgs extends Defaults {
    releaseAs: ReleaseType;
    prerelease?: string;
    path?: string;
    lernaPackage?: string;

    outputUnreleased?: boolean;
    verbose?: boolean;
    debug?: LogFn;
}
