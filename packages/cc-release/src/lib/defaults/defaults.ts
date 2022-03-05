import { Defaults } from './defaults.t.js';

const packageFiles: string[] = ['package.json', 'bower.json', 'manifest.json'];

export const defaults: Defaults = {
    packageFiles,
    bumpFiles: packageFiles.concat(['package-lock.json', 'npm-shrinkwrap.json']),
    //
    infile: 'CHANGELOG.md',
    firstRelease: false,
    sign: false,
    verify: true,
    commitAll: false,
    silent: false,
    tagPrefix: 'v',
    scripts: {},
    skip: {},
    dryRun: false,
    gitTagFallback: true,
    preset: 'angular',
    //
    header: '# Changelog\n\n',
    types: [
        { type: 'feat', section: 'Features' },
        { type: 'fix', section: 'Bug Fixes' },
        { type: 'chore', hidden: true },
        { type: 'docs', hidden: true },
        { type: 'style', hidden: true },
        { type: 'refactor', hidden: true },
        { type: 'perf', hidden: true },
        { type: 'test', hidden: true },
    ],
    preMajor: false,
    commitUrlFormat: '{{host}}/{{owner}}/{{repository}}/commit/{{hash}}',
    compareUrlFormat: '{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}',
    issueUrlFormat: '{{host}}/{{owner}}/{{repository}}/issues/{{id}}',
    userUrlFormat: '{{host}}/{{user}}',
    releaseCommitMessageFormat: 'chore(release): {{currentTag}}',
    issuePrefixes: ['#'],
};
