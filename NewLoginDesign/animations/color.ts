/**
 * color.ts — tints for decoration only.
 *
 * The mark's own colours are never computed. The wordmark stays #1d1d1d and
 * the dots stay whatever the screen passed in. These helpers exist so a
 * highlight can be derived from the brand colour instead of a second hardcoded
 * hex drifting away from it.
 */

function parseHex(hex: string): [number, number, number] | null {
    const m = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(hex.trim());
    if (!m) return null;
    const raw =
        m[1].length === 3
            ? m[1]
                  .split('')
                  .map((c) => c + c)
                  .join('')
            : m[1];
    return [
        parseInt(raw.slice(0, 2), 16),
        parseInt(raw.slice(2, 4), 16),
        parseInt(raw.slice(4, 6), 16),
    ];
}

function toHex(rgb: [number, number, number]): string {
    return '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

/** Mix a colour towards white. `amount` 0 = unchanged, 1 = white. */
export function lighten(hex: string, amount: number): string {
    const rgb = parseHex(hex);
    if (!rgb) return hex;
    return toHex(rgb.map((v) => v + (255 - v) * amount) as [number, number, number]);
}

/** Mix a colour towards black. `amount` 0 = unchanged, 1 = black. */
export function darken(hex: string, amount: number): string {
    const rgb = parseHex(hex);
    if (!rgb) return hex;
    return toHex(rgb.map((v) => v * (1 - amount)) as [number, number, number]);
}
