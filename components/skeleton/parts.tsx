import type { CSSProperties, ReactNode } from "react";
import { Skeleton } from "components/Server/Skeleton";

/**
 * The parts every page skeleton is made of, so all of them share one look.
 * The sizes come from the real pages, measured at 440 px wide. Every x is from
 * the start edge, so a shape mirrors on an Arabic or Kurdish page.
 */

/** The fill of a new screen's card (MenuRow, Field). */
export const PANEL = "#fcfcfc";
/** The fill of an old page's card. */
export const OLD_PANEL = "#f8f8f8";

/** A card with the real card's fill. The bones sit inside it. */
export function Panel({
  mt = 4,
  height,
  inset = 12,
  fill = PANEL,
  radius = 15,
  style,
  children,
}: {
  mt?: number;
  height: number;
  inset?: number;
  fill?: string;
  radius?: number;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        margin: `${mt}px ${inset}px 0`,
        height,
        background: fill,
        borderRadius: radius,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A bone at a fixed place inside a Panel or a page. */
export function At({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: ReactNode;
}) {
  return (
    <div className="absolute" style={{ insetInlineStart: x, top: y }}>
      {children}
    </div>
  );
}

/** The 50 px head of a new screen: the back mark and the centred title. */
export function ScreenHead({
  title = 100,
  action = false,
}: {
  title?: number;
  action?: boolean;
}) {
  return (
    <div className="relative shrink-0" style={{ height: 50 }}>
      <At x={24} y={15}>
        <Skeleton width={12} height={21} borderRadius={4} />
      </At>
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton width={title} height={16} borderRadius={8} />
      </div>
      {action && (
        <div className="absolute" style={{ insetInlineEnd: 20, top: 17 }}>
          <Skeleton width={27} height={16} borderRadius={8} />
        </div>
      )}
    </div>
  );
}

/** The head of an old page (BackBar): 50 px under 20 px of space. */
export function PageHead({
  title = 90,
  top = 20,
  mark = false,
}: {
  title?: number;
  top?: number;
  mark?: boolean;
}) {
  return (
    <div className="relative shrink-0" style={{ height: 50, marginTop: top }}>
      <At x={24} y={15}>
        <Skeleton width={11} height={20} borderRadius={4} />
      </At>
      {title > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton width={title} height={15} borderRadius={8} />
        </div>
      )}
      {mark && (
        <div className="absolute" style={{ insetInlineEnd: 24, top: 15 }}>
          <Skeleton width={20} height={20} borderRadius={6} />
        </div>
      )}
    </div>
  );
}

/** The grey strip under a form's head: the info mark and two lines. */
export function InfoStrip({ height = 48 }: { height?: number }) {
  return (
    <div
      className="relative shrink-0"
      style={{ height, background: OLD_PANEL }}
    >
      <At x={12} y={(height - 25) / 2}>
        <Skeleton width={25} height={25} borderRadius={13} />
      </At>
      <At x={48} y={height / 2 - 13}>
        <Skeleton width={300} height={11} borderRadius={6} />
      </At>
      <At x={48} y={height / 2 + 3}>
        <Skeleton width={220} height={11} borderRadius={6} />
      </At>
    </div>
  );
}

/** One field of a form: 55 px, a small label and a value. */
export function FieldPanel({ mt = 4 }: { mt?: number }) {
  return (
    <Panel mt={mt} height={55}>
      <At x={12} y={10}>
        <Skeleton width={70} height={11} borderRadius={6} />
      </At>
      <At x={12} y={30}>
        <Skeleton width={130} height={14} borderRadius={7} />
      </At>
    </Panel>
  );
}

/** One row of a menu: 60 px, the icon and the label. */
export function MenuPanel({
  mt = 4,
  label = 110,
  icon = 30,
  textX = 54,
}: {
  mt?: number;
  label?: number;
  icon?: number;
  textX?: number;
}) {
  return (
    <Panel mt={mt} height={60}>
      <At x={12} y={(60 - icon) / 2}>
        <Skeleton width={icon} height={icon} borderRadius={icon / 4} />
      </At>
      <At x={textX} y={23}>
        <Skeleton width={label} height={14} borderRadius={7} />
      </At>
    </Panel>
  );
}

/** A mark with a word under it, as in the row at the foot of a screen. */
export function MarkWithWord({
  dark = false,
  word = 34,
}: {
  dark?: boolean;
  word?: number;
}) {
  const tone = dark ? "skeleton-dark" : undefined;
  return (
    <div className="flex flex-col items-center" style={{ gap: 10, width: 60 }}>
      <Skeleton className={tone} width={24} height={24} borderRadius={7} />
      {word > 0 && (
        <Skeleton className={tone} width={word} height={11} borderRadius={6} />
      )}
    </div>
  );
}
