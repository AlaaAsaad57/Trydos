"use client";
import React, { useState } from "react";
import SizesIcon from "public/svg/product/SizesIcon.svg";
import ColorsInfo from "public/svg/product/colorsInfo.svg";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import NormalSizesSlider from "./NormalSizesSlider";

import SizeInfoBox from "./SizeInfoBox";
import { Sendevent, translateFunction } from "utils/functions";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useAppStore } from "store";

function ProductSizes({ sizes }) {
  const { showInfoMessage } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const [extended, setExtended] = useState(false);
  const [activeColor, setActiveColorFunc] = useState([]);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const setActiveColor = (e) => {
    if (activeColor.includes(e)) {
      setActiveColorFunc(activeColor.filter((s) => s !== e));
    } else {
      setActiveColorFunc([...activeColor, e]);
    }
  };
  return (
    <div
      className={`product-colors product-sizes flex-row align-start relative ${
        extended && "extended-sizes-container"
      }`}
    >
      <div className="colors-label flex-row align-center">
        <SizesIcon data-cy="SizeIcon" />
        <span style={{ marginLeft: "5px" }} data-cy="SizeSpan">
          {translate("Available ")} {sizes.length} {translate("Sizes")}
        </span>
        <ColorsInfo
          data-cy="QuestionMark"
          style={{ marginLeft: "9px" }}
          onClick={() => {
            showInfoMessage({
              showInfoMessage: true,
              title: ` Available ${sizes.length} Sizes`,
              text: "According To The Opinions Of Our Fashion Team, The Appropriate Occasions For This Product Have Been Identified Based On Long Experience. We Provide An Opinion Only And Opinions May Differ From One Person To Another. So It Is Suitable For",
              icon: "/svg/product/SizesIcon.svg",
              value: [],
            });
          }}
        />
      </div>
      <NormalSizesSlider
        close={() => setExtended(false)}
        sizes={sizes}
        activeColor={activeColor}
        active={extended}
        setActiveColor={(e) => {
          const newParams = new URLSearchParams(searchParams);
          newParams.set("size", e);
          // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
          router.push(pathname + `?${newParams.toString()}`, { shallow: true });
          setActiveColor(e);
        }}
      />
      <div
        className={`colors-row flex-row ${
          extended && "colors-row-extended disable-slider"
        }`}
        style={{ width: `${175}px` }}
        onClick={() => {
          setExtended(!extended);
        }}
      >
        <Swiper
          data-cy="SizeBoxProductDetail"
          modules={[EffectCoverflow]}
          speed={100}
          effect="coverflow"
          slideToClickedSlide={true}
          onChange={() => {
            Sendevent({
              event: "button_clicked",
              value: "choose_available_size_button",
            });
          }}
          onSlideChange={(swiper) => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set("size", sizes[swiper.activeIndex].name);
            router.push(pathname + `?${newParams.toString()}`, {
              scroll: false,
              // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
              shallow: true,
            });
          }}
          coverflowEffect={{
            depth: 100,
            modifier: 1.8,
            scale: 1,
            stretch: 2.5,
            rotate: 0,
            slideShadows: false,
          }}
          slidesPerView={"auto"}
          threshold={1}
          centeredSlides={true}
          initialSlide={0}
          loop={false}
        >
          {sizes?.map((size, index) => (
            <SwiperSlide
              data-cy="ElementOnSizeBox"
              key={index}
              style={{
                overflow: "visible",
                width: "40px",
                height: "40px",
                position: "relative",
              }}
            >
              {({ isActive }) => (
                <div
                  className={`color-circle relative ${
                    isActive && "active-color-circle"
                  }`}
                >
                  <div className={`size-circle ${isActive && "active-size"}`}>
                    {size.name}
                  </div>

                  <img src="/svg/product/DashedCircleBorder.svg" />
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      {extended && <SizeInfoBox />}
    </div>
  );
}

export default ProductSizes;
