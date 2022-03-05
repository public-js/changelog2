import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { checkpoint } from './lib/checkpoint.js';
import { latestSemverTag } from './lib/latest-semver-tag.js';
import { Bump } from './lib/lifecycle/bump.js';
import { Changelog } from './lib/lifecycle/changelog.js';
import { commit } from './lib/lifecycle/commit.js';
import { tag } from './lib/lifecycle/tag.js';
import { mergeConfig } from './lib/merge-config.js';
import { printError } from './lib/print-error.js';
import { resolveFromArgument } from './lib/updaters/updaters.js';
import { YArgs } from './lib/yargs.t.js';

export async function release(argv: Partial<YArgs>): Promise<void> {
    argv = await mergeConfig(argv);
    if (argv.header && argv.header.search(Changelog.START_OF_LAST_RELEASE_PATTERN) !== -1) {
        throw new Error(`custom changelog header must not match ${Changelog.START_OF_LAST_RELEASE_PATTERN}`);
    }

    const { defaults } = await import('./lib/defaults/defaults.js');
    if (argv.packageFiles) {
        defaults.bumpFiles = [...new Set(defaults.bumpFiles.concat(argv.packageFiles))];
    }
    const args: YArgs = Object.assign({}, defaults, argv) as YArgs;

    if (args.verbose) {
        args.debug = (msg: string) => checkpoint(args, msg);
    }

    let pkg;
    for (const packageFile of args.packageFiles) {
        const updater = await resolveFromArgument(packageFile);
        if (!updater) {
            return;
        }
        const pkgPath = resolve(process.cwd(), updater.filename);
        try {
            const contents = readFileSync(pkgPath, 'utf8');
            pkg = {
                version: updater.updater.readVersion(contents),
                private: typeof updater.updater.isPrivate === 'function' ? updater.updater.isPrivate(contents) : false,
            };
            break;
        } catch {
            //
        }
    }

    try {
        let version: string;
        if (pkg) {
            version = pkg.version;
        } else if (args.gitTagFallback) {
            version = await latestSemverTag(args.tagPrefix);
        } else {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('no package file found');
        }

        const nuVersion: string = await Bump(args, version);
        await Changelog(args, nuVersion);
        await commit(args, nuVersion);
        await tag(nuVersion, pkg ? pkg.private : false, args);
    } catch (error) {
        printError(args, error.message);
        throw error;
    }
}
