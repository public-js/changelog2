import { CommitsParserOptionsBase } from '@public-js/cc-common-types';

export const parserOptions: CommitsParserOptionsBase = {
    headerPattern: /^(\w*): (.*)$/,
    headerCorrespondence: ['component', 'shortDesc'],
};
