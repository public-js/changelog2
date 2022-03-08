import { CommitsParserOptionsBase } from '@public-js/cc-common-types';

export const parserOptions: CommitsParserOptionsBase = {
    headerPattern: /^(\w*)(?:\((.*)\))?: (.*)$/,
    headerCorrespondence: ['type', 'scope', 'subject'],
    noteKeywords: ['BREAKING CHANGE'],
    revertPattern: /^(?:revert|revert:)\s"?([\S\s]+?)"?\s*this reverts commit (\w*)\./i,
    revertCorrespondence: ['header', 'hash'],
};
