export type ReadVersionFn = (contents: string) => string;
export type WriteVersionFn = (contents: string, version: string) => string;
export type IsPrivateFn = (contents: string) => boolean;

export type BuiltInUpdater = 'json' | 'plain-text';

export interface UpdaterFunctions {
    readVersion: ReadVersionFn;
    writeVersion: WriteVersionFn;
    isPrivate?: IsPrivateFn;
}

export interface UpdaterObjectArg {
    filename?: string;
    updater?: string | UpdaterFunctions;
    type?: BuiltInUpdater | string;
}

export interface ResolvedUpdaterObject extends UpdaterObjectArg {
    filename: string;
    updater: UpdaterFunctions;
}

export type ResolveUpdaterObjectArg = string | UpdaterObjectArg | ResolvedUpdaterObject;
