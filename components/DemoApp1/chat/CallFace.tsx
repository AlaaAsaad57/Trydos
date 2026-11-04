"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React from "react";
import XdIcon from "../../DemoApp/XdIcon";
import type { XdIconName } from "../../DemoApp/xdIcons";
import { CHAT } from "./chatTheme";
import {
  C,
  DESIGN_H,
  SAFE_BOTTOM,
  SF_ROUNDED,
  STATUS_BAR,
  sfTop,
  textTop,
} from "../demo1Layout";
import { ScreenPage, Stroke, Txt } from "../ui";

/** Where a call is: dialling, waiting for the other side, or talking (the timer runs). */
export type CallPhase = "calling" | "ringing" | "live";

/** A person on the call, as the call page draws them. */
export type CallPerson = {
  name: string;
  phone: string;
  /** The picture; none shows the grey box with the initials. */
  photo?: string;
  initials: string;
};

/**
 * The call page — XD `Chat home / Call – 1` (one person) and `– 3` (two). A
 * black page:
 *
 *   - the grey chevron (3 px line, 8 x 20 at 20, 65) and the add-person mark
 *     25 x 25 at (385, 63) — grey, blue once a person was added (`– 3`);
 *   - the photo 200 x 200, radius 12, a 1 px `#388CFF` line, shadow 0 10 15
 *     (white at 20%), centred at y 190. With two people: 150 x 150 each at
 *     x 55 and 225 (the second with shadow -3 3 10, black at 20%);
 *   - the name SF Pro Rounded 20 `#D3D3D3` on baseline 427 and the number
 *     SF Pro Rounded Light 14 `#8D8D8D` on 450, centred under the photo;
 *   - the call's state: a 25 px phone at y 511 and its words on baseline
 *     559 — grey "Calling …", then blue "Ringing …" (the file says "Rining",
 *     fixed by D-7), then green with the timer "03:44". The file stacks the
 *     three; the page shows the one the call is in.
 *   - at the bottom (y 825): the microphone at x 50, the red phone at 203
 *     with "End Call" on baseline 873, the camera at 355. The file stacks
 *     each switch's two states; the page draws the one that is on.
 *
 * Only the drawing: the `/demo` preview (CallScreen) and the real call
 * (LiveCall) give it their state. A video call puts the other side's video
 * over the whole page and mine in a small box; the XD file has no video
 * call, so the designer checks those two boxes (D-36b).
 */
export default function CallFace({
  people,
  phase,
  seconds,
  mic,
  camera,
  added,
  warning,
  remoteVideo,
  localVideo,
  onBack,
  onEnd,
  onMic,
  onCamera,
  onAddPerson,
  t,
}: {
  /** One person, or two once a person was added (`– 3`). */
  people: readonly CallPerson[];
  phase: CallPhase;
  /** The call's length, shown while it is live. */
  seconds: number;
  mic: boolean;
  camera: boolean;
  /** The add-person mark is blue. */
  added: boolean;
  /** A line under the call's state (the old "the call ends in" warning). */
  warning?: string | null;
  /** The other side's video, over the whole page. */
  remoteVideo?: React.ReactNode;
  /** My video, in the small box. */
  localVideo?: React.ReactNode;
  onBack: () => void;
  onEnd: () => void;
  onMic: () => void;
  onCamera: () => void;
  onAddPerson: () => void;
  t: (key: DemoKey) => string;
}) {
  const STATE: Record<CallPhase, { icon: XdIconName; text: string }> = {
    calling: { icon: "callPhoneGrey", text: t("Calling …") },
    ringing: { icon: "callPhoneBlue", text: t("Ringing …") },
    live: { icon: "callPhoneGreen", text: clock(seconds) },
  };

  const nameTop = sfTop(427, 20, 24);
  const phoneTop = sfTop(450, 14, 17);
  const stateTop = sfTop(559, 14, 17);
  const two = people.length > 1;

  const footer = (
    <div
      data-pw="demo-call-controls"
      className="absolute left-0 right-0 flex items-start"
      style={{
        bottom: `calc(${DESIGN_H - (sfTop(873, 14, 17) + 17)}px + ${SAFE_BOTTOM})`,
      }}
    >
      <Switch
        on={mic}
        icons={["micOn", "micOff"]}
        label="Microphone"
        testId="demo-call-mic"
        ml={50}
        onClick={onMic}
        t={t}
      />
      <button
        type="button"
        data-pw="demo-call-end"
        onClick={onEnd}
        className="flex flex-col items-center shrink-0 cursor-pointer active:opacity-60"
        style={{ marginInlineStart: 203 - 75, width: 25 }}
      >
        <XdIcon name="endCall" />
        <SfText size={14} weight={300} color={C.red} mt={sfTop(873, 14, 17) - 850}>
          {t("End Call")}
        </SfText>
      </button>
      <Switch
        on={camera}
        icons={["camOn", "camOff"]}
        label="Camera"
        testId="demo-call-camera"
        ml={355 - 228}
        onClick={onCamera}
        t={t}
      />
    </div>
  );

  return (
    <ScreenPage testId="demo-call" bg={CHAT.callPage} scrollTop={STATUS_BAR} footer={footer}>
      {remoteVideo && (
        <div data-pw="demo-call-remote-video" className="fixed inset-0" style={{ zIndex: 0 }}>
          {remoteVideo}
        </div>
      )}
      <div className="relative flex items-start w-full shrink-0" style={{ zIndex: 1 }}>
        <button
          type="button"
          data-pw="demo-back"
          aria-label={t("Back")}
          onClick={onBack}
          className="flex shrink-0 cursor-pointer active:opacity-60"
          style={{ marginInlineStart: 18.5, marginTop: 63.5 - 50 }}
        >
          <span className="flex rtl:-scale-x-100">
            <XdIcon name="callBackGrey" />
          </span>
        </button>
        <button
          type="button"
          data-pw="demo-call-add-person"
          aria-label={t("Add person")}
          aria-pressed={added}
          onClick={onAddPerson}
          className="flex shrink-0 ms-auto cursor-pointer active:opacity-60"
          style={{ marginInlineEnd: 430 - 410, marginTop: 63 - 50 }}
        >
          <XdIcon name={added ? "addPersonBlue" : "addPersonGrey"} />
        </button>
      </div>

      {localVideo && (
        <div
          data-pw="demo-call-local-video"
          className="absolute overflow-hidden"
          style={{ top: 100, insetInlineEnd: 20, width: 100, height: 150, borderRadius: 12, zIndex: 1 }}
        >
          {localVideo}
        </div>
      )}

      {!remoteVideo && (
        <div className="flex items-start justify-center shrink-0" style={{ marginTop: 190 - 86.5 }}>
          {people.slice(0, 2).map((p, i) => (
            <Person
              key={i}
              person={p}
              size={two ? 150 : 200}
              shadow={i === 0 ? "0 10px 15px rgba(255,255,255,0.2)" : "-3px 3px 10px rgba(0,0,0,0.2)"}
              ml={i === 0 ? undefined : 20}
              nameTop={nameTop - (two ? 340 : 390)}
              phoneTop={phoneTop - (nameTop + 24)}
            />
          ))}
        </div>
      )}

      <div
        data-pw={`demo-call-state-${phase}`}
        className="relative flex flex-col items-center shrink-0"
        style={{ marginTop: remoteVideo ? 511 - 86.5 : 511 - (phoneTop + 17), zIndex: 1 }}
      >
        <XdIcon name={STATE[phase].icon} />
        <SfText size={14} weight={300} color={C.grey} mt={stateTop - 536}>
          {STATE[phase].text}
        </SfText>
        {warning && (
          <SfText size={14} weight={300} color={C.red} mt={4}>
            {warning}
          </SfText>
        )}
      </div>
    </ScreenPage>
  );
}

