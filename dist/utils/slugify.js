import slugifyLib from 'slugify';
export function generateKey(text) {
    const clean = text
        .replace(/[^\w\s]|_/g, "")
        .replace(/\s+/g, " ")
        .trim();
    return slugifyLib.default ? slugifyLib.default(clean, {
        lower: true,
        replacement: '_',
        strict: true
    }).substring(0, 50) : slugifyLib(clean, {
        lower: true,
        replacement: '_',
        strict: true
    }).substring(0, 50);
}
