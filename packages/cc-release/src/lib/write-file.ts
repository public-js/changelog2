import { writeFileSync } from 'node:fs';

import { YArgs } from './yargs.t.js';

export function writeFile(args: Pick<YArgs, 'dryRun'>, filePath, content) {
    if (args.dryRun) {
        return;
    }
    writeFileSync(filePath, content, 'utf8');
}