/** Seconds as "03:44". */
const clock = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** One SF Pro Rounded line, 17 px tall for 14 px text, with the file's 0.01 em spacing. */
function SfText({
  size,
  weight,
  color,
  mt,
  lineHeight = 17,
  children,
}: {
  size: number;
  weight: 300 | 400;
  color: string;
  mt: number;
  lineHeight?: number;
  children: React.ReactNode;
}) {
  return (
    <span
      className="block text-center whitespace-nowrap"
      style={{
        marginTop: mt,
        fontFamily: SF_ROUNDED,
        fontSize: size,
        fontWeight: weight,
        lineHeight: `${lineHeight}px`,
        letterSpacing: "0.01em",
        color,
      }}
    >
      {children}
    </span>
  );
}

/** A person: the photo with its blue line and shadow, the name and the number centred under it. */
function Person({
  person,
  size,
  shadow,
  ml,
  nameTop,
  phoneTop,
}: {
  person: CallPerson;
  size: number;
  shadow: string;
  ml?: number;
  /** The gap from the photo's bottom to the name's box. */
  nameTop: number;
  /** The gap from the name's box to the number's box. */
  phoneTop: number;
}) {
  return (
    <div className="flex flex-col items-center shrink-0" style={{ marginInlineStart: ml, width: size }}>
      <div className="relative shrink-0" style={{ width: size, height: size, borderRadius: 12, boxShadow: shadow }}>
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: 12, background: person.photo ? undefined : C.field }}
        >
          {person.photo ? (
            <img src={person.photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <Txt center size={size / 4} weight="medium" mt={textTop(size, size / 4)}>
              {person.initials}
            </Txt>
          )}
        </div>
        <Stroke color={CHAT.callBlue} width={1} radius={12} />
      </div>
      <SfText size={20} weight={400} color={CHAT.callName} mt={nameTop} lineHeight={24}>
        {person.name}
      </SfText>
      <SfText size={14} weight={300} color={C.grey} mt={phoneTop}>
        <span dir="ltr">{person.phone}</span>
      </SfText>
    </div>
  );
}

/** A switch that shows its "on" icon or its "off" icon (the file draws both). */
function Switch({
  on,
  icons,
  label,
  testId,
  ml,
  onClick,
  t,
}: {
  on: boolean;
  icons: [XdIconName, XdIconName];
  label: DemoKey;
  testId: string;
  ml: number;
  onClick: () => void;
  t: (key: DemoKey) => string;
}) {
  return (
    <button
      type="button"
      data-pw={testId}
      aria-label={t(label)}
      aria-pressed={on}
      onClick={onClick}
      className="flex shrink-0 cursor-pointer active:opacity-60"
      style={{ marginInlineStart: ml }}
    >
      <XdIcon name={on ? icons[0] : icons[1]} />
    </button>
  );
}
