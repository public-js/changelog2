import { relative } from 'node:path';

import { checkpoint } from '../checkpoint.js';
import { formatCommitMessage } from '../format-commit-message.js';
import { runExecFile } from '../run-execFile.js';
import { runLifecycleScript } from '../run-lifecycle-script.js';
import { YArgs } from '../yargs.t.js';
import { Bump } from './bump.js';

export async function commit(args: YArgs, nuVersion: string) {
    if (args.skip.commit) {
        return;
    }
    const message = await runLifecycleScript(args, 'precommit');
    if (message && message.length > 0) {
        args.releaseCommitMessageFormat = message;
    }
    await execCommit(args, nuVersion);
    await runLifecycleScript(args, 'postcommit');
}

async function execCommit(args: YArgs, nuVersion: string) {
    let msg = 'committing %s';
    let paths = [];
    const verify = args.verify !== true ? ['--no-verify'] : [];
    const sign = args.sign ? ['-S'] : [];
    const toAdd = [];

    // only start with a pre-populated paths list when CHANGELOG processing is not skipped
    if (!args.skip.changelog) {
        paths = [args.infile];
        toAdd.push(args.infile);
    }

    // commit any of the config files that we've updated
    // the version # for.
    for (const p of Object.keys(Bump.getUpdatedConfigs())) {
        paths.unshift(p);
        toAdd.push(relative(process.cwd(), p));

        // account for multiple files in the output message
        if (paths.length > 1) {
            msg += ' and %s';
        }
    }

    if (args.commitAll) {
        msg += ' and %s';
        paths.push('all staged files');
    }

    checkpoint(args, msg, paths);

    // nothing to do, exit without commit anything
    if (args.skip.changelog && args.skip.bump && toAdd.length === 0) {
        return;
    }

    await runExecFile(args, 'git', ['add'].concat(toAdd));
    await runExecFile(
        args,
        'git',
        ['commit'].concat(verify, sign, args.commitAll ? [] : toAdd, [
            '-m',
            `${formatCommitMessage(args.releaseCommitMessageFormat, nuVersion)}`,
        ]),
    );
}
