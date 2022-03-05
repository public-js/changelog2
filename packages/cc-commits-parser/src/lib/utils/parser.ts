import { Commit, CommitNote, CommitReference } from '@public-js/cc-common-types';

import { CommentFilter, ParserOptions } from './parser.t.js';
import { RegexOutput } from './regex.types.js';

const CATCH_ALL = /()(.+)/gi;
const DELIMITER_COMMENT = '# ------------------------ >8 ------------------------';

function trimOffNewlines(input: string): string {
    const result = input.match(/[^\n\r]/);
    if (!result) {
        return '';
    }
    const firstIndex = result.index;
    let lastIndex = input.length - 1;
    while (input[lastIndex] === '\r' || input[lastIndex] === '\n') {
        lastIndex--;
    }
    return input.slice(firstIndex, lastIndex + 1);
}

function append(src: string, line: string): string {
    return src ? src + '\n' + line : line;
}

const getCommentFilter =
    (char: string): CommentFilter =>
    (line) =>
        line.charAt(0) !== char;

function truncateToDelimiter(lines: string[]): string[] {
    const delimiterIndex = lines.indexOf(DELIMITER_COMMENT);
    if (delimiterIndex === -1) {
        return lines;
    }
    return lines.slice(0, delimiterIndex);
}

function getReferences(input: string, regex: Pick<RegexOutput, 'references' | 'referenceParts'>): CommitReference[] {
    const references: CommitReference[] = [];
    let referenceSentences: RegExpExecArray, referenceMatch: RegExpExecArray;

    const reApplicable: RegExp = input.match(regex.references) !== null ? regex.references : CATCH_ALL;

    while ((referenceSentences = reApplicable.exec(input))) {
        const action = referenceSentences[1] || null;
        const sentence = referenceSentences[2];

        while ((referenceMatch = regex.referenceParts.exec(sentence))) {
            let owner: string | null = null,
                repository: string = referenceMatch[1] || '';
            const ownerRepo: string[] = repository.split('/');

            if (ownerRepo.length > 1) {
                owner = ownerRepo.shift();
                repository = ownerRepo.join('/');
            }

            const reference: CommitReference = {
                action: action,
                owner: owner,
                repository: repository || null,
                issue: referenceMatch[3],
                raw: referenceMatch[0],
                prefix: referenceMatch[2],
            };

            references.push(reference);
        }
    }

    return references;
}

const createCommentFilter: (commentChar?: ParserOptions['commentChar']) => CommentFilter = (
    commentChar?: ParserOptions['commentChar'],
) => (typeof commentChar === 'string' ? getCommentFilter(commentChar) : () => true);
const gpgFilter: CommentFilter = (line: string) => !line.match(/^\s*gpg:/);

///

