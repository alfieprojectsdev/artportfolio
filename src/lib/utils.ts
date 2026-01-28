export function sanitizeString(value: string | null | undefined): string | null {
    if (!value) return null;
    // Remove zero-width spaces, other invisible characters, and trim whitespace
    // \u200B: Zero-width space
    // \u200C - \u200F: Zero-width non-joiner, joiner, LTR/RTL marks
    // \uFEFF: Zero-width no-break space
    const clean = value.replace(/[\u200B-\u200F\uFEFF]/g, '').trim();
    return clean.length > 0 ? clean : null;
}
