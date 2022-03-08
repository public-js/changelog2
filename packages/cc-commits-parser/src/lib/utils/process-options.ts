import { CommitsParserOptions, ParserOptions } from './parser.t.js';

export function processOptions(options: CommitsParserOptions): ParserOptions {
    const _options: ParserOptions = Object.assign(
        {},
        {
            headerPattern: /^(\w*)(?:\(([\w $*./-]*)\))?: (.*)$/,
            headerCorrespondence: ['type', 'scope', 'subject'],
            referenceActions: ['close', 'closes', 'closed', 'fix', 'fixes', 'fixed', 'resolve', 'resolves', 'resolved'],
            issuePrefixes: ['#'],
            noteKeywords: ['BREAKING CHANGE', 'BREAKING-CHANGE'],
            fieldPattern: /^-(.*?)-$/,
            revertPattern: /^Revert\s"([\S\s]*)"\s*This reverts commit (\w*)\./,
            revertCorrespondence: ['header', 'hash'],
            warn: () => void 0,
            mergePattern: null,
            mergeCorrespondence: null,
        },
        options,
    );

    if (typeof _options.headerPattern === 'string') {
        _options.headerPattern = new RegExp(_options.headerPattern);
    }
    if (typeof _options.headerCorrespondence === 'string') {
        _options.headerCorrespondence = (_options.headerCorrespondence as string).split(',');
    }
    if (typeof _options.referenceActions === 'string') {
        _options.referenceActions = (_options.referenceActions as string).split(',');
    }
    if (typeof _options.issuePrefixes === 'string') {
        _options.issuePrefixes = (_options.issuePrefixes as string).split(',');
    }
    if (typeof _options.noteKeywords === 'string') {
        _options.noteKeywords = (_options.noteKeywords as string).split(',');
    }
    if (typeof _options.fieldPattern === 'string') {
        _options.fieldPattern = new RegExp(_options.fieldPattern);
    }
    if (typeof _options.revertPattern === 'string') {
        _options.revertPattern = new RegExp(_options.revertPattern);
    }
    if (typeof _options.revertCorrespondence === 'string') {
        _options.revertCorrespondence = (_options.revertCorrespondence as string).split(',');
    }
    if (typeof _options.mergePattern === 'string') {
        _options.mergePattern = new RegExp(_options.mergePattern);
    }
    if (typeof _options.mergeCorrespondence === 'string') {
        _options.mergeCorrespondence = (_options.mergeCorrespondence as string).split(',');
    }

    return _options;
}
