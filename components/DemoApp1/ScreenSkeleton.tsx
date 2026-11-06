import type { ReactNode } from "react";
import { Skeleton } from "components/Server/Skeleton";
import {
  At,
  FieldPanel,
  InfoStrip,
  MarkWithWord,
  MenuPanel,
  OLD_PANEL,
  Panel,
  ScreenHead,
} from "components/skeleton/parts";
import type { DemoStaticScreen } from "../DemoApp/demoRoutes";
import { PAGE_MAX, SAFE_TOP } from "./demo1Layout";

/**
 * What a new screen shows while its code loads, and from the tap until its
 * address is ready (PageCover). Each screen has its own shape, measured from
 * the real screen at 440 px, so nothing jumps when the screen comes.
 */

function Frame({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      data-pw="app-screen-skeleton"
      aria-hidden
      className="relative flex flex-col w-full mx-auto overflow-hidden"
      style={{
        maxWidth: PAGE_MAX,
        minHeight: "100dvh",
        paddingTop: SAFE_TOP,
        background: dark ? "#000" : "#fff",
      }}
    >
      {children}
    </div>
  );
}

/** Pushes what follows to the foot of the screen, 36 px above the edge. */
function Foot({ children }: { children: ReactNode }) {
  return (
    <div className="mt-auto" style={{ paddingBottom: 36 }}>
      {children}
    </div>
  );
}

/** Two half-width cards side by side. */
function Pair({ height }: { height: number }) {
  const tall = height > 60;
  return (
    <div className="flex shrink-0" style={{ margin: "4px 12px 0", gap: 4 }}>
      {[0, 1].map((i) => (
        <div key={i} className="relative flex-1">
          <Panel mt={0} inset={0} height={height}>
            <At x={12} y={tall ? 12 : 10}>
              <Skeleton
                width={tall ? 34 : 70}
                height={tall ? 34 : 11}
                borderRadius={6}
              />
            </At>
            <At x={12} y={tall ? 54 : 30}>
              <Skeleton width={90} height={14} borderRadius={7} />
            </At>
          </Panel>
        </div>
      ))}
    </div>
  );
}

function Profile() {
  return (
    <Frame>
      <div className="relative shrink-0" style={{ height: 74 }}>
        <At x={23} y={20}>
          <Skeleton width={86} height={43} borderRadius={8} />
        </At>
        <div
          className="absolute flex"
          style={{ insetInlineEnd: 23, top: 20, gap: 19 }}
        >
          {[0, 1].map((i) => (
            <Skeleton key={i} width={26} height={42} borderRadius={7} />
          ))}
        </div>
      </div>
      <Panel mt={0} height={140}>
        <At x={12} y={12}>
          <Skeleton width={50} height={50} borderRadius={6} />
        </At>
        <At x={12} y={70}>
          <Skeleton width={70} height={14} borderRadius={7} />
        </At>
        <At x={12} y={92}>
          <Skeleton width={130} height={14} borderRadius={7} />
        </At>
        <At x={12} y={114}>
          <Skeleton width={218} height={14} borderRadius={7} />
        </At>
        <div className="absolute" style={{ insetInlineEnd: 12, top: 12 }}>
          <Skeleton width={116} height={115} borderRadius={15} />
        </div>
      </Panel>
      <Panel height={108}>
        <At x={12} y={12}>
          <Skeleton width={134} height={14} borderRadius={7} />
        </At>
        <At x={32} y={32}>
          <Skeleton width={260} height={14} borderRadius={7} />
        </At>
        <div className="absolute" style={{ inset: "58px 12px 12px" }}>
          <Skeleton height={38} borderRadius={15} />
        </div>
      </Panel>
      <Pair height={103} />
      {[100, 130, 120, 80, 90].map((label, i) => (
        <MenuPanel key={i} label={label} icon={20} textX={41} />
      ))}
    </Frame>
  );
}

function Menu({ rows, title }: { rows: number[]; title: number }) {
  return (
    <Frame>
      <ScreenHead title={title} />
      {rows.map((label, i) => (
        <MenuPanel key={i} mt={i === 0 ? 20 : 4} label={label} />
      ))}
    </Frame>
  );
}

function Form({
  fields,
  button = false,
}: {
  fields: number;
  button?: boolean;
}) {
  return (
    <Frame>
      <ScreenHead title={150} action={!button} />
      <InfoStrip />
      {Array.from({ length: fields }, (_, i) => (
        <FieldPanel key={i} mt={i === 0 ? 12 : 4} />
      ))}
      {button && (
        <Foot>
          <div style={{ marginInline: 20 }}>
            <Skeleton height={60} borderRadius={20} />
          </div>
        </Foot>
      )}
    </Frame>
  );
}

