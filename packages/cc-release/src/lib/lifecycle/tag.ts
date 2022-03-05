import chalk from 'chalk';
import figures from 'figures';

import { checkpoint } from '../checkpoint.js';
import { formatCommitMessage } from '../format-commit-message.js';
import { runExecFile } from '../run-execFile.js';
import { runLifecycleScript } from '../run-lifecycle-script.js';
import { YArgs } from '../yargs.t.js';
import { Bump } from './bump.js';

export async function tag(nuVersion: string, pkgPrivate: boolean, args: YArgs) {
    if (args.skip.tag) {
        return;
    }
    await runLifecycleScript(args, 'pretag');
    await execTag(nuVersion, pkgPrivate, args);
    await runLifecycleScript(args, 'posttag');
}

async function execTag(nuVersion: string, pkgPrivate: boolean, args: YArgs) {
    const tagOption = args.sign ? '-s' : '-a';
    checkpoint(args, 'tagging release %s%s', [args.tagPrefix, nuVersion]);
    await runExecFile(args, 'git', [
        'tag',
        tagOption,
        args.tagPrefix + nuVersion,
        '-m',
        `${formatCommitMessage(args.releaseCommitMessageFormat, nuVersion)}`,
    ]);
    const currentBranch = await runExecFile({}, 'git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    let message = 'git push --follow-tags origin ' + currentBranch.trim();
    if (pkgPrivate !== true && Bump.getUpdatedConfigs()['package.json']) {
        message += ' && npm publish';
        if (args.prerelease !== undefined) {
            message += args.prerelease === '' ? ' --tag prerelease' : ' --tag ' + args.prerelease;
        }
    }

    checkpoint(args, 'Run `%s` to publish', [message], chalk.blue(figures.info));
}
