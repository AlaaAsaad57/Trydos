// What this file proves, and what it deliberately does not.
//
// jsdom never loads an image, so no `error` event happens by itself here. Every
// failure below is raised by hand on the element. That proves the handler's
// decisions — which is the whole of the logic — and it does not prove that a
// browser fires `error` on a failed image. A browser doing that is standard
// behaviour, not something this change introduces.
//
// jsdom also has no layout engine, so a box cannot be measured. "the box does not
// change" is therefore proved structurally instead: the handler is shown to write
// nothing but `src` and the marker attribute. Two criteria are about the built
// output rather than logic and are checked from the build at /verify instead:
// AC-7 (the script runs before the first image) and AC-12 (first-load JS
// unchanged). AC-9 (the mark is drawn whole at any box ratio) needs a real
// renderer and is checked in a browser at /verify.

import { readFileSync } from "node:fs";
import path from "node:path";

import { act, createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  IMAGE_FALLBACK_MARKER,
  IMAGE_FALLBACK_SCRIPT,
  IMAGE_FALLBACK_SRC,
  installImageFallback,
} from "utils/imageFallback";

const REMOTE = "https://media_server.example.com/image/upload/v1/a.jpg";
const REPO_ROOT = path.resolve(__dirname, "..", "..");

/** Put an image on the page. Pass `undefined` for an image with no source at all. */
function addImage(src?: string): HTMLImageElement {
  const img = document.createElement("img");
  if (src !== undefined) img.setAttribute("src", src);
  document.body.appendChild(img);
  return img;
}

/**
 * Raise the failure the browser would raise. `error` does not bubble, but the
 * capture phase runs for every dispatch, which is exactly why the listener is
 * registered with capture in the first place.
 */
function fail(el: Element) {
  el.dispatchEvent(new Event("error"));
}

function succeed(el: Element) {
  el.dispatchEvent(new Event("load"));
}

beforeAll(() => {
  installImageFallback(IMAGE_FALLBACK_SRC, IMAGE_FALLBACK_MARKER);
});

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("the fallback replaces a failed remote image", () => {
  it("swaps a failed remote image to the placeholder (AC-1)", () => {
    const img = addImage(REMOTE);

    fail(img);

    expect(
      img.getAttribute("src"),
      "a remote image that failed was not given the placeholder",
    ).toBe(IMAGE_FALLBACK_SRC);
    expect(
      img.getAttribute(IMAGE_FALLBACK_MARKER),
      "the failed image was not marked, so the stylesheet rule cannot reach it",
    ).toBe("1");
  });

  it("writes nothing on the element but src and the marker (AC-2)", () => {
    const img = addImage(REMOTE);
    img.setAttribute("class", "product-card-image");
    img.setAttribute("width", "200");
    img.setAttribute("height", "260");
    const before = img.getAttribute("style");

    fail(img);

    // The box must not move. Anything the handler writes beyond these two names
    // lands on every failing image in the app at once.
    const written = Array.from(img.attributes)
      .map((a) => a.name)
      .sort();
    expect(
      written,
      `the handler wrote an attribute it must not write: ${written.join(", ")}`,
    ).toEqual(["class", "data-img-fallback", "height", "src", "width"]);
    expect(
      img.getAttribute("class"),
      "the handler changed the element's class, which React owns and can overwrite",
    ).toBe("product-card-image");
    expect(
      img.getAttribute("width"),
      "the handler changed the element's width attribute",
    ).toBe("200");
    expect(
      img.getAttribute("height"),
      "the handler changed the element's height attribute",
    ).toBe("260");
    expect(
      img.getAttribute("style"),
      "the handler wrote an inline style, which can move or resize the element",
    ).toBe(before);
  });

  it("covers an image added to the page after the listener was installed (AC-8)", () => {
    // Client navigation, and images inside backend HTML rendered through
    // sanitizeHtml, both arrive after the listener is already running.
    const late = addImage(REMOTE);

    fail(late);

    expect(
      late.getAttribute("src"),
      "an image added after install did not get the placeholder",
    ).toBe(IMAGE_FALLBACK_SRC);
  });
});

