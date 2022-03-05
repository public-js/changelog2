export function formatCommitMessage(rawMsg, nuVersion) {
    const message = String(rawMsg);
    return message.replace(/{{currentTag}}/g, nuVersion);
}
