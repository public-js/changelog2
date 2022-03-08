import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

import { findUpSync } from 'find-up';

import { YArgs } from './yargs.t.js';

const CONFIGURATION_FILES = ['.versionrc', '.versionrc.cjs', '.versionrc.json', '.versionrc.js'];

export async function mergeConfig(argv: Partial<YArgs>): Promise<Partial<YArgs>> {
    const configPath = findUpSync(CONFIGURATION_FILES);
    if (!configPath) {
        return argv;
    }

    let config;
    const ext = extname(configPath);
    if (ext === '.js' || ext === '.cjs') {
        const { default: jsConfig } = await import(configPath);
        config = typeof jsConfig === 'function' ? jsConfig() : jsConfig;
    } else {
        config = JSON.parse(readFileSync(configPath, 'utf8'));
    }

    if (typeof config !== 'object') {
        throw new TypeError(
            `[cc-release] Invalid configuration in ${configPath} provided. ` +
                `Expected an object but found ${typeof config}.`,
        );
    }

    return Object.assign(argv, config);
}
