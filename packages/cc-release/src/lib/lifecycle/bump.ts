import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { preferredBump } from '@public-js/cc-changelog-core';
import { Recommendation, ReleaseType, ReleaseTypePre } from '@public-js/cc-common-types';

import chalk from 'chalk';
import figures from 'figures';
import semver from 'semver';

import { checkpoint } from '../checkpoint.js';
import { runLifecycleScript } from '../run-lifecycle-script.js';
import { resolveFromArgument } from '../updaters/updaters.js';
import { dotGitIgnore } from '../utils/dotgitignore.js';
import { writeFile } from '../write-file.js';
import { YArgs } from '../yargs.t.js';

let configsToUpdate: Record<string, boolean> = {};

export async function Bump(args: YArgs, version: string): Promise<string> {
    // reset the cache of updated config files each
    // time we perform the version bump step.
    configsToUpdate = {};

    if (args.skip.bump) {
        return version;
    }

    let nuVersion: string = version;
    await runLifecycleScript(args, 'prerelease');

    const stdout = await runLifecycleScript(args, 'prebump');
    if (stdout && stdout.trim().length > 0) {
        args.releaseAs = stdout.trim() as ReleaseType;
    }

    const release = await bumpVersion(args.releaseAs, version, args);
    if (!args.firstRelease) {
        const releaseType = getReleaseType(args.prerelease, release.releaseType, version);
        nuVersion = semver.valid(releaseType) || semver.inc(version, releaseType, args.prerelease);
        await updateConfigs(args, nuVersion);
    } else {
        checkpoint(args, 'skip version bump on first release', [], chalk.red(figures.cross));
    }

    await runLifecycleScript(args, 'postbump');
    return nuVersion;
}

Bump.getUpdatedConfigs = function () {
    return configsToUpdate;
};

function getReleaseType(
    prerelease: string | undefined,
    expectedReleaseType: ReleaseType | undefined,
    currentVersion: string,
): ReleaseTypePre {
    if (typeof prerelease === 'string') {
        if (
            isInPrerelease(currentVersion) &&
            (shouldContinuePrerelease(currentVersion, expectedReleaseType) ||
                getTypePriority(getCurrentActiveType(currentVersion)) > getTypePriority(expectedReleaseType))
        ) {
            return 'prerelease';
        }
        return ('pre' + expectedReleaseType) as ReleaseTypePre;
    } else {
        return expectedReleaseType;
    }
}

/**
 * if a version is currently in pre-release state,
 * and if it current in-pre-release type is same as expect type,
 * it should continue the pre-release with the same type
 *
 * @param version
 * @param expectType
 * @return {boolean}
 */
function shouldContinuePrerelease(version: string, expectType: ReleaseType | undefined): boolean {
    return getCurrentActiveType(version) === expectType;
}

function isInPrerelease(version: string): boolean {
    return Array.isArray(semver.prerelease(version));
}

const TypeList: ReleaseType[] = ['patch', 'minor', 'major'];

/**
 * extract the in-pre-release type in target version
 *
 * @param version
 * @return {string}
 */
function getCurrentActiveType(version: string): ReleaseType | undefined {
    // const typelist = TypeList;
    // // eslint-disable-next-line unicorn/no-for-loop
    // for (let i = 0; i < typelist.length; i++) {
    //     if (semver[typelist[i]](version)) {
    //         return typelist[i];
    //     }
    // }

    for (const type of TypeList) {
        if (semver[type](version)) {
            return type;
        }
    }
}

/**
 * calculate the priority of release type,
 * major - 2, minor - 1, patch - 0
 *
 * @param type
 * @return {number}
 */
function getTypePriority(type: ReleaseType): number {
    return TypeList.indexOf(type);
}

function bumpVersion(releaseAs: ReleaseType, currentVersion: string, args: YArgs): Promise<Recommendation> {
    return new Promise((resolve, reject) => {
        if (releaseAs) {
            return resolve({ releaseType: releaseAs });
        } else {
            preferredBump(
                {
                    debug: args.debug,
                    preset: args.preset,
                    path: args.path,
                    tagPrefix: args.tagPrefix,
                    lernaPackage: args.lernaPackage,
                },
                undefined,
                (err, release) => (err ? reject(err) : resolve(release)),
            );
        }
    });
}

/**
 * attempt to update the version number in provided `bumpFiles`
 * @param args config object
 * @param nuVersion version number to update to.
 * @return void
 */
async function updateConfigs(args: YArgs, nuVersion: string): Promise<void> {
    const gitIgnore = dotGitIgnore();
    for (const bumpFile of args.bumpFiles) {
        const updater = await resolveFromArgument(bumpFile);
        if (!updater) {
            continue;
        }
        const configPath = resolve(process.cwd(), updater.filename);
        try {
            if (gitIgnore.ignore(configPath)) {
                continue;
            }
            const stat = lstatSync(configPath);
            if (!stat.isFile()) {
                continue;
            }
            const contents = readFileSync(configPath, 'utf8');
            checkpoint(args, 'bumping version in ' + updater.filename + ' from %s to %s', [
                updater.updater.readVersion(contents),
                nuVersion,
            ]);
            writeFile(args, configPath, updater.updater.writeVersion(contents, nuVersion));
            // flag any config files that we modify the version # for
            // as having been updated.
            configsToUpdate[updater.filename] = true;
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn(error.message);
            }
        }
    }
}
