import React, { memo, useState } from "react";
import { BuyButtonProduct } from "../ListingPage/Product";
import Image from "next/image";
import ProductBanner from "components/products/ProductBanner";
import VerifiedIcon from "public/svg/listing/VerifiedIcon";
import { ProductLabelsAnimated } from "components/products/ProductLabelsAnimated";
import { GetImageUrl } from "utils/tinyUtils";
import { getConfiguredImage } from "utils/functions";
import { NormalSlider } from "utils/Slider";

function ProductColorCard({
  product,
  params,
  currency,
  productColor,
  onClick,
  language = "en",
  Sliders = true,
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  return (
    <div
      className="max-h-[377px] relative"
      key={product.slug}
      data-cy="product-card"
      onClick={() => {
        onClick();
      }}
    >
      <div
        // data={{
        //   is_product: true,
        //   ...product,
        //   sync_color_images: productColor
        //     ? [productColor]
        //     : product?.sync_color_images,
        //   images: productColor ? productColor.images : product?.images,
        //   href: `/${params.lang}/products/${product.slug}${
        //     productColor ? `?color=${productColor.color_name}` : ""
        //   }`,
        // }}
        // ariaLabel={`go to product ${product.slug} ${params.lang}`}
        // suppressHydrationWarning
        // href={`/${params.lang}/products/${product.slug}${
        //   productColor ? `?color=${productColor.color_name}` : ""
        // }`}
        onClick={(e) => {
          // @ts-ignore
          onClick();
        }}
        className="product-container  align-center flex-col relative pb-[10px]"
        data-cy="product_link"
      >
        <ProductBanner flashDeals={product.flash_deal_end_date} />
        <NormalSlider
          initialSlide={activeImageIndex}
          slideHeight={290}
          slideWidth={200}
          slidesArray={product.images?.map((image, index) => index)}
          onSlideChange={(index) => {
            setActiveImageIndex(index);
          }}
          renderSlide={({ index, slide, isActive }) => {
            const image = product.images[index];
            return (
              <React.Fragment>
                {/* <BorderImage isBig={true} /> */}
                <div className="inset-shadow-img w-[200px] h-[290px] rounded-15 absolute " />
                <Image
                  width={200}
                  height={300}
                  loading="eager"
                  fetchPriority="auto"
                  src={getConfiguredImage({
                    src: GetImageUrl(image.file_path),
                    width: 400,
                    height: 400,
                  })}
                  key={`${product.name}-${index}`}
                  className="w-[200px] h-[290px] border-[#d3d3d387] border-[1px] rounded-15 z-10  object-cover object-[top_center]"
                  alt={product.name || "alt"}
                />
              </React.Fragment>
            );
          }}
        />
        <div className="flex-row w-full justify-center gap-[1px] mt-[2px]">
          {product?.images?.map((s, i) => (
            <svg
              key={`product-image-dot-${i}`}
              xmlns="http://www.w3.org/2000/svg"
              width="4"
              height="4"
              viewBox="0 0 4 4"
            >
              <g
                id="Group_14318"
                data-name="Group 14318"
                transform="translate(-201 -520)"
              >
                <circle
                  id="Ellipse_578"
                  data-name="Ellipse 578"
                  cx="2"
                  cy="2"
                  r="2"
                  transform="translate(201 520)"
                  fill={activeImageIndex == i ? "#8D8D8D" : "#d3d3d3"}
                />
              </g>
            </svg>
          ))}
        </div>
        <div className="product-body pl-[13px] pr-[15px] z-10 flex-1 mt-[8px]  flex-col align-start justify-start max-h-[60px] min-h-[30px]">
          <p
            className="prouct-details max-w-full whitespace-normal inline-block  text-left align-top overflow-hidden  regular-text text-[#3c3c3c] text-[10px] max-h-[25px]"
            data-cy="productName"
          >
            <span className="flex-row align-center justify-start gap-[4px]">
              {product?.brand?.icon && (
                <img
                  src={GetImageUrl(product.brand.icon)}
                  alt={product.brand.name || "Brand"}
                  className="h-[8px] w-auto object-contain inline-block ml-[7px]"
                  loading="eager"
                  draggable="false"
                />
              )}
              <VerifiedIcon />
            </span>
            {product.name?.substring(0, 50)}
            {product?.brand && ` | ${product?.brand?.name}`}
            {product?.category && ` | ${product?.category?.name}`}
          </p>
          {product?.label_names?.length > 0 && (
            <ProductLabelsAnimated
              labels={product?.label_names?.map((s) => ({
                text: s,
                color: "#388CFF",
              }))}
            />
          )}
        </div>
      </div>
      <BuyButtonProduct
        isForColor={true}
        product={product}
        currency={currency}
        language={language}
        params={params}
      />
    </div>
  );
}

export default memo(ProductColorCard);
