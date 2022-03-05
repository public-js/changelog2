const DEFAULT_INDENT = 2;
const CRLF = '\r\n';
const LF = '\n';

export function stringifyPackage(data: object, indent?: string | number | undefined, newline?: string) {
    indent = indent || (indent === 0 ? 0 : DEFAULT_INDENT);
    const json = JSON.stringify(data, null, indent);

    if (newline === CRLF) {
        return json.replace(/\n/g, CRLF) + CRLF;
    }

    return json + LF;
}
