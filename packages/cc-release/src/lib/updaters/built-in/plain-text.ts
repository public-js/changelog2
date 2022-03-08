import { UpdaterFunctions } from '../updaters.t.js';

export const updater: UpdaterFunctions = {
    readVersion: (contents: string): string => contents,
    //
    writeVersion: (_contents: unknown, version: string): string => version,
};
