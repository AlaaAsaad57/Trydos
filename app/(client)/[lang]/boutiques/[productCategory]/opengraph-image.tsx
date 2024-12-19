import "public/styles/og.css";
import { ImageResponse } from "next/og";
import { getBoutiqueMeta } from "utils/functions";
export const size = {
  width: 400,
  height: 300,
};
export const alt = "TryDos";
export const contentType = "image/png";
export const runtime = "edge";
export default async function og({
  params,
}: {
  params: { lang: string; productCategory: string };
}) {
  let boutique = await getBoutiqueMeta({
    lang: params.lang,
    boutiqueId: params.productCategory,
  });

  return new ImageResponse(
    (
      <div tw="relative flex w-full h-full flex items-center justify-center">
        {/* Background */}

        <div tw="absolute flex inset-0">
          <img
            tw="flex flex-1 object-fill"
            className="object-fill"
            src={boutique.image}
            style={{ objectFit: "fill" }}
            alt={boutique.image}
          />
          {/* Overlay */}
        </div>
      </div>
    ),
    size
  );
}
