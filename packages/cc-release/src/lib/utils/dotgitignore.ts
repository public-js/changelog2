import { readFileSync } from 'node:fs';
import { sep } from 'node:path';

import { findUpSync, Options as FindUpOptions } from 'find-up';
import minimatch from 'minimatch';

const gitignoreFilename = '.gitignore';

class IgnoreMatcher {
    private readonly delimiter = sep;

    private readonly negated: boolean[];
    private readonly rooted: boolean[];
    private readonly matchers: RegExp[];

    constructor(gitIgnoreContent: string) {
        const negated = (this.negated = []);
        const rooted = (this.rooted = []);
        this.matchers = gitIgnoreContent.split(/\r?\n|\r/).map((line: string, idx: number) => {
            const negatedLine = line[0] === '!';
            const rootedLine = line[0] === '/';
            if (negatedLine || rootedLine) {
                line = line.slice(1);
            }
            const emptyLine = line === '';
            if (emptyLine) {
                return null;
            }
            const isShellGlob = line.includes('/');
            negated[idx] = negatedLine;
            rooted[idx] = rootedLine || isShellGlob;
            return minimatch.makeRe(line);
        });
    }

    public shouldIgnore(fileName: string): boolean {
        let isMatching = false;
        for (let i = 0; i < this.matchers.length; i++) {
            if (!this.matchers[i]) {
                continue;
            }
            const matcher = this.matchers[i];
            if (this.rooted[i]) {
                if (matcher.test(fileName)) {
                    isMatching = !this.negated[i];
                }
            } else if (fileName.split(this.delimiter).some((part) => matcher.test(part))) {
                isMatching = !this.negated[i];
            }
        }
        return isMatching;
    }
}

function createMatcher(ignoreFileStr: string): IgnoreMatcher {
    return new IgnoreMatcher(ignoreFileStr);
}

export class DotGitignore {
    private readonly matcher: IgnoreMatcher;

    constructor(options?: FindUpOptions) {
        const gitignorePath = findUpSync(gitignoreFilename, options);
        const content = gitignorePath ? readFileSync(gitignorePath, 'utf8') : '';
        this.matcher = createMatcher(content);
    }

    public ignore(fileName: string): boolean {
        return this.matcher.shouldIgnore(fileName);
    }
}

export function dotGitIgnore(options?: FindUpOptions): DotGitignore {
    return new DotGitignore(options);
}
