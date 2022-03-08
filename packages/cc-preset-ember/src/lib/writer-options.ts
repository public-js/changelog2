import { readFile } from 'node:fs';
import { URL as nodeUrl } from 'node:url';
import { promisify } from 'node:util';

import { ChangelogWriterContextBase, ChangelogWriterOptionsBase } from '@public-js/cc-common-types';

import { CommitEmber } from './commit.t.js';

const loadTemplate = (hbsPath: string): Promise<string> =>
    promisify(readFile)(new nodeUrl(hbsPath, import.meta.url), 'utf8');

export const writerOptions: Promise<ChangelogWriterOptionsBase> = Promise.all([
    loadTemplate('templates/template.hbs'),
    loadTemplate('templates/header.hbs'),
    loadTemplate('templates/commit.hbs'),
]).then(([template, header, commit]: [string, string, string]) => {
    const writerOpts = getWriterOpts();
    writerOpts.mainTemplate = template;
    writerOpts.headerPartial = header;
    writerOpts.commitPartial = commit;
    return writerOpts;
});

function getWriterOpts<
    TContext extends ChangelogWriterContextBase = ChangelogWriterContextBase,
>(): ChangelogWriterOptionsBase<CommitEmber, TContext> {
    return {
        transform: (commit: CommitEmber) => {
            if (!commit.pr) {
                return;
            }

            // eslint-disable-next-line unicorn/prefer-switch
            if (commit.tag === 'BUGFIX') {
                commit.tag = 'Bug Fixes';
            } else if (commit.tag === 'CLEANUP') {
                commit.tag = 'Cleanup';
            } else if (commit.tag === 'FEATURE') {
                commit.tag = 'Features';
            } else if (commit.tag === 'DOC') {
                commit.tag = 'Documentation';
            } else if (commit.tag === 'SECURITY') {
                commit.tag = 'Security';
            } else {
                return;
            }

            if (typeof commit.hash === 'string') {
                commit.shortHash = commit.hash.slice(0, 7);
            }

            return commit;
        },
        groupBy: 'tag',
        commitGroupsSort: 'title',
        commitsSort: ['tag', 'taggedAs', 'message'],
    };
}
