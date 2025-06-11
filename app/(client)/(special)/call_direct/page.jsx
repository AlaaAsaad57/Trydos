import dynamic from "next/dynamic";
const WebviewCall = dynamic(() => import("components/global/WebviewCall"), {
  ssr: false,
});
export const runtime = "nodejs";

function page() {
  return (
    <div>
      <WebviewCall />
    </div>
  );
}

export default page;
