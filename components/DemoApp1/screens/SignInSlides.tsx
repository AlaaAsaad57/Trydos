"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { PREVIEW_SLIDES } from "NewLoginDesign/previewSlides";
import type { DemoKey } from "../../DemoApp/demoKeys";
import { useDemoNav } from "../screenNav";
import { C, fill } from "../demo1Layout";

/**
 * The sign-in request's card and its page dots, as one slider: the quick
 * preview's slider (NewLoginDesign/QuickPreviewScreen.tsx), with its slides
 * (previewSlides.tsx). The file (`Sign In request`) draws the card empty, a
 * 390 x 186 box with a 0.5 px `#4A31E7` line and radius 20 at (20, 565), and
 * the dots under it at y 761.
 *
 * As in the quick preview:
 *  - each slide is its own card, with its own line, so a swipe carries one
 *    card out and the next one in. SLIDE_GAP is the space between two cards,
 *    seen only while dragging: the window runs SLIDE_GAP / 2 wider than the
 *    card on each side, and as much taller, so the line is never clipped;
 *  - a slide is the icon in a `#F4F0FE` circle, the title (20 Bold `#1D1D1D`)
 *    and its line (14 Regular `#5D5C5D`, 1.6 apart, at most 320 wide);
 *  - the dots follow the slide: the one on show is the 16 x 8 `#1D1D1D` pill,
 *    the others 8 px rings with a 1 px `#404040` line. A tap on a dot goes to
 *    its slide.
 *
 * The card is 186 tall, not the quick preview's 473, so the icon's circle is
 * 56, not 100 (ICONS.full). On a short window the card gives up height
 * (Sheet `keepHeight`). When a slide's icon, title and words no longer fit in
 * the card (a short phone, a long translation), the icons get smaller
 * (ICONS.small); when even that does not fit, the slides drop their icons,
 * and the words stay. All slides take the same step, so they look alike.
 *
 * The sheet closes on a drag down. A drag that starts on the card belongs to
 * the slider only, so the sheet never moves with a sideways swipe.
 */

/** The space between two cards while they slide, in px (the quick preview's). */
const SLIDE_GAP = 20;

/** The card in the file: its top, height and radius. */
const CARD = { y: 565, height: 186, radius: 20 } as const;

/**
 * The card's line, in px: the file's 0.5 px `#4A31E7`.
 *
 * The line is a CSS border on the card, not a `Stroke` (an SVG line laid
 * over the card and clipped to its edge). At a browser zoom of 80 %, 0.5 px
 * is less than one screen pixel, and the clip cut the bottom and right lines
 * away; at 125 % they were faint. The browser draws a border at least one
 * screen pixel wide, and a border is part of the box, so no clip removes it.
 * On a phone (2x, 3x) the two look the same.
 */
const LINE = 0.5;

/** The card's least height on a short window, in px: about half the file's 186. */
export const CARD_MIN = 96;

/** The icon: its circle, the line icon in it, and the space under it, in px; the full size and the size for a short card. */
const ICONS = {
  full: { circle: 56, size: 28, gap: 10 },
  small: { circle: 44, size: 22, gap: 8 },
} as const;

type IconStep = keyof typeof ICONS | "none";

/** The least white above and below a slide's content, in px. */
const SLIDE_PAD = 8;

/** The space between a slide's title and its words, in px. */
const TITLE_GAP = 6;

/** The page dots in the file: the pill, the rings, the space between them. */
const DOTS = { y: 761, pill: 16, size: 8, gap: 6 } as const;

