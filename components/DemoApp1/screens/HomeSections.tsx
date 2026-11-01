"use client";

import React, { useEffect, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import XdIcon from "../../DemoApp/XdIcon";
import type { DemoKey } from "../../DemoApp/demoKeys";
import { C, lineBox, textTop } from "../demo1Layout";
import { Stroke } from "../ui";

/**
 * The page under the Home header — XD `Home Page – 2`.
 *
 * Three blocks, each with a coloured tab on the left edge, a mark and a title
 * pill, and a line under them: the stories (a row of photo cards), the brand
 * stores (a carousel of wide cards, three to a page, with its pager) and the
 * stores (a grid of cards, three rows high, that scrolls sideways).
 *
 * Every number is design px from the file; y values below are on the 430 x 931
 * artboard, where the page body starts at y 100 (under the 50 px header).
 * Widths follow the file's distance from the screen edges, so on a 430 px
 * phone each is the file's own number.
 *
 * What the file leaves out stays out: the scrolled-away part of the artboard
 * (the third and fourth store columns have a name but no logo), the tab bar
 * (drawn once by the shell) and the status bar (the phone draws its own).
 *
 * Phone note (Safari on the iPhone): nothing here is `fixed` or `sticky`. The
 * header is the page's only sticky box (see ScreenPage), and the three rows
 * scroll sideways inside the document, which scrolls as one page.
 */

type T = (key: DemoKey) => string;

const BLUE = "#386EFF";
const RING = "#FFAB62";

/**
 * What the three blocks differ in: the tab and pill colour, the mark, and the
 * pill's width in the file (100, 91, 51). The width is a minimum, so a longer
 * word in another language still fits.
 */
const TONE = {
  stories: { color: C.ink, icon: "filmRoll", pill: 100 },
  brands: { color: C.purple, icon: "qualityAssurance", pill: 91 },
  stores: { color: BLUE, icon: "highQuality", pill: 51 },
} as const;

/**
 * A line of words with its parts in the file's weights: the named part
 * (`{name}` / `{brand}` in the translated text) is Medium, and the rest is
 * Regular. A closing `!` is Bold in the block lines, and Regular on the cards
 * (`boldBang={false}`), as the file draws them. The key is looked up by the
 * caller, so a translation can put the named part anywhere in its sentence.
 *
 * The line is a `<bdi>`: it takes its direction from its own first letter.
 * The page stays left to right in every language (as the file draws it), so
 * without it an Arabic line with a Latin brand name in it is laid out left to
 * right, and its parts and its `!` come out in the wrong order.
 */
function Sentence({
  text,
  token,
  named,
  boldBang = true,
}: {
  text: string;
  token?: string;
  named?: string;
  boldBang?: boolean;
}) {
  const [head, tail] =
    token && named && text.includes(token)
      ? (text.split(token) as [string, string])
      : [text, ""];
  const closing = (part: string) =>
    boldBang && part.endsWith("!") ? (
      <>
        {part.slice(0, -1)}
        <span className="font-bold">!</span>
      </>
    ) : (
      part
    );
  return (
    <bdi>
      {token && named && text.includes(token) ? (
        <>
          {head}
          <span className="font-medium">{named}</span>
          {closing(tail)}
        </>
      ) : (
        closing(head)
      )}
    </bdi>
  );
}

/**
 * The top of a block: the tab on the left edge (10 x 20, radius 20 on the
 * right, so the right end is a half circle), the mark at x 16 and the title
 * pill at x 40, 18 px under the tab's top; and the line under them, 13 px,
 * whose first baseline is 4 px under the pill. The pill is the file's width
 * at least (6 px before the word, 20 tall; the word's baseline is 15 under
 * the pill's top). The line keeps 16 px free on the right too, and wraps
 * there on a phone too narrow for it.
 */
function BlockHead({
  tone,
  title,
  line,
  mt,
}: {
  tone: (typeof TONE)[keyof typeof TONE];
  title: string;
  line: React.ReactNode;
  mt: number;
}) {
  return (
    <>
      {/* Decorative, and the stores' block lies over the pager's row: it must not catch the pager's taps. */}
      <div
        className="relative shrink-0 pointer-events-none"
        style={{ height: 38, marginTop: mt }}
      >
        <span
          aria-hidden="true"
          className="absolute"
          style={{
            left: 0,
            top: 0,
            width: 10,
            height: 20,
            background: tone.color,
            borderRadius: "0 20px 20px 0",
          }}
        />
        <div className="absolute" style={{ left: 16, top: 18 }}>
          <XdIcon name={tone.icon} />
        </div>
        <span
          className="absolute font-medium whitespace-nowrap"
          style={{
            left: 40,
            top: 18,
            height: 20,
            minWidth: tone.pill,
            padding: "2px 6px 0",
            borderRadius: 6,
            background: tone.color,
            color: C.card,
            fontSize: 13,
            lineHeight: `${lineBox(13)}px`,
          }}
        >
          {title}
        </span>
      </div>
      <p
        className="shrink-0 font-normal"
        style={{
          marginTop: 4,
          marginLeft: 16,
          marginRight: 16,
          fontSize: 13,
          lineHeight: `${lineBox(13)}px`,
          color: C.ink,
        }}
      >
        {line}
      </p>
    </>
  );
}

/** What each story card looks like: the file gives every card its own line and shadow. */
const STORIES = [
  {
    name: "Jon Plus",
    photo: "story-jon.jpg",
    radius: 15,
    shadow: "0 3px 5px rgba(93,93,93,0.2)",
    line: true,
  },
  {
    name: "Eda Love",
    photo: "story-eda.jpg",
    radius: 20,
    shadow: "0 3px 3px rgba(0,0,0,0.2)",
    line: false,
  },
  {
    name: "Ella",
    photo: "story-ella.jpg",
    radius: 20,
    shadow: "0 3px 3px rgba(93,93,93,0.5)",
    line: false,
  },
  {
    name: "Secret",
    photo: "story-secret.jpg",
    radius: 20,
    shadow: "0 4px 3px rgba(93,93,93,0.16)",
    line: false,
  },
] as const;

/** The sideways row of story cards: 121 x 170, 10 apart, the first at x 16. */
function Stories() {
  // The ring (6 px over the card's top left) and the shadow (down to 8 px
  // under the card) are drawn outside the card, and a row that scrolls clips
  // at its edges. So the row has that room as padding, and the same amount
  // as a negative margin, which leaves the cards where the file puts them.
  const ROOM_TOP = 6;
  const ROOM_BOTTOM = 10;
  return (
    <div
      data-pw="demo-home-stories"
      className="flex shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden"
      style={{
        gap: 10,
        padding: `${ROOM_TOP}px 16px ${ROOM_BOTTOM}px`,
        marginTop: 17 - ROOM_TOP,
        marginBottom: -ROOM_BOTTOM,
        scrollbarWidth: "none",
      }}
    >
      {STORIES.map((s) => (
        <div
          key={s.name}
          data-pw={`demo-story-${s.name}`}
          className="relative shrink-0"
          style={{ width: 121, height: 170 }}
        >
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ borderRadius: s.radius, boxShadow: s.shadow }}
          >
            <img
              src={`/assets/demo/home/${s.photo}`}
              alt=""
              draggable={false}
              className="block w-full h-full object-cover select-none"
            />
            {s.line && <Stroke color={C.grey} width={0.5} radius={s.radius} />}
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              borderRadius: 15,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0) 13.884%, rgba(0,0,0,0.502) 83.605%)",
            }}
          />
          {/* The name: 13 Regular white, baseline 161 under the card's top,
              centred 0.5 px right of the card's middle. */}
          <span
            className="absolute whitespace-nowrap font-normal text-center"
            style={{
              left: 0,
              right: 0,
              top: textTop(344 - 183, 13),
              paddingLeft: 1,
              fontSize: 13,
              lineHeight: `${lineBox(13)}px`,
              color: "#FFFFFF",
            }}
          >
            {s.name}
          </span>
          {/* The ring: 30 round at (-6, -6), 1 px of orange round a 28 photo.
              The file fills the 28 circle with the photo (cover: 28 x 42) and
              moves it down 0.125 of the circle, so its top is -7 + 3.5. The
              crop is made by the box, not by object-position: the app-wide
              `img { object-position: center !important }` in
              public/styles/globals.css would override that. */}
          <span
            aria-hidden="true"
            className="absolute overflow-hidden"
            style={{
              left: -6,
              top: -6,
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: RING,
              boxShadow: "0 0 3px rgba(255,255,255,0.3)",
            }}
          >
            <span
              className="absolute overflow-hidden"
              style={{ left: 1, top: 1, width: 28, height: 28, borderRadius: "50%" }}
            >
              <img
                src="/assets/demo/home/story-jon.jpg"
                alt=""
                draggable={false}
                className="absolute block select-none"
                style={{ left: 0, top: -3.5, width: 28, height: 42 }}
              />
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