function ClientInfo() {
  return (
    <Frame>
      <ScreenHead title={140} />
      <Panel mt={12} height={55}>
        <At x={12} y={10}>
          <Skeleton width={50} height={11} borderRadius={6} />
        </At>
        <At x={12} y={30}>
          <Skeleton width={60} height={14} borderRadius={7} />
        </At>
        <div className="absolute" style={{ insetInlineEnd: 12, top: 8 }}>
          <Skeleton width={39} height={39} borderRadius={6} />
        </div>
      </Panel>
      <Pair height={55} />
      <Pair height={55} />
      <FieldPanel />
      <Foot>
        <div className="flex flex-col" style={{ gap: 8, marginInline: 12 }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={56} borderRadius={15} />
          ))}
        </div>
      </Foot>
    </Frame>
  );
}

function Photo() {
  return (
    <Frame>
      <ScreenHead title={100} />
      <div style={{ margin: "20px 40px 0", height: 350 }}>
        <Skeleton height={350} borderRadius={30} />
      </div>
      <div className="flex justify-center" style={{ marginTop: 20, gap: 28 }}>
        <MarkWithWord word={38} />
        <MarkWithWord word={58} />
      </div>
      <Foot>
        <Panel mt={0} inset={20} height={124}>
          <At x={24} y={12}>
            <Skeleton width={110} height={13} borderRadius={7} />
          </At>
          <At x={24} y={33}>
            <Skeleton width={300} height={11} borderRadius={6} />
          </At>
          <At x={24} y={50}>
            <Skeleton width={240} height={11} borderRadius={6} />
          </At>
          <div className="absolute" style={{ inset: "74px 12px 12px" }}>
            <Skeleton height={38} borderRadius={15} />
          </div>
        </Panel>
      </Foot>
    </Frame>
  );
}

function ClientId() {
  return (
    <Frame>
      <ScreenHead title={70} />
      <div
        className="flex flex-col items-center shrink-0"
        style={{ marginTop: 20 }}
      >
        <Skeleton width={250} height={250} borderRadius={12} />
        <div style={{ marginTop: 10 }}>
          <Skeleton width={70} height={16} borderRadius={8} />
        </div>
      </div>
      <div style={{ marginInline: 12, marginTop: 50 }}>
        <FieldPanel mt={0} />
        <FieldPanel />
      </div>
      <Foot>
        <div className="flex justify-center" style={{ gap: 30 }}>
          {[34, 56, 36].map((word, i) => (
            <MarkWithWord key={i} word={word} />
          ))}
        </div>
      </Foot>
    </Frame>
  );
}

function Wallet() {
  return (
    <Frame>
      <ScreenHead title={170} />
      <div style={{ margin: "12px 24px 0" }}>
        <Skeleton width={115} height={14} borderRadius={7} />
      </div>
      <div className="flex shrink-0" style={{ margin: "12px 12px 0", gap: 6 }}>
        {[0, 1].map((i) => (
          <div key={i} className="flex-1" style={{ height: 103 }}>
            <Skeleton height={103} borderRadius={15} />
          </div>
        ))}
      </div>
      <div style={{ margin: "20px 24px 0" }}>
        <Skeleton width={90} height={14} borderRadius={7} />
      </div>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Panel key={i} mt={i === 0 ? 12 : 4} height={50}>
          <At x={12} y={8}>
            <Skeleton width={16} height={34} borderRadius={6} />
          </At>
          <At x={36} y={8}>
            <Skeleton width={110} height={14} borderRadius={7} />
          </At>
          <At x={36} y={28}>
            <Skeleton width={190} height={12} borderRadius={6} />
          </At>
          <div className="absolute" style={{ insetInlineEnd: 12, top: 8 }}>
            <Skeleton width={40} height={14} borderRadius={7} />
          </div>
          <div className="absolute" style={{ insetInlineEnd: 12, top: 28 }}>
            <Skeleton width={40} height={12} borderRadius={6} />
          </div>
        </Panel>
      ))}
    </Frame>
  );
}

function ChatList() {
  return (
    <Frame>
      <Panel mt={6} height={38} radius={12} fill={OLD_PANEL} />
      <div
        className="flex items-center justify-center shrink-0"
        style={{ height: 56, gap: 111 }}
      >
        {[0, 1].map((i) => (
          <Skeleton key={i} width={25} height={25} borderRadius={7} />
        ))}
      </div>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="relative shrink-0"
          style={{
            height: 100,
            marginTop: 2,
            borderBottom: "0.3px solid #d3d3d3",
          }}
        >
          <At x={12} y={12}>
            <Skeleton width={66} height={76} borderRadius={15} />
          </At>
          <At x={90} y={14}>
            <Skeleton width={120} height={14} borderRadius={7} />
          </At>
          <At x={90} y={36}>
            <Skeleton width={260} height={12} borderRadius={6} />
          </At>
          <At x={90} y={53}>
            <Skeleton width={180} height={12} borderRadius={6} />
          </At>
          <div className="absolute" style={{ insetInlineEnd: 13, top: 13 }}>
            <Skeleton width={36} height={11} borderRadius={6} />
          </div>
        </div>
      ))}
    </Frame>
  );
}

