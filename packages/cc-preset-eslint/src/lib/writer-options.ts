import { readFile } from 'node:fs';
import { URL as nodeUrl } from 'node:url';
import { promisify } from 'node:util';

import { ChangelogWriterContextBase, ChangelogWriterOptionsBase } from '@public-js/cc-common-types';

import { CommitEslint } from './commit.t.js';

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
>(): ChangelogWriterOptionsBase<CommitEslint, TContext> {
    return {
        transform: (commit: CommitEslint) => {
            if (!commit.tag || typeof commit.tag !== 'string') {
                return;
            }

            commit.shortHash = commit.hash.slice(0, 7);

            return commit;
        },
        groupBy: 'tag',
        commitGroupsSort: 'title',
        commitsSort: ['tag', 'message'],
    };
}
