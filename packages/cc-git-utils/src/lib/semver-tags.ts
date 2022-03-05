import { exec, ExecException } from 'node:child_process';

import { Callback } from '@public-js/cc-common-types';

import semver from 'semver';

import { SemverOptions, SemverTagsOptions } from './semver.t.js';

const regex = /tag:\s*(.+?)[),]/gi;
const cmd = 'git log --decorate --no-color';
const unstableTagTest = /.+-\w+\.\d+$/;
const semVerTagTest = /^.+@\d+\.\d+\.\d+(-.+)?$/;

function lernaTag(tag: string, pkg?: string): boolean {
    // return pkg && !(new RegExp('^' + pkg + '@')).test(tag) ? false : /^.+@\d+\.\d+\.\d+(-.+)?$/.test(tag);
    return !pkg || new RegExp('^' + pkg + '@').test(tag) ? semVerTagTest.test(tag) : false;
}

export function semverTags(options: SemverTagsOptions, callback: Callback<string[]>): void {
    const _options: SemverOptions = Object.assign({ maxBuffer: Infinity, cwd: process.cwd() }, options);

    if (_options.package && !_options.lernaTags) {
        callback(new Error('opts.package should only be used when running in lerna mode'));
        return;
    }

    exec(cmd, _options, (err: ExecException, data: Buffer) => {
        if (err) {
            callback(err);
            return;
        }

        let tagPrefixRegexp: RegExp;
        if (_options.tagPrefix) {
            tagPrefixRegexp = new RegExp('^' + _options.tagPrefix + '(.*)');
        }

        const tags: string[] = [];
        for (const decorations of data.toString().split('\n')) {
            let match: RegExpExecArray;
            while ((match = regex.exec(decorations))) {
                const tag: string = match[1];
                if (_options.skipUnstable && unstableTagTest.test(tag)) {
                    continue;
                }
                if (_options.lernaTags) {
                    if (lernaTag(tag, _options.package)) {
                        tags.push(tag);
                    }
                } else if (_options.tagPrefix) {
                    const matches = tag.match(tagPrefixRegexp);
                    if (matches && semver.valid(matches[1])) {
                        tags.push(tag);
                    }
                } else if (semver.valid(tag)) {
                    tags.push(tag);
                }
            }
        }
        callback(null, tags);
    });
}
