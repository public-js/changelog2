import { CommitsParserOptionsBase, LogFn, PatternUnprocessed, StringsUnprocessed } from '@public-js/cc-common-types';

type PatternProcessed = RegExp | null | undefined;
type StringsProcessed = string[] | null | undefined;

export interface CommitsParserOptions extends CommitsParserOptionsBase {
    referenceActions?: StringsUnprocessed;
    issuePrefixes?: StringsUnprocessed;
    issuePrefixesCaseSensitive?: boolean | undefined;
    notesPattern?: (keywords: string) => RegExp;
    fieldPattern?: PatternUnprocessed;
    warn?: LogFn | true | undefined;
    commentChar?: string | null | undefined;
    breakingHeaderPattern?: PatternProcessed;
}

export interface ParserOptions extends CommitsParserOptions {
    headerPattern?: PatternProcessed;
    headerCorrespondence?: StringsProcessed;
    referenceActions?: StringsProcessed;
    issuePrefixes: StringsProcessed;
    noteKeywords: StringsProcessed;
    fieldPattern?: PatternProcessed;
    revertPattern?: PatternProcessed;
    revertCorrespondence?: StringsProcessed;
    mergePattern?: PatternProcessed;
    mergeCorrespondence?: StringsProcessed;
}

///

export type CommentFilter = (line: string) => boolean;
