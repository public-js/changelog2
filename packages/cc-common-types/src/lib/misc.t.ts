export type Callback<Data = unknown, Err = Error> = (err?: Err | null, data?: Data) => void | never;

export type LogFn = (message?: unknown) => void;
