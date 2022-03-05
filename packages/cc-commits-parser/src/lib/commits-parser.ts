import { Callback, Commit, Transform } from '@public-js/cc-common-types';

import { parser } from './utils/parser.js';
import { CommitsParserOptions, ParserOptions } from './utils/parser.t.js';
import { processOptions } from './utils/process-options.js';
import { regex } from './utils/regex.js';

export function commitsParser(options: CommitsParserOptions): Transform {
    const _options: ParserOptions = processOptions(options);
    const reg = regex(_options);

    return new Transform({
        transform: (chunk: unknown, enc: BufferEncoding, cb: Callback<Commit | string>) => {
            let commit: Commit;
            try {
                commit = parser(chunk.toString(), _options, reg);
                cb(null, commit);
            } catch (error) {
                if (_options.warn === true) {
                    cb(error);
                } else {
                    _options.warn(error.toString());
                    cb(null, '');
                }
            }
        },
        objectMode: true,
        highWaterMark: 16,
    });
}

export function sync(commit: string, options: CommitsParserOptions): Commit {
    const _options: ParserOptions = processOptions(options);
    const reg = regex(_options);
    return parser(commit, _options, reg);
}