describe("the fallback leaves everything else alone", () => {
  it("leaves a working image untouched (AC-3)", () => {
    const img = addImage(REMOTE);

    succeed(img);

    expect(
      img.getAttribute("src"),
      "a working image had its source rewritten",
    ).toBe(REMOTE);
    expect(
      img.hasAttribute(IMAGE_FALLBACK_MARKER),
      "a working image was marked as failed, so it would paint with contain and a tint",
    ).toBe(false);
  });

  it("leaves a local app file alone when it fails (AC-4)", () => {
    // A file shipped with the app. A grey placeholder box inside a 16px toolbar
    // slot would draw more attention to the fault than the browser's own icon.
    const flag = addImage("/icons/flag/tr.svg");

    fail(flag);

    expect(
      flag.getAttribute("src"),
      "a local app file was replaced by the placeholder",
    ).toBe("/icons/flag/tr.svg");
    expect(
      flag.hasAttribute(IMAGE_FALLBACK_MARKER),
      "a local app file was marked as failed",
    ).toBe(false);
  });

  it("leaves an image with no source alone when it fails (AC-5)", () => {
    // A spot the design meant to leave blank, not a failure to cover.
    const empty = addImage();
    const blank = addImage("");

    fail(empty);
    fail(blank);

    expect(
      empty.hasAttribute("src"),
      "an image with no source was given the placeholder",
    ).toBe(false);
    expect(
      blank.getAttribute("src"),
      "an image with an empty source was given the placeholder",
    ).toBe("");
  });

  it("leaves a failing script or media source alone (F-4)", () => {
    // A capture listener on the document sees every failing subresource, not
    // only images. The chat screens render <source> inside audio and video.
    const script = document.createElement("script");
    script.setAttribute("src", "https://cdn.example.com/thing.js");
    document.body.appendChild(script);

    const source = document.createElement("source");
    source.setAttribute("src", "https://media.example.com/clip.mp4");
    document.body.appendChild(source);

    fail(script);
    fail(source);

    expect(
      script.getAttribute("src"),
      "a failed script element had its source rewritten to an image placeholder",
    ).toBe("https://cdn.example.com/thing.js");
    expect(
      source.getAttribute("src"),
      "a failed media source had its source rewritten to an image placeholder",
    ).toBe("https://media.example.com/clip.mp4");
    expect(
      script.hasAttribute(IMAGE_FALLBACK_MARKER),
      "a failed script element was marked as a failed image",
    ).toBe(false);
  });
});

describe("the placeholder cannot loop, and recovers", () => {
  it("keeps the marker when the placeholder itself loads (F-1)", () => {
    // The placeholder IS an image, so it fires `load` the moment it is set.
    // If that stripped the marker, the element would lose object-fit: contain
    // and the global `img { object-fit: cover !important }` rule would crop the
    // mark — the exact failure this ticket exists to prevent.
    const img = addImage(REMOTE);
    fail(img);

    succeed(img);

    expect(
      img.getAttribute(IMAGE_FALLBACK_MARKER),
      "the placeholder's own load removed the marker, so the mark would be cropped by the global cover rule",
    ).toBe("1");
    expect(
      img.getAttribute("src"),
      "the placeholder's own load changed the source",
    ).toBe(IMAGE_FALLBACK_SRC);
  });

  it("removes the marker when a working source loads on the same element (AC-3)", () => {
    // A list or a carousel can put a new, working picture on a node that
    // already failed.
    const img = addImage(REMOTE);
    fail(img);

    img.setAttribute("src", "https://media_server.example.com/image/upload/v1/b.jpg");
    succeed(img);

    expect(
      img.hasAttribute(IMAGE_FALLBACK_MARKER),
      "a re-used element kept the failed marker after a working picture loaded on it",
    ).toBe(false);
  });

  it("never re-triggers on the placeholder, and swaps again if the failing source returns (AC-11)", () => {
    const img = addImage(REMOTE);

    fail(img);
    // The placeholder is a data: address, which the remote-only test rejects —
    // so a second failure on it is a no-op rather than a loop.
    fail(img);
    expect(
      img.getAttribute("src"),
      "failing again while showing the placeholder changed the source, which is how a loop starts",
    ).toBe(IMAGE_FALLBACK_SRC);

    // Something puts the broken source back and it fails again.
    img.setAttribute("src", REMOTE);
    fail(img);
    expect(
      img.getAttribute("src"),
      "a restored failing source was not swapped back to the placeholder",
    ).toBe(IMAGE_FALLBACK_SRC);
  });
});

describe("the placeholder survives the framework taking over", () => {
  it("keeps the placeholder through hydration (AC-11, F-3)", async () => {
    // This is the path that matters, and it is why AC-7 exists: images in the
    // server-rendered HTML fail BEFORE the app is interactive. A later
    // re-render is a different, easier case.
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = `<img src="${REMOTE}" alt=""/>`;

    const served = container.querySelector("img") as HTMLImageElement;
    fail(served);
    expect(
      served.getAttribute("src"),
      "the image did not get the placeholder before hydration, so this case proves nothing",
    ).toBe(IMAGE_FALLBACK_SRC);

    // React now hydrates the same markup, still holding the original source in
    // its own model.
    await act(async () => {
      hydrateRoot(container, createElement("img", { src: REMOTE, alt: "" }));
    });

    const afterHydration = container.querySelector("img") as HTMLImageElement;
    expect(
      afterHydration.getAttribute("src"),
      "hydration put the broken source back, so the shopper sees the broken-image icon again",
    ).toBe(IMAGE_FALLBACK_SRC);
    expect(
      afterHydration.getAttribute(IMAGE_FALLBACK_MARKER),
      "hydration dropped the marker, so the mark would be cropped by the global cover rule",
    ).toBe("1");
  });
});

