#!/usr/bin/env node

import { release } from '../src/release.js';
import { yArgs } from '../src/yargs.js';

release(yArgs).catch(() => process.exit(1));
