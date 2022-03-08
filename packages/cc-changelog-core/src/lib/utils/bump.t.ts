import { BumpOptionsBase, Commit, LogFn, SemverTagsOptionsBase } from '@public-js/cc-common-types';

import { Options as CoreOptions } from './core.t.js';
import { Context as WriterContext } from './writer.t.js';

export interface BumpOptions extends BumpOptionsBase, SemverTagsOptionsBase {
    ignoreReverted?: boolean | undefined;
    preset?: string | { name: string } | undefined;
    config?: CoreOptions<Commit, WriterContext>['config'];
    lernaPackage?: string | undefined;
    path?: string | undefined;
    debug?: LogFn | undefined;
}
