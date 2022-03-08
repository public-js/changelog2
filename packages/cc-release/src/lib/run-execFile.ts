import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { printError } from './print-error.js';
import { YArgs } from './yargs.t.js';

const executeFile = promisify(execFile);

export async function runExecFile(args: Pick<Partial<YArgs>, 'dryRun' | 'silent'>, cmd: string, cmdArgs?: string[]) {
    if (args.dryRun) {
        return;
    }
    try {
        const { stderr, stdout } = await executeFile(cmd, cmdArgs);
        // If execFile returns content in stderr, but no error, print it as a warning
        if (stderr) {
            printError(args, stderr, { level: 'warn', color: 'yellow' });
        }
        return stdout;
    } catch (error) {
        // If execFile returns an error, print it and exit with return code 1
        printError(args, error.stderr || error.message);
        throw error;
    }
}
