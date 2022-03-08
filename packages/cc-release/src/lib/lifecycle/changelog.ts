import { F_OK } from 'node:constants';
import { accessSync, readFileSync } from 'node:fs';
import { Readable } from 'node:stream';

import { changelog } from '@public-js/cc-changelog-core';

import chalk from 'chalk';

import { checkpoint } from '../checkpoint.js';
import { runLifecycleScript } from '../run-lifecycle-script.js';
import { writeFile } from '../write-file.js';
import { YArgs } from '../yargs.t.js';

// eslint-disable-next-line unicorn/better-regex
const START_OF_LAST_RELEASE_PATTERN = /(^#+ \[?[0-9]+\.[0-9]+\.[0-9]+|<a name=)/m;

export async function Changelog(args: YArgs, nuVersion: string) {
    if (args.skip.changelog) {
        return;
    }
    await runLifecycleScript(args, 'prechangelog');
    await outputChangelog(args, nuVersion);
    await runLifecycleScript(args, 'postchangelog');
}

Changelog.START_OF_LAST_RELEASE_PATTERN = START_OF_LAST_RELEASE_PATTERN;

function outputChangelog(args: YArgs, nuVersion: string): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => {
        createIfMissing(args);
        const header = args.header;

        let oldContent = args.dryRun ? '' : readFileSync(args.infile, 'utf8');
        const oldContentStart = oldContent.search(START_OF_LAST_RELEASE_PATTERN);
        // find the position of the last release and remove header:
        if (oldContentStart !== -1) {
            oldContent = oldContent.slice(oldContentStart);
        }
        let content = '';
        const context = { version: nuVersion };
        const changelogStream: Readable = changelog({
            options: {
                debug: args.debug,
                preset: args.preset,
                tagPrefix: args.tagPrefix,
            },
            context,
            gitRawCommitsOpts: {
                merges: null,
                path: args.path,
                debug: args.debug,
            },
        }).on('error', function (err) {
            return reject(err);
        });

        changelogStream.on('data', function (buffer) {
            content += buffer.toString();
        });

        changelogStream.on('end', function () {
            checkpoint(args, 'outputting changes to %s', [args.infile]);
            if (args.dryRun) {
                console.info(`\n---\n${chalk.gray(content.trim())}\n---\n`);
            } else {
                writeFile(args, args.infile, header + '\n' + (content + oldContent).replace(/\n+$/, '\n'));
            }
            return resolve(null);
        });
    });
}

function createIfMissing(args: YArgs) {
    try {
        accessSync(args.infile, F_OK);
    } catch (error) {
        if (error.code === 'ENOENT') {
            checkpoint(args, 'created %s', [args.infile]);
            args.outputUnreleased = true;
            writeFile(args, args.infile, '\n');
        }
    }
}
