"use client";
import dynamic from "next/dynamic";
const WebviewCall = dynamic(() => import("components/global/WebviewCall"), {
  ssr: false,
});
export const runtime = "nodejs";

function page() {
  console.log("Webview Call Page Rendered");
  return (
    <div>
      <WebviewCall />
    </div>
  );
}

export default page;
