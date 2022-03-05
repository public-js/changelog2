import chalk from 'chalk';
import figures from 'figures';

import { checkpoint } from './checkpoint.js';
import { HookName } from './defaults/defaults.t.js';
import { runExec } from './run-exec.js';
import { YArgs } from './yargs.t.js';

export function runLifecycleScript(args: YArgs, hookName: HookName): Promise<string | void> {
    const scripts = args.scripts;
    if (!scripts?.[hookName]) {
        return Promise.resolve();
    }
    const command = scripts[hookName];
    if (typeof command === 'string') {
        checkpoint(args, 'Running lifecycle script "%s"', [hookName]);
        checkpoint(args, '- execute command: "%s"', [command], chalk.blue(figures.info));
        return runExec(args, command);
    } else {
        checkpoint(args, 'Running lifecycle function "%s"', [hookName]);
        return command(args);
    }
}
