import { RegexOptions, RegexOutput } from './regex.types.js';

const reNomatch = /(?!.*)/;

function join(array: string[], joiner: string): string {
    return array
        .map((val: string) => val.trim())
        .filter((val: string) => val.length)
        .join(joiner);
}

function getNotesRegex(noteKeywords: RegexOptions['noteKeywords'], notesPattern: RegexOptions['notesPattern']): RegExp {
    if (!noteKeywords) {
        return reNomatch;
    }

    const noteKeywordsSelection: string = join(noteKeywords, '|');

    if (!notesPattern) {
        return new RegExp('^[\\s|*]*(' + noteKeywordsSelection + ')[:\\s]+(.*)', 'i');
    }

    return notesPattern(noteKeywordsSelection);
}

function getReferencePartsRegex(
    issuePrefixes: RegexOptions['issuePrefixes'],
    issuePrefixesCaseSensitive: RegexOptions['issuePrefixesCaseSensitive'],
): RegExp {
    if (!issuePrefixes) {
        return reNomatch;
    }

    const flags: string = issuePrefixesCaseSensitive ? 'g' : 'gi';
    return new RegExp('(?:.*?)??\\s*([\\w-\\.\\/]*?)??(' + join(issuePrefixes, '|') + ')([\\w-]*\\d+)', flags);
}

function getReferencesRegex(referenceActions: RegexOptions['referenceActions']): RegExp {
    if (!referenceActions) {
        // matches everything
        return /()(.+)/gi;
    }

    const joinedKeywords: string = join(referenceActions, '|');
    return new RegExp('(' + joinedKeywords + ')(?:\\s+(.*?))(?=(?:' + joinedKeywords + ')|$)', 'gi');
}

export function regex(options?: RegexOptions): RegexOutput {
    options = options || {};
    const reNotes = getNotesRegex(options.noteKeywords, options.notesPattern);
    const reReferenceParts = getReferencePartsRegex(options.issuePrefixes, options.issuePrefixesCaseSensitive);
    const reReferences = getReferencesRegex(options.referenceActions);

    return {
        notes: reNotes,
        referenceParts: reReferenceParts,
        references: reReferences,
        mentions: /@([\w-]+)/g,
    };
}
