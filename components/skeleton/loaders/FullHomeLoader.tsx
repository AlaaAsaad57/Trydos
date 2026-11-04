import { Skeleton } from "components/Server/Skeleton";
import { C, PAGE_MAX } from "components/DemoApp1/demo1Layout";

/**
 * The home while it loads: the shape of the new home (Stage 7 of
 * UI-MIGRATION-PLAN.md, XD `Home Page` and `Home Page – 2`), so nothing jumps
 * when the page arrives. The 50 px white header with the search mark and the
 * category chips, the stories block (four 121 x 170 cards), and the Brand
 * Stores block (stacked 140 px cards). Every x is from the start edge, so it
 * mirrors on an Arabic or Kurdish page like the home does.
 *
 * Shown while a shopper goes home from a product, a listing, the featured and
 * flash-deal pages, or after an order (`is_full_home`).
 */
function BlockHead() {
  return (
    <div className="relative shrink-0" style={{ height: 38, marginTop: 8 }}>
      <div className="absolute" style={{ insetInlineStart: 16, top: 18 }}>
        <Skeleton width={100} height={20} borderRadius={6} />
      </div>
    </div>
  );
}

function FullHomeLoader() {
  return (
    <div
      data-pw="home-loader"
      className="w-full flex flex-col mx-auto overflow-hidden"
      style={{ maxWidth: PAGE_MAX, background: C.page, minHeight: "100dvh" }}
    >
      <div
        data-pw="home-loader-header"
        className="flex items-center shrink-0"
        style={{
          height: 50,
          background: C.white,
          boxShadow: "0 0 3px rgba(0,0,0,0.1)",
          paddingInlineStart: 15.5,
          gap: 18,
        }}
      >
        <Skeleton width={21} height={21} borderRadius={6} />
        {[44, 56, 60, 48, 64].map((w, i) => (
          <Skeleton key={i} width={w} height={14} borderRadius={7} />
        ))}
      </div>

      <BlockHead />
      <div style={{ marginInline: 16, marginTop: 4 }}>
        <Skeleton width={220} height={14} borderRadius={7} />
      </div>
      <div
        data-pw="home-loader-stories"
        className="flex shrink-0 overflow-hidden"
        style={{ gap: 10, padding: "11px 16px 0" }}
      >
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="shrink-0">
            <Skeleton width={121} height={170} borderRadius={20} />
          </div>
        ))}
      </div>

      <BlockHead />
      <div style={{ marginInline: 16, marginTop: 4 }}>
        <Skeleton width={240} height={14} borderRadius={7} />
      </div>
      <div
        data-pw="home-loader-cards"
        className="flex flex-col shrink-0"
        style={{ gap: 2, marginTop: 8, paddingInlineEnd: 12 }}
      >
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} width="100%" height={140} />
        ))}
      </div>
    </div>
  );
}

export default FullHomeLoader;
