export function sanitizeString(value: string | null | undefined): string | null {
    if (!value) return null;
    // Remove zero-width spaces, other invisible characters, and trim whitespace
    // \u200B: Zero-width space
    // \u200C - \u200F: Zero-width non-joiner, joiner, LTR/RTL marks
    // \uFEFF: Zero-width no-break space
    const clean = value.replace(/[\u200B-\u200F\uFEFF]/g, '').trim();
    return clean.length > 0 ? clean : null;
}

/**
 * Undo SQL-style quote doubling ("I''m Bred" -> "I'm Bred").
 *
 * Rows seeded by hand with escaped literals stored the escape itself, so the
 * doubled quotes render on the page. Applied on read (so existing rows display
 * correctly) and on write (so a save cleans the row for good).
 *
 * Deliberately broad: two consecutive apostrophes are never intentional in a
 * name, bio or handle, and the artifact turns up in positions a
 * contraction-only pattern would miss.
 */
export function unescapeDoubledQuotes(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    return value.replace(/''/g, "'").replace(/""/g, '"');
}

/**
 * sanitizeString + quote repair, for free-text site-settings fields.
 */
export function cleanText(value: string | null | undefined): string | null {
    return sanitizeString(unescapeDoubledQuotes(value));
}

/**
 * Approximate PHP -> USD conversion used for the "(~$X USD)" hints.
 *
 * One rate, one place. Prices are quoted and stored in PHP; this is display
 * sugar only, so a fixed rate is fine - but it lived in three files before,
 * which is how they drift apart.
 */
export const PHP_PER_USD = 56;

export function phpToUsd(php: number): number {
    return Math.round(php / PHP_PER_USD);
}

export function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
