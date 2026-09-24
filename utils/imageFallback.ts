// A placeholder for a remote image that failed to load.
//
// The app draws hundreds of pictures per page and nearly all of them come from
// the media app. When one fails the browser paints its own broken-image icon,
// and on a product grid a few of those make the whole shop look broken.
//
// One `error` listener on `document`, in the CAPTURE phase, catches every one of
// them. Image errors do not bubble, so capture is the only phase that sees them —
// and one listener replaces an edit at ~560 call sites.
//
// The listener is shipped as an inline <script> written into the page by the root
// layout (see IMAGE_FALLBACK_SCRIPT below). Two things follow from that: it is
// already running before the first <img> in the server-rendered HTML is parsed,
// and it costs the client bundle nothing, because a Server Component only renders
// the string — this module never reaches the browser as JavaScript.
//
// On a failure exactly two things change on the element: `src` becomes the inline
// placeholder, and the marker attribute is set. Nothing that can move or resize
// anything is touched. `public/styles/globals.css` keys one rule to that marker.
//
// Never interpolate an element's `src` into a log, a URL or an HTML template from
// here. The value comes from backend HTML in five screens and is only ever
// compared, never re-emitted.

/** The attribute the stylesheet keys its rule to. */
export const IMAGE_FALLBACK_MARKER = "data-img-fallback";

// The mark, supplied by the product owner. Inline on purpose: it needs no
// network request, so it cannot itself 404 at the very moment the network is
// already failing, and a wave of failures costs no traffic at all.
//
// Two properties matter more than the artwork, and the tests hold it to both:
//
//  1. It carries no raw `<`. This string ends up inside an HTML attribute AND
//     inside the inline <script> below, and a `<` in either place can terminate
//     the thing that carries it.
//  2. It has an intrinsic size. `img[data-img-fallback]` draws it with
//     object-fit: contain, and an SVG with no width/height is sized differently
//     by different browsers. A raster format (webp/png) always has one, so the
//     size check only bites for SVG.
//
// Keep the drawing padded inside its own square. Under `contain` it is scaled to
// fit the shorter side of the box, so a design that runs edge to edge fills a
// small avatar completely. Padding inside the picture is what keeps it a modest,
// centred mark in a wide banner, a tall card and a round avatar alike.
//
// Its size is paid per HTML document, twice (the markup and the streaming
// payload) — not in the JavaScript bundle. Keep it small.
export const IMAGE_FALLBACK_SRC =
  "data:image/webp;base64,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";

/**
 * Install the fallback listener.
 *
 * The body of this function is turned into source text and inlined into the page
 * (IMAGE_FALLBACK_SCRIPT), so two rules bind it:
 *
 *  1. It reads no module-level value. Everything it needs arrives as an argument,
 *     because a closure does not travel with the source text.
 *  2. It uses only syntax that compiles without helper functions — no `?.`, no
 *     `??`, no class fields, no `async`. A helper the compiler adds outside this
 *     function would not be inlined with it, and the script would throw.
 *
 * It is also safe to call twice.
 */
export function installImageFallback(placeholder: string, marker: string) {
  if (typeof document === "undefined") return;

  var installedOn = window as any;
  if (installedOn.__trydosImageFallbackInstalled) return;
  installedOn.__trydosImageFallbackInstalled = true;

  document.addEventListener(
    "error",
    function (event) {
      var el = event.target as any;

      // First and cheapest test. A capture listener on the document sees every
      // failing subresource, not only images — <script>, <link>, <video>,
      // <audio>, <source>. The chat screens render several of those.
      if (!el || el.tagName !== "IMG") return;

      var raw = el.getAttribute("src");

      // No source at all is a spot the design meant to leave blank, not a
      // failure to cover.
      if (!raw) return;

      // Remote only. A file shipped with the app is always written as a root
      // path here ("/icons/flag/tr.svg"), never as an absolute address, so this
      // one test does three jobs: it skips app files, it skips the blob: and
      // data: sources used while a shopper uploads a photo, and it skips the
      // placeholder itself — which is what makes a loop impossible.
      if (!/^(https?:)?\/\//i.test(raw)) return;

      el.setAttribute(marker, "1");
      el.setAttribute("src", placeholder);

      // If a working source is later put on this same element — a list or a
      // carousel re-using the node — stop drawing it as a failure. Armed once
      // per element, and only on an element that has already failed, so a page
      // whose images all load runs nothing here.
      if (!el.__trydosFallbackArmed) {
        el.__trydosFallbackArmed = true;
        el.addEventListener("load", function onLoad() {
          // The placeholder is an image too, so it fires `load` the moment it is
          // set. Without this line that event would strip the marker straight
          // away, the element would lose `object-fit: contain`, and the global
          // `img { object-fit: cover !important }` rule would crop the mark —
          // the exact failure this whole file exists to prevent.
          if (el.getAttribute("src") === placeholder) return;
          el.removeAttribute(marker);
          el.removeEventListener("load", onLoad);
        });
      }
    },
    // Capture. Image errors do not bubble, so this is the only phase that sees
    // them. The handler never calls stopPropagation: anything else listening for
    // resource errors must still receive them.
    true,
  );
}

/**
 * Turn a value into a JavaScript string literal that is safe inside a <script>
 * element.
 *
 * `<` is escaped HERE ONLY — inside the string literal — and never across the
 * surrounding code. That distinction is the whole point:
 *
 *   < is legal in a string literal and is a SyntaxError as an operator.
 *
 * The production minifier does emit `<` as an operator. It rewrites
 * `typeof document === "undefined"` into `"u" < typeof document`, which is a
 * clever and correct transform. An earlier version of this file escaped the
 * whole emitted script, turned that operator into `<`, and shipped a script
 * that threw before installing anything — while every unit test stayed green,
 * because the test runner does not minify. See verify.md.
 */
const asScriptString = (value: string) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

// Built once, at module load, not per render — the root layout is the hottest
// server path in the app and renders on every page in every locale.
//
// The property that matters is narrower than "no `<` anywhere": inside a <script>
// element the HTML parser only stops at `</script`, so a bare `<` is harmless and
// only that sequence (and `<!--`) must be impossible. Both values interpolated
// below are string literals, which is exactly where an escape belongs.
export const IMAGE_FALLBACK_SCRIPT = `(${installImageFallback})(${asScriptString(
  IMAGE_FALLBACK_SRC,
)},${asScriptString(IMAGE_FALLBACK_MARKER)});`;
