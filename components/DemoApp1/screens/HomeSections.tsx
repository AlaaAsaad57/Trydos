"use client";

import React, { useRef, useState } from "react";
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

/** What the three blocks differ in: the tab and pill colour, the mark. */
const TONE = {
  stories: { color: C.ink, icon: "filmRoll" },
  brands: { color: C.purple, icon: "qualityAssurance" },
  stores: { color: BLUE, icon: "highQuality" },
} as const;

/**
 * A line of words with its parts in the file's weights: the named part
 * (`{name}` / `{brand}` in the translated text) is Medium and a closing `!`
 * is Bold; the rest is Regular. The key is looked up by the caller, so a
 * translation can put the named part anywhere in its sentence.
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
}: {
  text: string;
  token?: string;
  named?: string;
}) {
  const [head, tail] =
    token && named && text.includes(token)
      ? (text.split(token) as [string, string])
      : [text, ""];
  const closing = (part: string) =>
    part.endsWith("!") ? (
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
 * The top of a block: the tab on the left edge (10 x 20, round on the right),
 * the mark at x 16 and the title pill at x 40, 18 px under the tab's top; and
 * the line under them, 13 px, whose first baseline is 4 px under the pill.
 * The pill hugs its word (6 px each side, 20 tall; the word's baseline is 15
 * under the pill's top). The line keeps 16 px free on the right too, and
 * wraps there on a phone too narrow for it.
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
            borderRadius: "0 5px 5px 0",
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
 * (154 x 35), the logo under it, and "Shop <brand> Collection Now !" at 11
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
  logo,
  centreAt,
  style,
  snap = false,
}: {
  t: T;
  brand: string;
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
          text={t("Shop {brand} Collection Now !")}
          token="{brand}"
          named={brand}
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
 * The brand-store carousel: pages of three stacked cards (418 x 140, 2 apart),
 * the next page 2 px beyond the first, so 10 px of it shows at the right edge.
 * The purple bar down the left edge (4 x 424) stays put while the cards slide.
 */
function BrandCarousel({
  t,
  rowRef,
  onPage,
}: {
  t: T;
  rowRef: React.RefObject<HTMLDivElement | null>;
  onPage: (page: number) => void;
}) {
  return (
    <div className="relative shrink-0" style={{ marginTop: 8, height: 424 }}>
      <div
        ref={rowRef}
        data-pw="demo-home-brand-carousel"
        className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{
          gap: GAP,
          height: 424,
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
        }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const step = el.firstElementChild
            ? (el.firstElementChild as HTMLElement).offsetWidth + GAP
            : 1;
          onPage(Math.round(el.scrollLeft / step));
        }}
      >
        {Array.from({ length: PAGES }, (_, page) => (
          <div
            key={page}
            className="flex flex-col shrink-0"
            style={{
              gap: GAP,
              width: "calc(100% - 12px)",
              scrollSnapAlign: "start",
            }}
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
          </div>
        ))}
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

/** The store grid, down each column: name and logo (the last two columns have none in the file). */
const STORES: { name: string; logo?: Logo }[][] = [
  [
    { name: "Ebebek", logo: { src: "/assets/demo/home/brands/ebebek.svg", w: 77.43, h: 20, top: 65 } },
    { name: "Boyner", logo: { src: "/assets/demo/home/brands/boyner.svg", w: 140, h: 19.5, top: 65.25 } },
    { name: "Sephora", logo: { src: "/assets/demo/home/brands/sephora.svg", w: 140, h: 18.14, top: 65.93 } },
  ],
  [
    { name: "Gratis", logo: { src: "/assets/demo/home/brands/gratis.png", w: 90, h: 50, top: 50 } },
    { name: "Beymen", logo: { src: "/assets/demo/home/brands/beymen.svg", w: 140, h: 17.5, top: 66.25 } },
    { name: "Rossmann", logo: { src: "/assets/demo/home/brands/rossmann.svg", w: 140, h: 19.31, top: 65.35 } },
  ],
  [{ name: "Vakko" }, { name: "Koton" }, { name: "Zara" }],
  [{ name: "Stradivarius" }, { name: "Bershka" }, { name: "Koton" }],
];

/**
 * The store grid: two 208 columns show, 2 apart, and the next column shows
 * 10 px at the right edge. The blue bar down the left edge stays put.
 */
function StoreGrid({ t }: { t: T }) {
  return (
    <div className="relative shrink-0" style={{ marginTop: 8, height: 424 }}>
      <div
        data-pw="demo-home-store-grid"
        className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{ gap: GAP, height: 424, scrollbarWidth: "none" }}
      >
        {STORES.map((column, c) => (
          <div
            key={c}
            className="flex flex-col shrink-0"
            style={{ gap: GAP, width: `calc((100% - ${12 + GAP}px) / 2)` }}
          >
            {column.map((s, r) => (
              <BrandCard
                key={`${c}-${r}`}
                t={t}
                brand={s.name}
                logo={s.logo}
                style={{ width: "100%" }}
              />
            ))}
          </div>
        ))}
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
  const [page, setPage] = useState(0);
  const rowRef = useRef<HTMLDivElement>(null);
  const pick = (i: number) => {
    const row = rowRef.current;
    const first = row?.firstElementChild as HTMLElement | undefined;
    if (row && first)
      row.scrollTo({ left: i * (first.offsetWidth + GAP), behavior: "smooth" });
  };
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
        line={<Sentence text={t("Watch. Shop. Share. See It. Tag It !")} />}
      />
      <Stories />

      <BlockHead
        mt={8}
        tone={TONE.brands}
        title={t("Brand Stores")}
        line={
          <Sentence
            text={t("All {name} Collection Now !")}
            token="{name}"
            named={t("Turkish Brands")}
          />
        }
      />
      <BrandCarousel t={t} rowRef={rowRef} onPage={setPage} />
      <Pager page={page} onPick={pick} />

      {/* The stores' tab is at y 859, beside the pager (y 859 – 867). */}
      <BlockHead
        mt={-8}
        tone={TONE.stores}
        title={t("Stores")}
        line={
          <Sentence
            text={t("All {name} Collection Now !")}
            token="{name}"
            named={t("Stores")}
          />
        }
      />
      <StoreGrid t={t} />
    </div>
  );
}