type Logo = {
  src: string;
  w: number;
  h: number;
  /** Design px under the card's top. */
  top: number;
  /** Design px from the card's left; omitted, the logo is centred on the card. */
  left?: number;
};

/**
 * One card: white, a 0.3 `#8D8D8D` line, 140 tall; the awning at its top
 * (154 x 35), the logo under it, and "Shop <brand> collection now !" at 11
 * with its baseline 129 under the card's top.
 *
 * The brand-store cards are 418 wide, but the file builds their contents
 * for a 208 card: they sit round x 109. The store cards centre them.
 *
 * The words stay 8 px inside the card's edges. A line longer than that (a
 * Turkish one, or any line on a phone under about 345 px) wraps upwards from
 * the file's baseline, into the free space under the logo, so it never runs
 * into the next card.
 */
function BrandCard({
  t,
  brand,
  shown = brand,
  logo,
  centreAt,
  style,
  snap = false,
}: {
  t: T;
  brand: string;
  /** The brand as the card's line writes it in the file (some are lower case). */
  shown?: string;
  logo?: Logo;
  /** Design px from the card's left where the contents centre; omitted, the card's middle. */
  centreAt?: number;
  style?: React.CSSProperties;
  snap?: boolean;
}) {
  const at = centreAt === undefined ? "50%" : `${centreAt}px`;
  return (
    <div
      data-pw={`demo-brand-${brand}`}
      className="relative shrink-0 bg-white"
      style={{
        height: 140,
        scrollSnapAlign: snap ? "start" : undefined,
        ...style,
      }}
    >
      {/* The card's line is the first thing the file draws; the awning, logo and words lie over it. */}
      <Stroke color={C.grey} width={0.3} />
      <img
        src="/assets/demo/home/awning.svg"
        alt=""
        width={154}
        height={35}
        draggable={false}
        className="absolute block select-none"
        style={{ left: at, top: 0, transform: "translateX(-50%)" }}
      />
      {logo && (
        <img
          src={logo.src}
          alt={brand}
          width={logo.w}
          height={logo.h}
          draggable={false}
          className="absolute block select-none"
          style={{
            top: logo.top,
            left: logo.left === undefined ? at : logo.left,
            transform: logo.left === undefined ? "translateX(-50%)" : undefined,
          }}
        />
      )}
      <span
        className="absolute font-normal text-center"
        style={{
          left: at,
          // The file's words sit 1 px right of the card's middle (measured on
          // Ebebek, Mango and Gratis: its text widths are a little wider).
          marginLeft: 1,
          // Held by the bottom of the first line, so the baseline is the
          // file's 129 and a second line grows up, not out of the card.
          bottom: 140 - textTop(129, 11) - lineBox(11),
          transform: "translateX(-50%)",
          width: "max-content",
          maxWidth:
            centreAt === undefined ? "calc(100% - 16px)" : 2 * centreAt - 16,
          textWrap: "balance",
          fontSize: 11,
          lineHeight: `${lineBox(11)}px`,
          color: C.ink,
        }}
      >
        <Sentence
          text={t("Shop {brand} collection now !")}
          token="{brand}"
          named={shown}
          boldBang={false}
        />
      </span>
    </div>
  );
}

