export type PatternUnprocessed = RegExp | string | null | undefined;
export type StringsUnprocessed = string[] | string | null | undefined;

export interface CommitsParserOptionsBase {
    headerPattern?: PatternUnprocessed;
    headerCorrespondence?: StringsUnprocessed;
    noteKeywords?: StringsUnprocessed;
    revertPattern?: PatternUnprocessed;
    revertCorrespondence?: StringsUnprocessed;
    mergePattern?: PatternUnprocessed;
    mergeCorrespondence?: StringsUnprocessed;
}
