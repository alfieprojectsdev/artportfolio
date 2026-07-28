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

/**
 * The artist's timezone. Prices are in PHP and the artist is in the
 * Philippines, so dates rendered on the server belong in Manila time.
 */
export const SITE_TIMEZONE = 'Asia/Manila';

/**
 * Format a timestamp for server-rendered output (currently only email).
 *
 * `toLocaleString()` with no arguments uses the *runtime's* locale and
 * timezone. On Vercel that is UTC, so a commission submitted at 14:03 in
 * Manila was announced as "6:03 AM" — eight hours out, and read as the middle
 * of the night.
 *
 * Anything rendered in the browser (the admin dashboard) should keep using the
 * bare `toLocaleString()`, which correctly picks up the viewer's own timezone.
 */
export function formatSiteDateTime(date: Date = new Date()): string {
    return date.toLocaleString('en-PH', {
        timeZone: SITE_TIMEZONE,
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
