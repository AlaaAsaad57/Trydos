/**
 * A version mark for the demo's pictures in public/assets/demo, added to
 * their URLs as `?v=`.
 *
 * Why. next.config.ts sends every svg/png/jpg in public/ with
 * `max-age=31536000, immutable`, but those files keep the same URL when
 * they change. A phone that loaded an old copy keeps it for a year and never
 * asks again: an iPhone still drew the 31 October vakko.svg (no
 * fill-rule, so its O and A were filled black) after the fix of 1 November.
 * A new URL makes the browser load the file again.
 *
 * Change this value whenever you change a file under public/assets/demo/xd
 * or public/assets/demo/home/brands.
 */
export const DEMO_ASSET_VERSION = "2026-11-11";

/** The URL of a demo picture, with the version mark. */
export const demoAsset = (path: string) => `${path}?v=${DEMO_ASSET_VERSION}`;
