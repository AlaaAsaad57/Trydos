import "public/styles/og.css";
import LogoAuth from "public/svg/LogoAuth.svg";

import { ImageResponse } from "next/og";
import { getProductDataOG } from "store/homepage/cachedActions";
export const size = {
  width: 300,
  height: 300,
};
export const alt = "TryDos";
export const contentType = "image/png";
export default async function og({
  params,
}: {
  params: { productId: string; lang: string };
}) {
  const slug = params.productId;
  const product = {
    name: "",
    images: [""],
    category: { name: "" },
    brand: { name: "" },
    price: "",
    price_formatted: "",
  };
  return new ImageResponse(
    (
      <div tw="relative flex w-full h-full flex items-center justify-center">
        {/* Background */}
        <div tw="absolute flex inset-0">
          <img
            tw="flex flex-1 object-fill"
            className="object-fill"
            src={product?.images[0]}
            style={{ objectFit: "fill" }}
            alt={product?.name}
          />
          {/* Overlay */}
          <div tw="absolute flex inset-0 bg-black bg-opacity-50" />
        </div>
        <div tw="flex flex-col text-neutral-50">
          {/* Title */}
          <div tw="text-xl font-bold">{product?.name}</div>
          {/* Tags */}
          <div tw="flex mt-6 flex-wrap items-center text-s text-neutral-200">
            <div tw={`font-medium `}>{product?.category.name}</div>
            <div tw="w-4 h-4 mx-6 rounded-full bg-neutral-300 " />
            <div>{product?.brand.name}</div>
            <div
              tw={`w-4 h-4 mx-6 rounded-full bg-neutral-300 ${
                product?.price && "text-emerald-600"
              }`}
            />
            <div
              className="en-regular"
              style={{
                fontFamily: "var(--SF-Pro-Rounded-Regular) ",
              }}
            >
              {product?.price_formatted}
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: "0",
            right: "0",
            margin: "auto 0",
            bottom: "0px",
            zIndex: "99999999999",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            backgroundColor: "#fafafa38",
            height: "100%",
            paddingBottom: "20px",
          }}
        >
          <LogoAuth style={{ scale: "0.4", transform: "scale(0.6)" }} />
        </div>
      </div>
    ),
    size
  );
}
