import { Arguments } from 'yargs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { defaults } from './lib/defaults/defaults.js';
import { YArgs } from './lib/yargs.t.js';

export const yArgs: Partial<YArgs> = yargs(hideBin(process.argv))
    .option('packageFiles', {
        array: true,
        default: defaults.packageFiles,
    })
    .option('bumpFiles', {
        array: true,
        default: defaults.bumpFiles,
    })
    .option('release-as', {
        alias: 'r',
        string: true,
        describe: '',
        requiresArg: true,
    })
    .option('prerelease', {
        alias: 'p',
        string: true,
        describe: '',
    })
    .option('infile', {
        alias: 'i',
        default: defaults.infile,
        describe: '',
    })
    .option('first-release', {
        alias: 'f',
        default: defaults.firstRelease,
        type: 'boolean',
        describe: '',
    })
    .option('sign', {
        alias: 's',
        default: defaults.sign,
        type: 'boolean',
        describe: '',
    })
    .option('verify', {
        default: defaults.verify,
        type: 'boolean',
        describe: '',
    })
    .option('commit-all', {
        alias: 'a',
        default: defaults.commitAll,
        type: 'boolean',
        describe: '',
    })
    .option('silent', {
        default: defaults.silent,
        type: 'boolean',
        describe: '',
    })
    .option('tag-prefix', {
        alias: 't',
        default: defaults.tagPrefix,
        type: 'string',
        describe: '',
    })
    .option('scripts', {
        // Not really a CLI argument
        default: defaults.scripts,
        describe: '',
    })
    .option('skip', {
        // Not really a CLI argument
        default: defaults.skip,
        describe: '',
    })
    .option('verbose', {
        alias: 'debug',
        type: 'boolean',
        describe: '',
    })
    .option('dry-run', {
        default: defaults.dryRun,
        type: 'boolean',
        describe: '',
    })
    .option('git-tag-fallback', {
        default: defaults.gitTagFallback,
        type: 'boolean',
        describe: '',
    })
    .option('path', {
        type: 'string',
        describe: '',
    })
    .option('preset', {
        default: defaults.preset,
        type: 'string',
        describe: '',
    })
    .option('lerna-package', {
        type: 'string',
        describe: '',
    })
    .options({
        header: {
            type: 'string',
            describe: '',
            default: defaults.header,
            group: 'Preset Configuration:',
        },
        types: {
            type: 'array',
            describe: '',
            default: defaults.types,
            group: 'Preset Configuration:',
        },
        preMajor: {
            type: 'boolean',
            describe: '',
            default: defaults.preMajor,
            group: 'Preset Configuration:',
        },
        commitUrlFormat: {
            type: 'string',
            describe: '',
            default: defaults.commitUrlFormat,
            group: 'Preset Configuration:',
        },
        compareUrlFormat: {
            type: 'string',
            describe: '',
            default: defaults.compareUrlFormat,
            group: 'Preset Configuration:',
        },
        issueUrlFormat: {
            type: 'string',
            describe: '',
            default: defaults.issueUrlFormat,
            group: 'Preset Configuration:',
        },
        userUrlFormat: {
            type: 'string',
            describe: '',
            default: defaults.userUrlFormat,
            group: 'Preset Configuration:',
        },
        releaseCommitMessageFormat: {
            type: 'string',
            describe: '',
            default: defaults.releaseCommitMessageFormat,
            group: 'Preset Configuration:',
        },
        issuePrefixes: {
            type: 'array',
            describe: '',
            default: defaults.issuePrefixes,
            group: 'Preset Configuration:',
        },
    })
    .check((argv: Arguments<Partial<YArgs>>) => {
        if (typeof argv.scripts !== 'object' || Array.isArray(argv.scripts)) {
            throw new TypeError('scripts must be an object');
        } else if (typeof argv.skip !== 'object' || Array.isArray(argv.skip)) {
            throw new TypeError('skip must be an object');
        } else {
            return true;
        }
    })
    .alias('version', 'v')
    .alias('help', 'h')
    .usage('Usage: $0 [options]')
    // .example('$0', 'Update changelog and tag release')
    // .example('$0 -m "%s: see changelog for details"', 'Update changelog and tag release with custom commit message')
    .pkgConf('cc-release')
    .parserConfiguration({
        'strip-aliased': true,
        'strip-dashed': true,
    }).argv;