const BRANDS: { name: string; logo: Logo }[] = [
  {
    name: "Zara",
    logo: { src: "/assets/demo/home/brands/zara.svg", w: 47.55, h: 20, top: 65, left: 85.22 },
  },
  {
    name: "Mango",
    logo: { src: "/assets/demo/home/brands/mango.svg", w: 124.36, h: 20.22, top: 64.95, left: 46.51 },
  },
  {
    name: "Vakko",
    logo: { src: "/assets/demo/home/brands/vakko.svg", w: 110.15, h: 20, top: 65, left: 54 },
  },
];

/** The carousel's pages: the file draws two and a pager of three, each page the same three brands. */
const PAGES = 3;

/** Card gap in both rows, the space the file leaves between two cards. */
const GAP = 2;

/**
 * The motion of the two sliders (the brand carousel and the store grid).
 * The numbers follow common UI/UX guidance:
 *
 *  - SLIDE_DELAY_MS: 5 s on a slide before the auto slide. NN/g and WCAG
 *    2.2.2 (Pause, Stop, Hide) ask that content that moves by itself gives
 *    people enough time to read it. 5 s is the usual lowest value for that.
 *  - SLIDE_DURATION: Embla's own default speed (25). A slide takes about
 *    400 ms, inside Material Design's 300 – 500 ms for a large move.
 *  - The hint is a calm pull, not a jump:
 *    - HINT_WAIT_MS: the slider must stay in view for 500 ms first, so the
 *      hint does not run while the page is still scrolling past it.
 *    - out in 550 ms (Material 3 "long3") and back in 600 ms ("long4"). Both
 *      use the soft in-out curve (EASE_SOFT): the move starts slowly, speeds
 *      up and stops softly, like a finger pulling the slide.
 *      "Emphasized decelerate" was tried first. It is made for things that
 *      enter the screen, so it starts at full speed: measured in Chromium,
 *      the content moved 58 px in the first frame (45 % of the move).
 *    - a 350 ms rest ("medium3"), so the eye can read the next slide.
 *    - HINT_SHARE: the slider moves 25 % of its width (about 108 px on a
 *      430 px phone). That shows about 85 px of the next card's awning. The
 *      first 10 px are already there as the peek.
 */
