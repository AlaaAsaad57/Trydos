"use server";
import dynamic from "next/dynamic";
const WebviewCall = dynamic(() =>
  import("components/global/WebviewCall", { ssr: false })
);

async function page() {
  return (
    <div>
      <WebviewCall />
    </div>
  );
}

export default page;
