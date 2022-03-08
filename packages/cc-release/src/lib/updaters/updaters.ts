import { basename, resolve } from 'node:path';

import { defaults } from '../defaults/defaults.js';
import { updater as updaterJson } from './built-in/json.js';
import { updater as updaterPlainText } from './built-in/plain-text.js';
import { BuiltInUpdater, ResolvedUpdaterObject, ResolveUpdaterObjectArg, UpdaterFunctions } from './updaters.t.js';

const JSON_BUMP_FILES = defaults.bumpFiles;
const PLAIN_TEXT_BUMP_FILES = new Set(['VERSION.txt', 'version.txt']);

const builtInUpdaters: Record<BuiltInUpdater, UpdaterFunctions> = {
    json: updaterJson,
    'plain-text': updaterPlainText,
};

function getUpdaterByType(type: BuiltInUpdater | string): UpdaterFunctions {
    const updater = builtInUpdaters[type];
    if (!updater) {
        throw new Error(`Unable to locate updater for provided type (${type}).`);
    }
    return updater;
}

function getUpdaterByFilename(filename: string): UpdaterFunctions {
    if (JSON_BUMP_FILES.includes(basename(filename))) {
        return getUpdaterByType('json');
    }
    if (PLAIN_TEXT_BUMP_FILES.has(filename)) {
        return getUpdaterByType('plain-text');
    }
    throw new Error(
        `Unsupported file (${filename}) provided for bumping.\n` +
            'Please specify the updater type or use a custom updater.',
    );
}

function isValidUpdater(obj: ResolveUpdaterObjectArg): obj is ResolvedUpdaterObject {
    return (
        typeof obj === 'object' &&
        typeof obj.updater === 'object' &&
        typeof obj.updater.readVersion === 'function' &&
        typeof obj.updater.writeVersion === 'function'
    );
}

export async function resolveFromArgument(arg: ResolveUpdaterObjectArg): Promise<ResolvedUpdaterObject | false> {
    if (isValidUpdater(arg)) {
        return arg;
    }

    let updater: ResolvedUpdaterObject;
    if (typeof updater !== 'object') {
        updater = { filename: arg as string } as ResolvedUpdaterObject;
    }

    try {
        if (typeof updater.updater === 'string') {
            updater.updater = await import(resolve(process.cwd(), updater.updater));
        } else if (updater.type) {
            updater.updater = getUpdaterByType(updater.type);
        } else {
            updater.updater = getUpdaterByFilename(updater.filename);
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.warn(
                `Unable to obtain updater for: ${JSON.stringify(arg)}\n - Error: ${error.message}\n - Skipping...`,
            );
        }
    }

    if (!isValidUpdater(updater)) {
        return false;
    }
    return updater;
}
