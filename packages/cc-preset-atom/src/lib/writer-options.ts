import { readFile } from 'node:fs';
import { URL as nodeUrl } from 'node:url';
import { promisify } from 'node:util';

import { ChangelogWriterContextBase, ChangelogWriterOptionsBase } from '@public-js/cc-common-types';

import { CommitAtom } from './commit.t.js';

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
>(): ChangelogWriterOptionsBase<CommitAtom, TContext> {
    return {
        transform: (commit: CommitAtom) => {
            if (!commit.emoji || typeof commit.emoji !== 'string') {
                return;
            }

            commit.emoji = commit.emoji.slice(0, 72);
            const emojiLength = commit.emoji.length;

            if (typeof commit.hash === 'string') {
                commit.shortHash = commit.hash.slice(0, 7);
            }

            if (typeof commit.shortDesc === 'string') {
                commit.shortDesc = commit.shortDesc.slice(0, 72 - emojiLength);
            }

            return commit;
        },
        groupBy: 'emoji',
        commitGroupsSort: 'title',
        commitsSort: ['emoji', 'shortDesc'],
    };
}
