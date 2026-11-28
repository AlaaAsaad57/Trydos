/**
 * The white that covers the page while the start flow's code loads (Stage 7e
 * part 2). It is the colour of the start animation's first frame, so the page
 * under it is never seen before the start.
 *
 * Server-safe: it reads no browser value. A `next/dynamic` loader renders on
 * the server too, and a loader that read `window` there once left the page's
 * stream open for ever (see CoverBox in components/global/PageCover.tsx).
 *
 * SAFARI 26: it stays in the document, as CoverBox and `Layer` do:
 * `position: absolute` from the top of the page, never `fixed`. A fixed box
 * this wide at the bottom edge makes iPhone Safari 26 paint a solid block
 * under its glass bar (review finding S-1). `100lvh` runs it under the bars.
 * The page has just loaded, so its top is the top of the window.
 */
export default function StartCover() {
  return (
    <div
      data-pw="start-cover"
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        insetInline: 0,
        height: "100lvh",
        background: "#FFFFFF",
        zIndex: 2147483000,
      }}
    />
  );
}
