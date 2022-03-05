import { Commit, CommitBase, CommitRevert } from '@public-js/cc-common-types';

import modifyValues from 'modify-values';

const modifyValue = (val) => (typeof val === 'string' ? val.trim() : val);

export function commitsFilter(commits: Commit[]): Commit[] {
    if (!Array.isArray(commits)) {
        throw new TypeError('Expected an array');
    }

    let ret: Commit[] = [];
    const ignores: Commit[] = [],
        remove: string[] = [];

    for (const commit of commits) {
        if (commit.revert) {
            ignores.push(commit);
        }
        ret.push(commit);
    }

    // Filter out reverted commits
    ret = ret.filter((commit: Commit) => {
        let ignoreThis = false;

        const _commit = commit.raw
            ? modifyValues(commit.raw as Record<keyof CommitBase, unknown>, modifyValue)
            : modifyValues(commit as Record<keyof CommitBase, unknown>, modifyValue);

        ignores.some((ignoreCommit: Commit) => {
            const ignore: CommitRevert = modifyValues(ignoreCommit.revert, modifyValue);

            ignoreThis = _commit.hash === ignore.hash || _commit.header === ignore.header; // todo: debug this
            if (ignoreThis) {
                remove.push(ignoreCommit.hash);
            }

            return ignoreThis;
        });

        return !ignoreThis;
    });

    // Filter out the commits that reverted something otherwise keep the revert commits
    return ret.filter((commit: Commit) => remove.indexOf(commit.hash) !== 0);
}
