import { format } from 'node:util';

import chalk from 'chalk';
import figures from 'figures';

import { YArgs } from './yargs.t.js';

export function checkpoint(argv: YArgs, msg: string, args?: (string | number)[], figure?: string) {
    const defaultFigure = argv.dryRun ? chalk.yellow(figures.tick) : chalk.green(figures.tick);
    if (!argv.silent) {
        console.info(
            (figure || defaultFigure) +
                ' ' +
                format(...[msg].concat((args || []).map((arg: string | number) => chalk.bold(arg)))),
        );
    }
}
