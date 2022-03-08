import { CommitsParserOptionsBase } from '@public-js/cc-common-types';

export const parserOptions: CommitsParserOptionsBase = {
    mergePattern: /^Merge pull request #(.*) from .*$/,
    mergeCorrespondence: ['pr'],
    headerPattern: /^\[(.*) (.*)] (.*)$/,
    headerCorrespondence: ['tag', 'taggedAs', 'message'],
};