const SLIDE_DELAY_MS = 5000;
const SLIDE_DURATION = 25;
const HINT_WAIT_MS = 500;
const HINT_SHARE = 0.25;
const HINT_OUT = 0.55;
const HINT_REST = 0.35;
const HINT_BACK = 0.6;
/** Material 2's "standard" curve: slow start, slow stop. */
const EASE_SOFT = [0.4, 0, 0.2, 1] as const;
/** Material 3's "standard" curve, for the quick put-back when a touch ends the hint. */
const EASE_STANDARD = [0.2, 0, 0, 1] as const;

/**
 * The part of the window where a slider counts as "in view": the window
 * without the sticky header at the top and the tab bar at the bottom, because
 * both lie over the page.
 */
const VIEW_MARGIN = "-60px 0px -80px 0px";

/** The hint starts when at least this share of the slider is in that part of the window. */
const HINT_IN_VIEW = 0.74;

/** The auto slide runs while at least this share of the slider is in that part of the window. */
const SLIDE_IN_VIEW = 0.9;

/**
 * One slider: Embla (the slider the shop's home page already uses, see
 * components/Home/OfferWidgets/BoutiqueElement.tsx) and its Autoplay plugin.
 *
 *  1. The hint. When the slider is in view (HINT_IN_VIEW of it, for
 *     HINT_WAIT_MS), what is inside each slide moves HINT_SHARE of the
 *     slider's width to the left and comes back, so the next slide shows for
 *     a moment. It runs once.
 *     - If less than HINT_IN_VIEW of the slider is in view before or during
 *       the hint, the hint stops, the slides go back, and the hint runs the
 *       next time the slider is in view.
 *     - If the person touches the slider first, the hint never runs: the
 *       person already knows it is a slider.
 *     - The hint moves the insides of the slides (a transform), not Embla's
 *       track, so the two never fight.
 *  2. The auto slide. While SLIDE_IN_VIEW of the slider is in view, it goes to the next slide
 *     after SLIDE_DELAY_MS. From the last slide it slides back to the first
 *     one (Autoplay does that because `loop` is off). A swipe or a pager tap
 *     starts the wait again. Nothing moves while a finger is on the slider,
 *     while it is out of view, or while the browser tab is hidden.
 *
 * Both also run when the system asks for less motion (prefers-reduced-motion).
 * Windows turns that on when "Animation effects" is off, and the hint then
 * never showed.
 */
