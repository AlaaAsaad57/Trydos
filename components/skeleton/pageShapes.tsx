import type { ReactNode } from "react";
import { Skeleton } from "components/Server/Skeleton";
import { PAGE_MAX } from "components/DemoApp1/demo1Layout";
import { At, InfoStrip, OLD_PANEL, PageHead, Panel } from "./parts";

/**
 * The skeletons of the pages that are not new screens. Each has its page's
 * shape, measured at 440 px, so nothing jumps when the page comes. This file
 * has no client code, so a `loading.tsx` can use it as well as PageCover.
 */
function Page({
  children,
  fill = "#fff",
}: {
  children: ReactNode;
  fill?: string;
}) {
  return (
    <div
      data-pw="page-skeleton"
      aria-hidden="true"
      className="relative flex flex-col w-full mx-auto overflow-hidden"
      style={{ maxWidth: PAGE_MAX, minHeight: "100dvh", background: fill }}
    >
      {children}
    </div>
  );
}

/** Lines of a paragraph: 15 px text on 27 px lines. */
function Lines({ widths }: { widths: string[] }) {
  return (
    <div className="flex flex-col" style={{ gap: 13 }}>
      {widths.map((width, i) => (
        <Skeleton key={i} width={width} height={14} borderRadius={7} />
      ))}
    </div>
  );
}

/** About, Contact, Privacy and Terms (StaticPage). */
export function TextPageSkeleton() {
  return (
    <Page>
      <PageHead title={92} />
      <div
        className="flex flex-col"
        style={{ margin: "12px 12px 0", gap: 20 }}
      >
        <Skeleton width={190} height={24} borderRadius={8} />
        <Lines widths={["100%", "96%", "98%", "60%"]} />
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col" style={{ gap: 12 }}>
            <Skeleton width={120} height={18} borderRadius={8} />
            <Lines widths={["100%", "94%", "98%", "45%"]} />
          </div>
        ))}
      </div>
    </Page>
  );
}

/** The orders list: the status chips, then the order cards. */
export function OrdersSkeleton() {
  return (
    <Page>
      <PageHead title={0} mark />
      <div
        className="flex items-center shrink-0 overflow-hidden"
        style={{ margin: "16px 0 0 28px", gap: 8, height: 26 }}
      >
        <Skeleton className="shrink-0" width={20} height={20} borderRadius={6} />
        {[40, 71, 81, 71, 80].map((width, i) => (
          <Skeleton
            key={i}
            className="shrink-0"
            width={width}
            height={26}
            borderRadius={12}
          />
        ))}
      </div>
      <div
        className="flex flex-col"
        style={{ margin: "26px 24px 0", gap: 10 }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={200} borderRadius={15} />
        ))}
      </div>
    </Page>
  );
}

/** My Checklist: the head with its mark, then the product cards. */
export function ChecklistSkeleton() {
  return (
    <Page>
      <PageHead title={116} />
      <div className="flex flex-col" style={{ margin: "8px 12px 0", gap: 8 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={96} borderRadius={15} />
        ))}
      </div>
    </Page>
  );
}

/** The country and language pages: the info strip and a list to pick from. */
export function ChoicesSkeleton({
  top = 0,
  title = 116,
}: {
  top?: number;
  title?: number;
}) {
  return (
    <Page>
      <PageHead title={title} top={top} />
      <div style={{ marginTop: 12 }}>
        <InfoStrip height={50} />
      </div>
      <div
        className="flex items-center shrink-0"
        style={{ margin: "19px 24px 0", gap: 6 }}
      >
        <Skeleton width={15} height={15} borderRadius={8} />
        <Skeleton width={108} height={13} borderRadius={7} />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <Panel key={i} mt={12} height={53} fill={OLD_PANEL}>
          <At x={13} y={18}>
            <Skeleton width={25} height={17} borderRadius={3} />
          </At>
          <At x={55} y={20}>
            <Skeleton width={70} height={14} borderRadius={7} />
          </At>
        </Panel>
      ))}
    </Page>
  );
}

