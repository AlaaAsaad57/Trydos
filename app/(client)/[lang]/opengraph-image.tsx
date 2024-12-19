import "public/styles/og.css";
import LogoAuth from "public/svg/LogoAuth.svg";

import { ImageResponse } from "next/og";

export const size = {
  width: 300,
  height: 300,
};
export const alt = "TryDos";
export const contentType = "image/png";
export const runtime = "edge";
export default async function og({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams: string;
}) {
  return new ImageResponse(
    (
      <div tw="relative flex w-full h-full flex items-center justify-center">
        {/* Background */}
        <div tw="absolute flex inset-0">
          {/* Overlay */}
          <div tw="absolute flex inset-0 bg-black bg-opacity-50" />
        </div>
        <div tw="flex flex-col text-neutral-50"></div>
        <div
          style={{
            position: "absolute",
            left: "0",
            right: "0",
            margin: "auto 0",
            bottom: "0px",
            zIndex: "22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fafafa90",
            height: "100%",
            paddingBottom: "0px",
          }}
        >
          <LogoAuth style={{ scale: "0.4", transform: "scale(0.6)" }} />
        </div>
      </div>
    ),
    size
  );
}