export default function SignInSlides({ mt }: { mt: number }) {
  const { t } = useDemoNav();
  const [viewport, embla] = useEmblaCarousel({ loop: false, dragFree: false });
  const [index, setIndex] = useState(0);
  const card = useRef<HTMLDivElement>(null);
  const words = useRef<(HTMLDivElement | null)[]>([]);
  const [step, setStep] = useState<IconStep>("full");

  // Does every slide fit with its icon, and at which size? The words' height
  // does not change with the icon, so the step never swings back and forth.
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    const check = () => {
      const room = el.clientHeight - 2 * SLIDE_PAD;
      const tallest = Math.max(0, ...words.current.map((w) => w?.offsetHeight ?? 0));
      const fits = (k: keyof typeof ICONS) =>
        ICONS[k].circle + ICONS[k].gap + tallest <= room;
      setStep(fits("full") ? "full" : fits("small") ? "small" : "none");
    };
    check();
    const watch = new ResizeObserver(check);
    watch.observe(el);
    words.current.forEach((w) => w && watch.observe(w));
    return () => watch.disconnect();
  }, []);

  const onSelect = useCallback(() => {
    if (embla) setIndex(embla.selectedScrollSnap());
  }, [embla]);
  useEffect(() => {
    if (!embla) return;
    embla.on("select", onSelect);
    onSelect();
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla, onSelect]);

  // The sheet's drag listens on the sheet; a press on the card stops on its way
  // there, after the slider (inside the card) has seen it.
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    const keep = (e: PointerEvent) => e.stopPropagation();
    el.addEventListener("pointerdown", keep);
    return () => el.removeEventListener("pointerdown", keep);
  }, []);

  const icon = ICONS[step === "none" ? "small" : step];

  return (
    <>
      <div
        ref={card}
        data-pw="demo-sign-in-request-card"
        className="relative"
        style={{
          marginTop: mt,
          // Logical: on an RTL page the column starts on the right, and a
          // physical left margin put the card 20 px too far right.
          marginInlineStart: 20,
          width: fill(20),
          height: CARD.height,
          // On a short window the card is the block that gives up height.
          flexShrink: 1,
          minHeight: CARD_MIN,
        }}
      >
        <div
          ref={viewport}
          className="overflow-hidden cursor-grab active:cursor-grabbing"
          style={{
            width: `calc(100% + ${SLIDE_GAP}px)`,
            height: `calc(100% + ${SLIDE_GAP}px)`,
            margin: -SLIDE_GAP / 2,
          }}
        >
          <div className="flex h-full touch-pan-y">
            {PREVIEW_SLIDES.map((slide, i) => (
              <div
                key={slide.id}
                className="flex items-center justify-center h-full min-w-0 select-none"
                style={{ flex: "0 0 100%" }}
                aria-hidden={i !== index || undefined}
              >
                <div
                  data-pw="demo-sign-in-request-slide"
                  className="relative flex flex-col items-center justify-center text-center overflow-hidden"
                  style={{
                    width: `calc(100% - ${SLIDE_GAP}px)`,
                    height: `calc(100% - ${SLIDE_GAP}px)`,
                    borderRadius: CARD.radius,
                    // The line is the box's own border, not a `Stroke`: see LINE.
                    border: `${LINE}px solid ${C.purple}`,
                    background: C.white,
                    paddingInline: 20,
                  }}
                >
                  <div
                    data-slide-icon=""
                    className="items-center justify-center shrink-0 rounded-full"
                    style={{
                      display: step === "none" ? "none" : "flex",
                      width: icon.circle,
                      height: icon.circle,
                      marginBottom: icon.gap,
                      background: "#F4F0FE",
                      border: "1px solid #ECE9FE",
                      boxShadow: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
                    }}
                  >
                    {slide.icon(icon.size)}
                  </div>
                  <div
                    ref={(el) => {
                      words.current[i] = el;
                    }}
                    className="flex flex-col items-center shrink-0"
                  >
                    <h3
                      className="font-bold"
                      style={{ fontSize: 20, lineHeight: "25px", color: C.ink, marginBottom: TITLE_GAP }}
                    >
                      {t(slide.titleKey as DemoKey)}
                    </h3>
                    <p
                      className="font-normal"
                      style={{ fontSize: 14, lineHeight: 1.6, color: "#5D5C5D", maxWidth: 320 }}
                    >
                      {t(slide.descKey as DemoKey)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The dots: the pill on the slide on show, 6 px between each, centred. */}
      <div
        data-pw="demo-sign-in-request-dots"
        className="flex self-center shrink-0"
        style={{ marginTop: DOTS.y - (CARD.y + CARD.height), gap: DOTS.gap }}
      >
        {PREVIEW_SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            data-pw={`demo-sign-in-request-dot-${i}`}
            aria-label={`${t("Slide")} ${i + 1}`}
            aria-current={i === index || undefined}
            onClick={() => embla?.scrollTo(i)}
            className="block shrink-0 cursor-pointer"
            style={{
              width: i === index ? DOTS.pill : DOTS.size,
              height: DOTS.size,
              borderRadius: DOTS.size / 2,
              boxSizing: "border-box",
              background: i === index ? C.ink : "transparent",
              border: i === index ? "none" : `1px solid ${C.inkSoft}`,
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>
    </>
  );
}
