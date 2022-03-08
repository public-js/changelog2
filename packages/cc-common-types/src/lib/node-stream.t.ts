import { Callback } from './misc.t.js';

export { Readable, Transform } from 'node:stream';

export type TransformFn<Chunk, CbData = unknown> = (chunk: Chunk, enc: BufferEncoding, cb: Callback<CbData>) => void;
export type FlushFn = (cb: Callback) => void;
