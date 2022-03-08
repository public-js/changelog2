import { readFile } from 'node:fs';
import { URL as nodeUrl } from 'node:url';
import { promisify } from 'node:util';

import {
    ChangelogWriterContextBase,
    ChangelogWriterOptionsBase,
    Commit,
    CommitNote,
    CommitReference,
} from '@public-js/cc-common-types';

const loadTemplate = (hbsPath: string): Promise<string> =>
    promisify(readFile)(new nodeUrl(hbsPath, import.meta.url), 'utf8');

export const writerOptions: Promise<ChangelogWriterOptionsBase> = Promise.all([
    loadTemplate('templates/template.hbs'),
    loadTemplate('templates/header.hbs'),
    loadTemplate('templates/commit.hbs'),
    loadTemplate('templates/footer.hbs'),
]).then(([template, header, commit, footer]: [string, string, string, string]) => {
    const writerOpts = getWriterOpts();
    writerOpts.mainTemplate = template;
    writerOpts.headerPartial = header;
    writerOpts.commitPartial = commit;
    writerOpts.footerPartial = footer;
    return writerOpts;
});

function getWriterOpts<
    TContext extends ChangelogWriterContextBase = ChangelogWriterContextBase,
>(): ChangelogWriterOptionsBase<Commit, TContext> {
    return {
        transform: (commit: Commit, context: TContext) => {
            let discard = true;
            const issues = [];

            for (const note of commit.notes) {
                note.title = 'BREAKING CHANGES';
                discard = false;
            }

            // eslint-disable-next-line unicorn/prefer-switch
            if (commit.type === 'feat') {
                commit.type = 'Features';
            } else if (commit.type === 'fix') {
                commit.type = 'Bug Fixes';
            } else if (commit.type === 'perf') {
                commit.type = 'Performance Improvements';
            } else if (commit.type === 'revert' || commit.revert) {
                commit.type = 'Reverts';
            } else if (discard) {
                return;
                // eslint-disable-next-line unicorn/prefer-switch
            } else if (commit.type === 'docs') {
                commit.type = 'Documentation';
            } else if (commit.type === 'style') {
                commit.type = 'Styles';
            } else if (commit.type === 'refactor') {
                commit.type = 'Code Refactoring';
            } else if (commit.type === 'test') {
                commit.type = 'Tests';
            } else if (commit.type === 'build') {
                commit.type = 'Build System';
            } else if (commit.type === 'ci') {
                commit.type = 'Continuous Integration';
            }

            if (commit.scope === '*') {
                commit.scope = '';
            }

            if (typeof commit.hash === 'string') {
                commit.shortHash = commit.hash.slice(0, 7);
            }

            if (typeof commit.subject === 'string') {
                let url = context.repository
                    ? `${context.host}/${context.owner}/${context.repository}`
                    : context.repoUrl;
                if (url) {
                    url = `${url}/issues/`;
                    // Issue URLs.
                    commit.subject = commit.subject.replace(/#(\d+)/g, (_, issue) => {
                        issues.push(issue);
                        return `[#${issue}](${url}${issue})`;
                    });
                }
                if (context.host) {
                    // User URLs.
                    commit.subject = commit.subject.replace(/\B@([\da-z](?:-?[\d/a-z]){0,38})/g, (_, username) =>
                        username.includes('/') ? `@${username}` : `[@${username}](${context.host}/${username})`,
                    );
                }
            }

            // remove references that already appear in the subject
            commit.references = commit.references.filter(
                (reference: CommitReference) => !issues.includes(reference.issue),
            );

            return commit;
        },
        groupBy: 'type',
        commitGroupsSort: 'title',
        commitsSort: ['scope', 'subject'],
        noteGroupsSort: 'title',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        notesSort: (prop: keyof CommitNote) => (a: CommitNote, b: CommitNote) => a[prop].localeCompare(b[prop]),
    };
}
