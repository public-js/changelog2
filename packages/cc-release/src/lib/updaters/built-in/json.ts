import detectIndent from 'detect-indent';
import { detectNewlineGraceful } from 'detect-newline';

import { stringifyPackage } from '../../utils/stringify-package.js';
import { UpdaterFunctions } from '../updaters.t.js';

export const updater: UpdaterFunctions = {
    readVersion: (contents: string): string => JSON.parse(contents).version,
    //
    writeVersion: (contents: string, version: string): string => {
        const json = JSON.parse(contents);
        const indent = detectIndent(contents).indent;
        const newline = detectNewlineGraceful(contents);
        json.version = version;

        if (json.packages && json.packages['']) {
            // package-lock v2
            json.packages[''].version = version;
        }

        return stringifyPackage(json, indent, newline);
    },
    //
    isPrivate: (contents: string): boolean => JSON.parse(contents).private || false,
};