function Conversation() {
  const bubble = (mt: number, width: number, end: boolean) => (
    <div
      className="flex shrink-0"
      style={{
        marginTop: mt,
        paddingInline: 12,
        justifyContent: end ? "flex-end" : "flex-start",
      }}
    >
      <Skeleton width={width} height={50} borderRadius={20} />
    </div>
  );
  return (
    <Frame>
      <div className="relative shrink-0" style={{ height: 50 }}>
        <At x={19} y={14}>
          <Skeleton width={11} height={23} borderRadius={4} />
        </At>
        <At x={62} y={6}>
          <Skeleton width={38} height={38} borderRadius={10} />
        </At>
        <At x={112} y={17}>
          <Skeleton width={95} height={15} borderRadius={8} />
        </At>
        <div
          className="absolute flex"
          style={{ insetInlineEnd: 25, top: 12, gap: 30 }}
        >
          {[0, 1].map((i) => (
            <Skeleton key={i} width={26} height={26} borderRadius={7} />
          ))}
        </div>
      </div>
      {bubble(20, 217, true)}
      {bubble(48, 232, false)}
      {bubble(32, 307, true)}
      {bubble(8, 120, true)}
      {bubble(32, 140, false)}
      <div
        className="flex items-center mt-auto"
        style={{ height: 68, padding: "0 12px", gap: 12 }}
      >
        <Skeleton width={20} height={20} borderRadius={6} />
        <div className="flex-1" style={{ height: 38 }}>
          <Skeleton height={38} borderRadius={12} />
        </div>
        <Skeleton width={38} height={38} borderRadius={19} />
      </div>
    </Frame>
  );
}

function Contact() {
  return (
    <Frame>
      <At x={19} y={14}>
        <Skeleton width={11} height={23} borderRadius={4} />
      </At>
      <div
        className="flex flex-col items-center shrink-0"
        style={{ marginTop: 52 }}
      >
        <Skeleton width={131} height={150} borderRadius={20} />
        <div style={{ marginTop: 14 }}>
          <Skeleton width={100} height={15} borderRadius={8} />
        </div>
        <div style={{ marginTop: 10 }}>
          <Skeleton width={139} height={14} borderRadius={7} />
        </div>
      </div>
      <div
        className="flex justify-around shrink-0"
        style={{ margin: "53px 17px 0" }}
      >
        {[24, 36, 42].map((word, i) => (
          <MarkWithWord key={i} word={word} />
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <MenuPanel key={i} mt={i === 0 ? 55 : 2} label={90} icon={18} textX={42} />
      ))}
      <Foot>
        <div className="flex justify-around" style={{ marginInline: 40 }}>
          {[60, 30, 34].map((word, i) => (
            <MarkWithWord key={i} word={word} />
          ))}
        </div>
      </Foot>
    </Frame>
  );
}

function Call() {
  const dark = "skeleton-dark";
  return (
    <Frame dark>
      <div
        className="flex flex-col items-center shrink-0"
        style={{ marginTop: 142 }}
      >
        <Skeleton className={dark} width={200} height={200} borderRadius={20} />
        <div style={{ marginTop: 20 }}>
          <Skeleton className={dark} width={140} height={20} borderRadius={10} />
        </div>
        <div style={{ marginTop: 10 }}>
          <Skeleton className={dark} width={118} height={14} borderRadius={7} />
        </div>
        <div style={{ marginTop: 58 }}>
          <Skeleton className={dark} width={25} height={25} borderRadius={13} />
        </div>
      </div>
      <Foot>
        <div className="flex justify-around" style={{ marginInline: 30 }}>
          {[0, 52, 0].map((word, i) => (
            <MarkWithWord key={i} dark word={word} />
          ))}
        </div>
      </Foot>
    </Frame>
  );
}

const SHAPES: Partial<Record<DemoStaticScreen, () => ReactNode>> = {
  settings: () => <Profile />,
  "settings/photo": () => <Photo />,
  "settings/client-id": () => <ClientId />,
  "settings/profile": () => <Menu title={50} rows={[63, 82, 134, 52]} />,
  "settings/profile/client-info": () => <ClientInfo />,
  "settings/profile/personal-info": () => <Form fields={3} />,
  "settings/profile/body": () => <Form fields={3} />,
  "settings/profile/address": () => <Form fields={0} button />,
  "settings/profile/address/new": () => <Form fields={4} button />,
  "settings/preferences": () => (
    <Menu title={60} rows={[100, 130, 90, 60, 70]} />
  ),
  "settings/wallet": () => <Wallet />,
  chat: () => <ChatList />,
  "chat/conversation": () => <Conversation />,
  "chat/contact": () => <Contact />,
  "chat/call": () => <Call />,
};

export default function ScreenSkeleton({
  screen,
}: {
  screen: DemoStaticScreen;
}) {
  return <>{SHAPES[screen]?.() ?? <Menu title={100} rows={[100, 100, 100]} />}</>;
}