function useSlider() {
  // One plugin for the life of the slider (a lazy state, not read from a ref
  // during render).
  const [autoplay] = useState(() =>
    Autoplay({
      delay: SLIDE_DELAY_MS,
      playOnInit: false,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
      stopOnFocusIn: false,
    }),
  );
  const [viewportRef, api] = useEmblaCarousel(
    {
      align: "start",
      loop: false,
      containScroll: "trimSnaps",
      duration: SLIDE_DURATION,
    },
    [autoplay],
  );
  const [page, setPage] = useState(0);
  const nudge = useMotionValue(0);

  // The pager follows the slide Embla is on.
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setPage(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect).on("reInit", onSelect);
    return () => {
      api.off("select", onSelect).off("reInit", onSelect);
    };
  }, [api]);

  // The hint and the auto slide run only while the slider is in view.
  useEffect(() => {
    if (!api) return;
    const plugin = autoplay;
    let done = false;
    let wait: ReturnType<typeof setTimeout> | undefined;
    let hint: AnimationPlaybackControls | null = null;

    /** Ends a waiting or running hint, and puts the slides back. */
    const cancel = () => {
      clearTimeout(wait);
      wait = undefined;
      if (!hint) return;
      hint.stop();
      hint = null;
      animate(nudge, 0, { duration: 0.2, ease: EASE_STANDARD });
    };

    const runHint = () => {
      const far = -Math.round(api.rootNode().clientWidth * HINT_SHARE);
      const total = HINT_OUT + HINT_REST + HINT_BACK;
      const run = animate(nudge, [0, far, far, 0], {
        duration: total,
        times: [0, HINT_OUT / total, (HINT_OUT + HINT_REST) / total, 1],
        ease: [EASE_SOFT, "linear", EASE_SOFT],
      });
      hint = run;
      run.then(() => {
        // Only a hint that ran to its end counts (cancel() clears `hint`).
        if (hint !== run) return;
        hint = null;
        done = true;
      });
    };

    // A touch first: no hint. A touch during the hint: it ends.
    const onGrab = () => {
      done = true;
      cancel();
    };
    api.on("pointerDown", onGrab);

    const watch = new IntersectionObserver(
      ([entry]) => {
        const shown = entry.intersectionRatio;
        if (shown >= SLIDE_IN_VIEW) plugin.play();
        else plugin.stop();
        if (shown < HINT_IN_VIEW) {
          cancel();
          return;
        }
        if (done || wait || hint) return;
        wait = setTimeout(() => {
          wait = undefined;
          runHint();
        }, HINT_WAIT_MS);
      },
      {
        rootMargin: VIEW_MARGIN,
        threshold: [0, 0.5, HINT_IN_VIEW, SLIDE_IN_VIEW, 1],
      },
    );
    watch.observe(api.rootNode());

    return () => {
      watch.disconnect();
      api.off("pointerDown", onGrab);
      plugin.stop();
      clearTimeout(wait);
      hint?.stop();
    };
  }, [api, nudge, autoplay]);

  const pick = (i: number) => {
    if (!api) return;
    api.scrollTo(i);
    // A pager tap starts the wait again.
    autoplay.reset();
  };

  return { viewportRef, page, pick, nudge };
}

