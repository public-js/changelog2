import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { detectIndent, detectNewlineGraceful, stringifyPackage } from '@public-js/cc-release';

const __dirname = dirname(fileURLToPath(import.meta.url));

const expandPath = (dirPath) => {
    let dirContents = [];
    if (!existsSync(dirPath)) {
        return dirContents;
    }
    try {
        dirContents = readdirSync(dirPath, { withFileTypes: true });
    } catch {
        return dirContents;
    }
    return dirContents
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(dirPath, entry.name, 'package.json'))
        .filter((pjPath) => existsSync(pjPath))
        .map((pjPath) => pjPath.replace(__dirname, '.'));
};

const [packagesPath] = [join(__dirname, 'packages')];
const [packages] = [expandPath(packagesPath)];

const postbump = (yArgs) => {
    const nuVersion = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')).version;

    for (const pjPath of packages) {
        if (yArgs.debug) {
            yArgs.debug(`bumping dependencies in ${pjPath}`);
        }

        const contents = readFileSync(pjPath, 'utf8');
        const json = JSON.parse(contents);
        const indent = detectIndent(contents).indent;
        const newline = detectNewlineGraceful(contents);

        if (json.dependencies) {
            const deps = Object.keys(json.dependencies).filter((dep) => dep.startsWith('@public-js/cc-'));
            for (const dep of deps) {
                json.dependencies[dep] = nuVersion;
            }
        }

        if (json.devDependencies) {
            const devDeps = Object.keys(json.devDependencies).filter((dep) => dep.startsWith('@public-js/cc-'));
            for (const dep of devDeps) {
                json.devDependencies[dep] = nuVersion;
            }
        }

        if (!yArgs.dryRun) {
            writeFileSync(pjPath, stringifyPackage(json, indent, newline), 'utf8');
        }
    }
};

export default {
    packageFiles: ['./package.json'],
    bumpFiles: ['./package.json', './package-lock.json', ...packages],
    tagPrefix: '',
    scripts: { postbump },
    skip: { commit: true, tag: true },
};