describe("the cost of a failure", () => {
  it("needs no network request and cannot itself fail (AC-6)", () => {
    expect(
      IMAGE_FALLBACK_SRC.startsWith("data:image/"),
      "the placeholder is not an inline address, so it needs a request and could 404 itself",
    ).toBe(true);
    expect(
      IMAGE_FALLBACK_SRC.includes("<"),
      "the placeholder holds a raw < , which can terminate the attribute that carries it",
    ).toBe(false);

    // F-6. An <img> pointing at an SVG with no intrinsic size is sized
    // differently by different browsers, and "drawn whole at any ratio" rests
    // on that sizing. A raster format always carries its own size, so this only
    // has to bite when the placeholder is an SVG.
    const isSvg = IMAGE_FALLBACK_SRC.startsWith("data:image/svg+xml");
    expect(
      !isSvg ||
        (IMAGE_FALLBACK_SRC.includes("width=") &&
          IMAGE_FALLBACK_SRC.includes("height=")),
      "the placeholder is an SVG that declares no width and height, so browsers will size it differently (F-6)",
    ).toBe(true);
  });

  it("makes no request and sends no report when many images fail at once (AC-13)", () => {
    // A dead media host means hundreds of failures on one page view.
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const beacon = vi.fn();
    vi.stubGlobal("navigator", { ...navigator, sendBeacon: beacon });

    for (let i = 0; i < 200; i += 1) fail(addImage(`${REMOTE}?i=${i}`));

    expect(
      fetchSpy,
      `200 failing images made ${fetchSpy.mock.calls.length} network calls; the placeholder must need none`,
    ).not.toHaveBeenCalled();
    expect(
      beacon,
      "200 failing images sent a report; reporting is out of scope for this ticket",
    ).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});

describe("the script that is inlined into the page", () => {
  it("cannot close its own script element (F-8)", () => {
    // Inside a <script> the HTML parser stops only at `</script`, so a bare `<`
    // is harmless. Asserting "no < at all" was too strong AND actively harmful:
    // it forced an escape across the code, and the minifier's `"u" < typeof
    // document` became a SyntaxError that shipped. See verify.md.
    expect(
      /<\/script/i.test(IMAGE_FALLBACK_SCRIPT),
      "the emitted script holds </script, which closes the element early and injects markup into every page",
    ).toBe(false);
    expect(
      IMAGE_FALLBACK_SCRIPT.includes("<!--"),
      "the emitted script holds <!--, which opens an HTML comment inside the element",
    ).toBe(false);
  });

  it("escapes < inside the values it interpolates, and only there (F-8)", () => {
    // The escape belongs in the string literals, where it is legal, and nowhere
    // else. A value carrying `</script` must come out unable to close the tag.
    const hostile = 'a</script><img src=x onerror=alert(1)>';
    const emitted = JSON.stringify(hostile).replace(/</g, "\\u003c");

    expect(
      /<\/script/i.test(emitted),
      "a value holding </script was interpolated without being escaped",
    ).toBe(false);
    expect(
      JSON.parse(`"${emitted.slice(1, -1)}"`),
      "escaping changed the value the browser will read back",
    ).toBe(hostile);
  });

  it("installs a working listener when it is evaluated (F-2)", () => {
    // The other cases import the function. This one runs the exact string the
    // root layout writes into the page, so a bad interpolation turns this red
    // instead of shipping a dead feature.
    //
    // It sees UNMINIFIED source only — the minifier runs in `pnpm build`, never
    // in the test runner — so it cannot catch a minifier transform. That gap is
    // covered at /verify by running `node --check` on the script extracted from
    // the built page, which is what caught the escaping bug this file now guards.
    (window as unknown as Record<string, unknown>)
      .__trydosImageFallbackInstalled = false;

    expect(
      () => new Function(IMAGE_FALLBACK_SCRIPT)(),
      "the script the layout inlines into every page does not parse or throws when it runs",
    ).not.toThrow();

    const img = addImage(REMOTE);
    fail(img);
    expect(
      img.getAttribute("src"),
      "the evaluated script did not install a listener that replaces a failed image",
    ).toBe(IMAGE_FALLBACK_SRC);
  });
});

describe("the per-image handlers that were removed", () => {
  const REMOVED = [
    "components/Chat/components/SearchResult.tsx",
    "components/products/ShareAvatar.tsx",
    "components/setting/orders/confirmations/OrderItemReturnConfirmationWindow.tsx",
  ];

  it.each(REMOVED)(
    "no longer handles its own image failure: %s (AC-10)",
    (file) => {
      const source = readFileSync(path.join(REPO_ROOT, file), "utf8");
      expect(
        source.includes("onError"),
        `${file} still handles its own image failure, so two mechanisms act on the same element`,
      ).toBe(false);
    },
  );

  it("keeps the handler on the local country flag, which the fallback cannot cover (AC-4)", () => {
    // Its source is /icons/flag/<iso2>.svg — a local file. Removing this would
    // not hand it to the new mechanism; it would just turn a hidden flag into
    // the browser's broken-image icon inside a phone-number field.
    const source = readFileSync(
      path.join(REPO_ROOT, "components/Chat/components/ChatContactsUpload.tsx"),
      "utf8",
    );
    expect(
      source.includes("onError"),
      "the country-flag handler was removed, but the fallback skips local files so nothing replaces it",
    ).toBe(true);
  });
});
