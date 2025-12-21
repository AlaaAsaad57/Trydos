"use client";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import AutoHeight from "embla-carousel-auto-height";
import { useAppStore } from "store";

export function BoutiqueSliderWrapper({ boutique, children }) {
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000 }),
    AutoHeight(),
  ]);
  const configureImage = (src) => {
    return src.replace(
      "/upload",
      `/upload/w_1356,c_pad,b_auto/f_auto/q_auto:best/fl_lossy/so_0`
    );
  };
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
        className="absolute flex-col px-[12px] items-start gap-[3px] z-20 bottom-0 left-0 w-full h-[54px] bg-gradient-to-t from-[rgba(0,0,0,0.5)] to-[rgba(0,0,0,0)] flex"
      >
        <span
          className="bold text-[16px] uppercase text-white"
          data-cy="boutique-name"
        >
          {boutique?.name}
        </span>
        <span
          data-cy="boutique-description"
          className="regular text-[16px] text-white"
          dangerouslySetInnerHTML={{
            __html: boutique?.description,
          }}
        ></span>
      </div>
    </div>
  );
}