/**
 * The brand-store carousel: pages of three stacked cards (418 x 140, 2 apart),
 * the next page 2 px beyond the first, so 10 px of it shows at the right edge.
 * The purple bar down the left edge (4 x 424) stays put while the cards slide.
 *
 * The pages will later hold images instead of cards. A page is a plain box of
 * the page's full size, so an image can take its place; the hint, the auto
 * slide and the pager do not depend on what a page holds.
 */
function BrandCarousel({
  t,
  viewportRef,
  nudge,
}: {
  t: T;
  viewportRef: (node: HTMLElement | null) => void;
  nudge: MotionValue<number>;
}) {
  return (
    <div className="relative shrink-0" style={{ marginTop: 8, height: 424 }}>
      <div
        ref={viewportRef}
        data-pw="demo-home-brand-carousel"
        className="overflow-hidden"
        // The page still scrolls up and down over the carousel.
        style={{ height: 424, touchAction: "pan-y pinch-zoom" }}
      >
        <div className="flex h-full" style={{ gap: GAP }}>
          {Array.from({ length: PAGES }, (_, page) => (
            <div
              key={page}
              data-pw={`demo-home-brand-page-${page}`}
              className="shrink-0 min-w-0"
              style={{ width: "calc(100% - 12px)" }}
            >
              <motion.div
                className="flex flex-col h-full"
                style={{ gap: GAP, x: nudge }}
              >
                {BRANDS.map((b) => (
                  <BrandCard
                    key={b.name}
                    t={t}
                    brand={b.name}
                    logo={b.logo}
                    centreAt={109}
                    style={{ width: "100%" }}
                  />
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
      <span
        aria-hidden="true"
        className="absolute"
        style={{ left: 0, top: 0, width: 4, height: 424, background: C.purple }}
      />
    </div>
  );
}

/**
 * The pager under the carousel: the page on show is a 16 x 8 pill, the rest
 * are 8 x 8 rings, 6 apart, centred; each has a 0.5 purple line inside.
 */
function Pager({ page, onPick }: { page: number; onPick: (page: number) => void }) {
  return (
    <div
      className="flex justify-center shrink-0"
      style={{ marginTop: 8, height: 8, gap: 6 }}
    >
      {Array.from({ length: PAGES }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={String(i + 1)}
          aria-current={i === page}
          data-pw={`demo-home-pager-${i}`}
          onClick={() => onPick(i)}
          className="relative shrink-0 cursor-pointer"
          style={{
            width: i === page ? 16 : 8,
            height: 8,
            borderRadius: 4,
            background: i === page ? "#E6E6E6" : C.card,
          }}
        >
          <Stroke color={C.purple} width={0.5} radius={4} />
        </button>
      ))}
    </div>
  );
}

/**
 * The store grid, down each column: name and logo (the last two columns have
 * none in the file). `shown` is the name as the card's line writes it in the
 * file, where it differs from the brand's own spelling.
 */
const STORES: { name: string; shown?: string; logo?: Logo }[][] = [
  [
    { name: "Ebebek", logo: { src: "/assets/demo/home/brands/ebebek.svg", w: 77.43, h: 20, top: 65 } },
    { name: "Boyner", shown: "boyner", logo: { src: "/assets/demo/home/brands/boyner.svg", w: 140, h: 19.5, top: 65.25 } },
    { name: "Sephora", shown: "sephora", logo: { src: "/assets/demo/home/brands/sephora.svg", w: 140, h: 18.14, top: 65.93 } },
  ],
  [
    { name: "Gratis", shown: "gratis", logo: { src: "/assets/demo/home/brands/gratis.png", w: 90, h: 50, top: 50 } },
    { name: "Beymen", shown: "beymen", logo: { src: "/assets/demo/home/brands/beymen.svg", w: 140, h: 17.5, top: 66.25 } },
    { name: "Rossmann", shown: "rossmann", logo: { src: "/assets/demo/home/brands/rossmann.svg", w: 140, h: 19.31, top: 65.35 } },
  ],
  [{ name: "Vakko" }, { name: "Koton", shown: "koton" }, { name: "Zara" }],
  [{ name: "Stradivarius", shown: "stradivarius" }, { name: "Bershka" }, { name: "Koton", shown: "koton" }],
];

/**
 * The store grid: two 208 columns show, 2 apart, and the next column shows
 * 10 px at the right edge. The blue bar down the left edge stays put.
 * It is a slider like the brand carousel (see useSlider): each column is a
 * slide, and the hint and the auto slide move it one column at a time.
 */
function StoreGrid({
  t,
  viewportRef,
  nudge,
}: {
  t: T;
  viewportRef: (node: HTMLElement | null) => void;
  nudge: MotionValue<number>;
}) {
  return (
    <div className="relative shrink-0" style={{ marginTop: 8, height: 424 }}>
      <div
        ref={viewportRef}
        data-pw="demo-home-store-grid"
        className="overflow-hidden"
        // The page still scrolls up and down over the grid.
        style={{ height: 424, touchAction: "pan-y pinch-zoom" }}
      >
        <div className="flex h-full" style={{ gap: GAP }}>
          {STORES.map((column, c) => (
            <div
              key={c}
              className="shrink-0 min-w-0"
              style={{ width: `calc((100% - ${12 + GAP}px) / 2)` }}
            >
              <motion.div
                className="flex flex-col h-full"
                style={{ gap: GAP, x: nudge }}
              >
                {column.map((s, r) => (
                  <BrandCard
                    key={`${c}-${r}`}
                    t={t}
                    brand={s.name}
                    shown={s.shown}
                    logo={s.logo}
                    style={{ width: "100%" }}
                  />
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
      <span
        aria-hidden="true"
        className="absolute"
        style={{ left: 0, top: 0, width: 4, height: 424, background: BLUE }}
      />
    </div>
  );
}

/**
 * The body of Home. `Home Page – 2` is the only home artboard whose page
 * is not empty; the category chips in the header do not change it.
 */
export default function HomeSections({ t }: { t: T }) {
  const brands = useSlider();
  const stores = useSlider();
  return (
    <div
      data-pw="demo-home-sections"
      className="flex flex-col w-full"
      // The page body starts at design y 100; the first tab is at y 108.
    >
      <BlockHead
        mt={8}
        tone={TONE.stories}
        title={t("Trydos Stories")}
        line={<Sentence text={t("Watch. Shop. Share. See it. Tag It !")} />}
      />
      <Stories />

      <BlockHead
        mt={8}
        tone={TONE.brands}
        title={t("Brand Stores")}
        line={
          <Sentence
            text={t("all {name} collection now !")}
            token="{name}"
            named={t("Turkish brands")}
          />
        }
      />
      <BrandCarousel
        t={t}
        viewportRef={brands.viewportRef}
        nudge={brands.nudge}
      />
      <Pager page={brands.page} onPick={brands.pick} />

      {/* The stores' tab is at y 859, beside the pager (y 859 – 867). */}
      <BlockHead
        mt={-8}
        tone={TONE.stores}
        title={t("Stores")}
        line={
          <Sentence
            text={t("all {name} collection now !")}
            token="{name}"
            named={t("Stores")}
          />
        }
      />
      <StoreGrid
        t={t}
        viewportRef={stores.viewportRef}
        nudge={stores.nudge}
      />
    </div>
  );
}
