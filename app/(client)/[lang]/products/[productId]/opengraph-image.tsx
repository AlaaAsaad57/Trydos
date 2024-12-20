import "public/styles/og.css";

import { ImageResponse } from "next/og";
import { getProductDataOG } from "store/homepage/cachedActions";
export const size = {
  width: 300,
  height: 300,
};
export const alt = "TryDos";
export const contentType = "image/png";
export const runtime = "edge";
export default async function og({
  params,
}: {
  params: { productId: string; lang: string };
}) {
  const slug = params.productId;
  const product = await getProductDataOG({ slug, lang: params.lang });
  console.log(product, "productsssssss");
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
        </div>
      </div>
    ),
    size
  );
}
