// A blurry photo for slow connections only.
//
// A shopper on a good connection must not see or download a blur. So nothing
// here measures the network, which Safari cannot do anyway. We wait instead: a
// photo on screen that has not arrived after LATE_BLUR_WAIT_MS asks for a tiny
// copy of itself, about 200 bytes, which the browser enlarges into a blur.
//
// The blur is the CSS background of the same <img>. That keeps three promises:
//  - no element is added and no size changes, so the page cannot jump;
//  - the real `src` and `alt` stay in the HTML for search engines;
//  - the sharp photo paints over the blur by itself, with no `opacity` trick.
//
// Like utils/imageFallback.ts, the watcher ships as an inline <script> from the
// root layout, because on a slow connection our main JavaScript arrives last.

/** How long a photo on screen may take before it counts as late. Measured: */
/** 500 ms sends no tiny file on 1.6 Mbps or faster, with the connection open. */
export const LATE_BLUR_WAIT_MS = 500;

/**
 * The tiny copy of a sized media photo, or undefined when it has none. It works
 * like an image provider's loader: the address comes from the photo's own.
 *
 * `.jfif` is left out because the media app does not resize that type, so the
 * "tiny" copy would be the whole file.
 */
export function tinyPhoto(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  const parts = src.match(/^(.*\/upload\/).*\/so_0\/(.+)$/);
  if (!parts || /\.jfif$/i.test(parts[2])) return undefined;
  return `${parts[1]}w_24/f_webp/q_25/${parts[2]}`;
}

/**
 * Watches every `img[data-tiny]`. It runs as the source text of an inline
 * script, so the rules of installImageFallback apply: it reads no module-level
 * value, and it uses only syntax that needs no compiler helper.
 */
export function installLateBlur(waitMs: number) {
  if (typeof document === "undefined") return;

  var installedOn = window as any;
  if (installedOn.__trydosLateBlurInstalled) return;
  installedOn.__trydosLateBlurInstalled = true;
  if (!installedOn.IntersectionObserver || !installedOn.MutationObserver) return;

  var arrived = function (img: any) {
    return img.complete && img.naturalWidth > 0;
  };

  var showTiny = function (img: any) {
    if (arrived(img)) return;
    var tiny = new Image();
    tiny.onload = function () {
      if (arrived(img)) return;
      img.style.backgroundImage = 'url("' + tiny.src + '")';
      img.style.backgroundSize = "cover";
      img.style.backgroundPosition = "center";
      // A photo with see-through parts must not keep the blur behind it.
      img.addEventListener(
        "load",
        function () {
          img.style.backgroundImage = "";
        },
        { once: true },
      );
    };
    tiny.src = img.getAttribute("data-tiny");
  };

  // The wait starts when a photo comes on screen, so a lazy photo far below
  // costs nothing until the shopper reaches it.
  var onScreen = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      var img = entries[i].target;
      onScreen.unobserve(img);
      if (!arrived(img)) setTimeout(showTiny, waitMs, img);
    }
  });

  var watch = function (node: any) {
    if (node.nodeType !== 1) return;
    if (node.matches("img[data-tiny]")) onScreen.observe(node);
    var photos = node.querySelectorAll("img[data-tiny]");
    for (var i = 0; i < photos.length; i++) onScreen.observe(photos[i]);
  };

  new MutationObserver(function (changes) {
    for (var i = 0; i < changes.length; i++) {
      var added = changes[i].addedNodes;
      for (var j = 0; j < added.length; j++) watch(added[j]);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}

/** The inline script. Costs the client bundle nothing: see the layout. */
export const LATE_BLUR_SCRIPT = `(${installLateBlur.toString()})(${LATE_BLUR_WAIT_MS});`;
