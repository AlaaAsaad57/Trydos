"use client";

/**
 * Seller-dashboard placeholders.
 *
 * Every shape in the seller dashboard is built from ONE block, {@link DashSkeletonBlock},
 * so the whole area pulses as a single system rather than drifting into several
 * near-identical greys. The style is Tailwind `animate-pulse` over the dashboard
 * tint tokens (`#f0f0f0` / `#f4f4f4`), which is what the seller shop-list page
 * already uses — not `react-loading-skeleton`, which is the storefront loaders'
 * style and would need its own container work to sit inside these cards.
 *
 * WHY THIS FILE LIVES HERE AND IMPORTS NOTHING FROM `components/SellerDashboard/`
 * `InFlowPageLoader` renders above every route in the app, so whatever it imports
 * ships in the shared chunk for every visitor. Importing the dashboard's own
 * `ui/index.tsx` would drag `Spinner`, `translateFunction` and the 295-line
 * `ui/icons.tsx` along with it. Tailwind classes only, no other import: keep it
 * that way.
 *
 * ACCESSIBILITY
 * The shapes carry `aria-hidden` — a placeholder is not content and must not be
 * read out. The wrapper carries `aria-busy`, so replacing the old
 * "Loading products..." labels does not silently drop the loading state.
 */

/** The one placeholder block. Every shape below is made of these. */
export function DashSkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <span
      data-pw="dash-skeleton-block"
      className={`block bg-[#f0f0f0] animate-pulse ${className}`}
    />
  );
}

/** Shared wrapper: `aria-busy` on the region, `aria-hidden` on the shapes. */
function Shape({
  name,
  className = "",
  children,
}: {
  name: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-pw={`dash-skeleton-${name}`} aria-busy="true" className="w-full">
      <div aria-hidden="true" className={className}>
        {children}
      </div>
    </div>
  );
}

/** One product card: 4:5 image, category line, two title lines, a price row. */
function ProductCardShape() {
  return (
    <div className="bg-white rounded-[16px] overflow-hidden border border-[#ededed]">
      <DashSkeletonBlock className="w-full aspect-[4/5]" />
      <div className="p-3.5">
        <DashSkeletonBlock className="h-[10px] w-1/3 rounded-full mb-2" />
        <DashSkeletonBlock className="h-[11px] w-full rounded-full mb-1.5" />
        <DashSkeletonBlock className="h-[11px] w-2/3 rounded-full mb-2.5" />
        <div className="flex items-end justify-between gap-2 pt-2.5 border-t border-[#f4f4f4]">
          <DashSkeletonBlock className="h-[16px] w-1/2 rounded-full" />
          <DashSkeletonBlock className="h-[12px] w-1/4 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** One boutique card: a 160px banner and a two-line body. */
function BoutiqueCardShape() {
  return (
    <div className="bg-white rounded-[16px] overflow-hidden border border-[#ededed]">
      <DashSkeletonBlock className="w-full h-[160px]" />
      <div className="p-3.5">
        <DashSkeletonBlock className="h-[12px] w-2/3 rounded-full mb-2" />
        <DashSkeletonBlock className="h-[10px] w-1/3 rounded-full" />
      </div>
    </div>
  );
}

/** The header row above a list: title block on the left, action on the right. */
function SectionHeaderShape() {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
      <div className="flex items-center gap-2.5">
        <DashSkeletonBlock className="w-[22px] h-[22px] rounded-[6px]" />
        <DashSkeletonBlock className="h-[14px] w-[110px] rounded-full" />
      </div>
      <DashSkeletonBlock className="h-[38px] w-[130px] rounded-[12px]" />
    </div>
  );
}

/** Products tab: header + a 2/4-column card grid, matching the real grid. */
export function ProductGridSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <Shape name="product-grid">
      <SectionHeaderShape />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {Array.from({ length: cards }, (_, i) => (
          <ProductCardShape key={i} />
        ))}
      </div>
    </Shape>
  );
}

/** Boutiques tab: header + a 1/3-column card grid, matching the real grid. */
export function BoutiqueGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <Shape name="boutique-grid">
      <SectionHeaderShape />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 mt-4">
        {Array.from({ length: cards }, (_, i) => (
          <BoutiqueCardShape key={i} />
        ))}
      </div>
    </Shape>
  );
}

/** Any list of rows — users, roles, permissions, locations, comments, orders. */
export function ListRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Shape name="list-rows" className="flex flex-col gap-2.5">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-white rounded-[12px] border border-[#ededed] p-3.5"
        >
          <DashSkeletonBlock className="w-[40px] h-[40px] rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <DashSkeletonBlock className="h-[12px] w-1/3 rounded-full mb-2" />
            <DashSkeletonBlock className="h-[10px] w-1/5 rounded-full" />
          </div>
          <DashSkeletonBlock className="h-[28px] w-[76px] rounded-full shrink-0" />
        </div>
      ))}
    </Shape>
  );
}

/** A grid of media tiles — the gallery and stories tabs. */
export function TileGridSkeleton({ tiles = 12 }: { tiles?: number }) {
  return (
    <Shape name="tile-grid">
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: tiles }, (_, i) => (
          <DashSkeletonBlock key={i} className="w-full aspect-square rounded-[12px]" />
        ))}
      </div>
    </Shape>
  );
}

/** A form or a settings panel — shop info, excel upload. */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <Shape name="form" className="flex flex-col gap-4">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i}>
          <DashSkeletonBlock className="h-[11px] w-[90px] rounded-full mb-2" />
          <DashSkeletonBlock className="h-[44px] w-full rounded-[12px]" />
        </div>
      ))}
    </Shape>
  );
}

/**
 * The short, content-free wait — a permission check, or a small panel loading
 * inside something already on screen. Deliberately NOT a content shape: a
 * permission check may end in a refusal, and drawing the shape of products the
 * seller is about to be refused is worse than drawing nothing much.
 */
export function InlineSkeleton() {
  return (
    <Shape name="inline" className="flex items-center justify-center py-14">
      <DashSkeletonBlock className="h-[12px] w-[180px] rounded-full" />
    </Shape>
  );
}

/**
 * The whole dashboard, for the in-flow navigation loader: the back bar, the
 * heading block and a product grid. Keeps the document tall while the real page
 * is `display:none`, which is what stops the page collapsing on the back
 * journey.
 */
export default function SellerDashboardLoader() {
  return (
    <div
      data-pw="seller-dashboard-loader"
      aria-busy="true"
      className="w-full max-w-[1366px] mx-auto p-4 lg:p-6"
    >
      <div aria-hidden="true">
        <div className="flex items-center gap-3 mb-6">
          <DashSkeletonBlock className="w-[24px] h-[24px] rounded-[6px]" />
          <DashSkeletonBlock className="h-[16px] w-[160px] rounded-full" />
        </div>
        <div className="bg-white rounded-[15px] p-5 lg:p-6 mb-5">
          <DashSkeletonBlock className="h-[18px] w-[220px] rounded-full mb-3" />
          <DashSkeletonBlock className="h-[12px] w-[320px] max-w-full rounded-full" />
        </div>
      </div>
      <ProductGridSkeleton />
    </div>
  );
}
