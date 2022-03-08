import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import { printError } from './print-error.js';
import { YArgs } from './yargs.t.js';

const execute = promisify(exec);

export async function runExec(args: YArgs, cmd) {
    if (args.dryRun) {
        return;
    }
    try {
        const { stderr, stdout } = await execute(cmd);
        // If exec returns content in stderr, but no error, print it as a warning
        if (stderr) {
            printError(args, stderr, { level: 'warn', color: 'yellow' });
        }
        return stdout;
    } catch (error) {
        // If exec returns an error, print it and exit with return code 1
        printError(args, error.stderr || error.message);
        throw error;
    }
}