export function parser(raw: string, options: ParserOptions, regex: RegexOutput): Commit {
    if (!raw || !raw.trim()) {
        throw new TypeError('Expected a raw commit');
    }
    if (Object.keys(options).length === 0) {
        throw new TypeError('Expected options');
    }
    if (Object.keys(regex).length === 0) {
        throw new TypeError('Expected regex');
    }

    let currentProcessedField: string, mentionsMatch: RegExpExecArray;
    const otherFields: Record<string, string> = {};
    const commentFilter: CommentFilter = createCommentFilter(options.commentChar);

    const rawLines: string[] = trimOffNewlines(raw).split(/\r?\n/),
        lines: string[] = truncateToDelimiter(rawLines)
            .filter((line: string) => commentFilter(line))
            .filter((line: string) => gpgFilter(line));

    let continueNote = false,
        isBody = true;
    const headerCorrespondence: string[] = options.headerCorrespondence
        ? options.headerCorrespondence.map((part) => part.trim())
        : [];
    const revertCorrespondence: string[] = options.revertCorrespondence
        ? options.revertCorrespondence.map((field) => field.trim())
        : [];
    const mergeCorrespondence: string[] = options.mergeCorrespondence
        ? options.mergeCorrespondence.map((field) => field.trim())
        : [];

    let body = '',
        footer = '',
        header: string | null = null,
        merge: string | null = null;
    const mentions: string[] = [],
        notes: CommitNote[] = [],
        references: CommitReference[] = [];
    let revert: Record<string, string | null> | null = null;

    if (lines.length === 0) {
        return {
            body: null,
            footer: null,
            header,
            mentions,
            merge,
            notes,
            references,
            revert,
            scope: null,
            subject: null,
            type: null,
        };
    }

    // msg parts
    merge = lines.shift();
    const mergeParts: Record<string, string | null> = {},
        headerParts: Record<string, string | null> = {};

    const mergeMatch = merge.match(options.mergePattern);
    if (mergeMatch && options.mergePattern) {
        merge = mergeMatch[0];

        header = lines.shift();
        while (header !== undefined && !header.trim()) {
            header = lines.shift();
        }
        if (!header) {
            header = '';
        }

        for (const [index, partName] of mergeCorrespondence.entries()) {
            mergeParts[partName] = mergeMatch[index + 1] || null;
        }
    } else {
        header = merge;
        merge = null;

        for (const partName of mergeCorrespondence) {
            mergeParts[partName] = null;
        }
    }

    const headerMatch = header.match(options.headerPattern);
    if (headerMatch) {
        for (const [index, partName] of headerCorrespondence.entries()) {
            headerParts[partName] = headerMatch[index + 1] || null;
        }
    } else {
        for (const partName of headerCorrespondence) {
            headerParts[partName] = null;
        }
    }

    references.push(...getReferences(header, { references: regex.references, referenceParts: regex.referenceParts }));

    // body or footer
    for (const line of lines) {
        if (options.fieldPattern) {
            const fieldMatch = options.fieldPattern.exec(line);

            if (fieldMatch) {
                currentProcessedField = fieldMatch[1];
                continue;
            }

            if (currentProcessedField) {
                otherFields[currentProcessedField] = append(otherFields[currentProcessedField], line);
                continue;
            }
        }

        let referenceMatched;

        // this is a new important note
        const notesMatch = line.match(regex.notes);
        if (notesMatch) {
            continueNote = true;
            isBody = false;
            footer = append(footer, line);

            const note: CommitNote = {
                title: notesMatch[1],
                text: notesMatch[2],
            };

            notes.push(note);
            continue;
        }

        const lineReferences = getReferences(line, {
            references: regex.references,
            referenceParts: regex.referenceParts,
        });

        if (lineReferences.length > 0) {
            isBody = false;
            referenceMatched = true;
            continueNote = false;
        }

        Array.prototype.push.apply(references, lineReferences);

        if (referenceMatched) {
            footer = append(footer, line);
            continue;
        }

        if (continueNote) {
            notes[notes.length - 1].text = append(notes[notes.length - 1].text, line);
            footer = append(footer, line);
            continue;
        }

        if (isBody) {
            body = append(body, line);
        } else {
            footer = append(footer, line);
        }
    }

    if (options.breakingHeaderPattern && notes.length === 0) {
        const breakingHeader = header.match(options.breakingHeaderPattern);
        if (breakingHeader) {
            const noteText = breakingHeader[3]; // the description of the change.
            notes.push({ title: 'BREAKING CHANGE', text: noteText });
        }
    }

    while ((mentionsMatch = regex.mentions.exec(raw))) {
        mentions.push(mentionsMatch[1]);
    }

    // does this commit revert any other commit?
    const revertMatch = raw.match(options.revertPattern);
    if (revertMatch) {
        revert = {};
        for (const [index, partName] of revertCorrespondence.entries()) {
            revert[partName] = revertMatch[index + 1] || null;
        }
    } else {
        revert = null;
    }

    notes.map((note) => {
        note.text = trimOffNewlines(note.text);
        return note;
    });

    return Object.assign(
        {},
        headerParts,
        mergeParts,
        {
            merge,
            header,
            body: body ? trimOffNewlines(body) : null,
            footer: footer ? trimOffNewlines(footer) : null,
            notes,
            references,
            mentions,
            revert,
        },
        otherFields,
    );
}