/** The notification settings: two groups of rows. */
export function NotificationsSkeleton() {
  const row = (mt: number, height: number, mark: number) => (
    <Panel mt={mt} inset={28} height={height} fill={OLD_PANEL}>
      <At x={16} y={height / 2 - 7}>
        <Skeleton width={120} height={14} borderRadius={7} />
      </At>
      <div
        className="absolute"
        style={{ insetInlineEnd: 16, top: height / 2 - 13 }}
      >
        <Skeleton width={mark} height={26} borderRadius={13} />
      </div>
    </Panel>
  );
  const label = (mt: number) => (
    <div className="shrink-0" style={{ margin: `${mt}px 28px 0` }}>
      <Skeleton width={150} height={13} borderRadius={7} />
    </div>
  );
  return (
    <Page>
      <PageHead title={0} />
      {label(44)}
      {row(13, 50, 94)}
      {row(8, 50, 94)}
      {label(20)}
      {row(13, 56, 46)}
      {row(8, 56, 46)}
      {row(8, 56, 46)}
      {row(8, 56, 46)}
    </Page>
  );
}

/** The search page before anything is typed. */
export function SearchSkeleton() {
  return (
    <Page>
      <Panel mt={6} height={38} radius={12} fill={OLD_PANEL}>
        <At x={10} y={10}>
          <Skeleton width={19} height={19} borderRadius={6} />
        </At>
      </Panel>
      <div style={{ margin: "9px 12px 0" }}>
        <Skeleton width={70} height={32} borderRadius={12} />
      </div>
      <div
        className="flex shrink-0 overflow-hidden"
        style={{ margin: "30px 0 0 36px", gap: 11 }}
      >
        {[141, 108, 143, 101].map((width, i) => (
          <Skeleton
            key={i}
            className="shrink-0"
            width={width}
            height={29}
            borderRadius={10}
          />
        ))}
      </div>
      {[32, 18, 18].map((mt, i) => (
        <Panel key={i} mt={mt} inset={10} height={75} fill={OLD_PANEL}>
          <At x={10} y={9}>
            <Skeleton width={85} height={14} borderRadius={7} />
          </At>
        </Panel>
      ))}
      <div
        className="absolute inset-x-0 flex justify-center"
        style={{ bottom: 113 }}
      >
        <Skeleton width={64} height={40} borderRadius={12} />
      </div>
    </Page>
  );
}

/** The login page: the logo in the middle and the line at the foot. */
export function LoginSkeleton() {
  return (
    <Page>
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton width={180} height={90} borderRadius={15} />
      </div>
      <div
        className="absolute inset-x-0 flex justify-center"
        style={{ bottom: 74 }}
      >
        <Skeleton width={235} height={31} borderRadius={12} />
      </div>
    </Page>
  );
}

/** The shop list of a seller. */
export function SellerShopsSkeleton() {
  return (
    <Page fill="#fafafa">
      <PageHead title={77} top={16} />
      <div className="flex flex-col" style={{ margin: "12px 20px 0", gap: 10 }}>
        <Skeleton width={130} height={26} borderRadius={8} />
        <Skeleton width={230} height={14} borderRadius={7} />
      </div>
      <div className="flex flex-col" style={{ margin: "20px 20px 0", gap: 16 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white"
            style={{
              borderRadius: 15,
              padding: 20,
              boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
            }}
          >
            <div className="flex items-center" style={{ gap: 14 }}>
              <Skeleton
                className="shrink-0"
                width={52}
                height={52}
                borderRadius={15}
              />
              <div className="flex flex-col flex-1" style={{ gap: 8 }}>
                <Skeleton width="66%" height={14} borderRadius={7} />
                <Skeleton width="33%" height={12} borderRadius={6} />
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <Skeleton height={44} borderRadius={12} />
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}

/** One order: the head, then the blocks of OrderDetailsSkeleton. */
export function OrderSkeleton() {
  return (
    <Page>
      <PageHead title={100} mark />
      <div className="flex flex-col" style={{ margin: "12px 12px 0", gap: 10 }}>
        <Skeleton height={120} borderRadius={15} />
        <Skeleton height={200} borderRadius={15} />
        <Skeleton height={200} borderRadius={15} />
        <Skeleton height={120} borderRadius={15} />
      </div>
    </Page>
  );
}
