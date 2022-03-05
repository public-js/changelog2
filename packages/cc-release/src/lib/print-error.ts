import chalk, { Color } from 'chalk';

import { YArgs } from './yargs.t.js';

export function printError(
    args: Pick<Partial<YArgs>, 'silent'>,
    msg: string,
    opts?: { level?: 'error' | 'warn' | 'info' | 'log' | 'debug'; color?: Color },
) {
    if (!args.silent) {
        opts = Object.assign({ level: 'error', color: 'red' }, opts || {});
        console[opts.level](chalk[opts.color](msg));
    }
}
