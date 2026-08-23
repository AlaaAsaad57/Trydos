"use client";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import AutoHeight from "embla-carousel-auto-height";
import { useAppStore } from "store";
import { sanitizeHtml } from "utils/sanitizeHtml";

export function BoutiqueSliderWrapper({ boutique, children }) {
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000 }),
    AutoHeight(),
  ]);
  function decodeHtmlSSR(input, depth = 2) {
    let str = input;

    const entities = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#34;": '"',
      "&#39;": "'",
      "&apos;": "'",
      "&hellip;": "…",
      "&rsquo;": "’",
      "&lsquo;": "‘",
      "&ldquo;": "“",
      "&rdquo;": "”",
      "&ndash;": "–",
      "&mdash;": "—",
    };

    for (let i = 0; i < depth; i++) {
      str = str?.replace(
        /&(amp|lt|gt|quot|#34|#39|apos|hellip|rsquo|lsquo|ldquo|rdquo|ndash|mdash);/g,
        (match) => entities[match] || match,
      );
    }

    return str;
  }
  return (
    <div
      className="w-full flex justify-center items-center overflow-hidden min-h-[15vh]  relative"
      ref={emblaRef}
    >
      <div className="embla__container flex h-auto">{children}</div>
      <div
        style={{
          direction: isRtl ? "rtl" : "ltr",
        }}
        className="absolute flex-col px-[12px] items-start gap-[3px] z-20 bottom-0 left-0 w-full h-[54px] bg-linear-to-t from-[rgba(0,0,0,0.5)] to-[rgba(0,0,0,0)] flex"
      >
        <span
          className="bold text-[16px] uppercase text-white"
          data-pw="boutique-name"
        >
          {boutique?.name}
        </span>
        {boutique?.description && (
          <span
            data-pw="boutique-description"
            className="regular text-[16px] text-white"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(decodeHtmlSSR(boutique?.description)),
            }}
          ></span>
        )}
      </div>
    </div>
  );
}
