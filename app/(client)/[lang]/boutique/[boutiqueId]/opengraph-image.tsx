import "public/styles/og.css";
import { ImageResponse } from "next/og";
import { getBoutiqueMeta, getConfiguredImage } from "utils/functions";
export const size = {
  width: 300,
  height: 300,
};
export const alt = "TryDos";
export const contentType = "image/png";

export default async function og({
  params,
  searchParams,
}: {
  params: { lang: string; productCategory: string };
  searchParams: any;
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
            src={getConfiguredImage({
              src: boutique.image,
              width: 300,
              height: 300,
            })}
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
