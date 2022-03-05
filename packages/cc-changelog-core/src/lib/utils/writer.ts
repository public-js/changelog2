import {
    ChangelogWriterSort,
    Commit,
    CommitGroup,
    CommitNote,
    NoteGroup,
    SortFn,
    TransformedCommit,
    TransformObj,
} from '@public-js/cc-common-types';

import stringify from 'fast-safe-stringify';
import Handlebars from 'handlebars';
import semver from 'semver';

import { Context as WriterContext, ExtraContext, GeneratedContext, HbTD, WriterOptions } from './writer.t.js';

export function compileTemplates<TCommit extends Commit = Commit, TContext extends WriterContext = WriterContext>(
    templates: WriterOptions<TCommit, TContext>,
): HbTD<TCommit, TContext> {
    const main: string = templates.mainTemplate;
    const headerPartial: string | undefined = templates.headerPartial;
    const commitPartial: string | undefined = templates.commitPartial;
    const footerPartial: string | undefined = templates.footerPartial;
    const partials: Record<string, string> | undefined = templates.partials;

    if (typeof headerPartial === 'string') {
        Handlebars.registerPartial('header', headerPartial);
    }
    if (typeof commitPartial === 'string') {
        Handlebars.registerPartial('commit', commitPartial);
    }
    if (typeof footerPartial === 'string') {
        Handlebars.registerPartial('footer', footerPartial);
    }

    for (const [name, partial] of Object.entries(partials || {})) {
        if (typeof partial === 'string') {
            Handlebars.registerPartial(name, partial);
        }
    }

    return Handlebars.compile(main, { noEscape: true });
}

export function functionify<T = unknown>(strOrArr: ChangelogWriterSort<T>): SortFn<T> {
    return strOrArr && typeof strOrArr !== 'function'
        ? (a, b) => {
              let str1 = '';
              let str2 = '';
              if (Array.isArray(strOrArr)) {
                  for (const key of strOrArr) {
                      str1 += a[key] || '';
                      str2 += b[key] || '';
                  }
              } else {
                  str1 += a[strOrArr];
                  str2 += b[strOrArr];
              }
              return str1.localeCompare(str2);
          }
        : (strOrArr as SortFn<T>);
}

export function getCommitGroups<TCommit extends Commit = Commit, TContext extends WriterContext = WriterContext>(
    groupBy: WriterOptions<TCommit, TContext>['groupBy'],
    commits: Array<TransformedCommit<TCommit>>,
    groupsSort: WriterOptions<TCommit, TContext>['commitGroupsSort'],
    commitsSort: WriterOptions<TCommit, TContext>['commitsSort'],
): CommitGroup<TCommit>[] {
    const commitGroups: CommitGroup<TCommit>[] = [];

    // eslint-disable-next-line unicorn/prefer-object-from-entries
    const commitGroupsObj: Record<string, Array<TransformedCommit<TCommit>>> = commits.reduce(
        (acc: Record<string, Array<TransformedCommit<TCommit>>>, commit: TransformedCommit<TCommit>) => {
            const groupKey = commit[groupBy] || '';
            if (acc[groupKey]) {
                acc[groupKey].push(commit);
            } else {
                acc[groupKey] = [commit];
            }
            return acc;
        },
        {},
    );

    for (const [title, commits1] of Object.entries(commitGroupsObj)) {
        if (commitsSort) {
            commits1.sort(commitsSort);
        }
        commitGroups.push({ title: title || 'false', commits: commits1 });
    }

    if (groupsSort) {
        commitGroups.sort(groupsSort);
    }

    return commitGroups;
}

export function getNoteGroups<TCommit extends Commit = Commit, TContext extends WriterContext = WriterContext>(
    notes: CommitNote[],
    noteGroupsSort: WriterOptions<TCommit, TContext>['noteGroupsSort'],
    notesSort: WriterOptions<TCommit, TContext>['notesSort'],
): NoteGroup[] {
    const retGroups: NoteGroup[] = [];

    for (const note of notes) {
        const title = note.title;
        let titleExists = false;
        // eslint-disable-next-line unicorn/no-array-for-each
        retGroups.forEach((group: NoteGroup) => {
            if (group.title === title) {
                titleExists = true;
                group.notes.push(note);
                return false;
            }
        });
        if (!titleExists) {
            retGroups.push({ title: title, notes: [note] });
        }
    }

    if (noteGroupsSort) {
        retGroups.sort(noteGroupsSort);
    }

    if (notesSort) {
        for (const group of retGroups) {
            group.notes.sort(notesSort);
        }
    }

    return retGroups;
}

export function processCommit<TCommit extends Commit = Commit, TrCommit = TransformedCommit<TCommit>>(
    chunk: string | TCommit,
    transform: WriterOptions['transform'],
    context: WriterContext,
): TrCommit {
    let commit: TCommit, _chunk: TCommit;
    try {
        _chunk = JSON.parse(chunk as string);
    } catch {
        //
    }
    commit = JSON.parse(JSON.stringify(_chunk || chunk));

    if (typeof transform === 'function') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        commit = transform(commit, context);
        if (commit) {
            commit.raw = _chunk;
        }
        return commit as unknown as TrCommit;
    }

    for (const [path, el] of Object.entries(transform as TransformObj)) {
        let value = commit[path];
        value = typeof el === 'function' ? el(value, path) : el;
        commit[path] = value;
    }
    commit.raw = _chunk;
    return commit as unknown as TrCommit;
}

export function getExtraContext<TCommit extends Commit = Commit, TContext extends WriterContext = WriterContext>(
    commits: Array<TransformedCommit<TCommit>>,
    notes: CommitNote[],
    options: WriterOptions<TCommit, TContext>,
): ExtraContext<TCommit> {
    return {
        // group `commits` by `options.groupBy`
        commitGroups: getCommitGroups(options.groupBy, commits, options.commitGroupsSort, options.commitsSort),
        // group `notes` for footer
        noteGroups: getNoteGroups(notes, options.noteGroupsSort, options.notesSort),
    };
}

export function generate<TCommit extends Commit = Commit, TContext extends WriterContext = WriterContext>(
    options: WriterOptions<TCommit, TContext>,
    commits: Array<TransformedCommit<TCommit>>,
    context: TContext,
    keyCommit: TransformedCommit<TCommit> | TCommit,
): string {
    let notes: CommitNote[] = [];
    const filteredCommits = [...commits];
    const compiled: HbTD<TCommit, TContext> = compileTemplates(options);

    // if (options.ignoreReverted) {
    //     filteredCommits = conventionalCommitsFilter(commits)
    // } else {
    //     filteredCommits = _.clone(commits)
    // }

    for (const commit of filteredCommits) {
        commit.notes.map((note: CommitNote) => {
            note.commit = commit;
            return note;
        });
        notes = notes.concat(commit.notes);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let _context: GeneratedContext<TCommit, TContext> = Object.assign(
        {},
        context,
        keyCommit,
        getExtraContext(filteredCommits, notes, options),
    );

    if (keyCommit?.committerDate) {
        _context.date = keyCommit.committerDate;
    }

    if (_context.version && semver.valid(_context.version)) {
        _context.isPatch = _context.isPatch || semver.patch(_context.version) !== 0;
    }

    _context = options.finalizeContext(_context, options, filteredCommits, keyCommit, commits);
    if (options.debug) {
        options.debug('Your final context is:\n' + stringify(_context, null, 2));
    }

    return compiled(_context);
}
