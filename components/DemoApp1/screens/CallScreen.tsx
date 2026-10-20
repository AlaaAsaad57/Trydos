"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React, { useEffect, useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import type { XdIconName } from "../../DemoApp/xdIcons";
import {
  CALLER,
  CALL_TIMER_START,
  CHAT,
  CHAT_PHOTOS,
} from "../../DemoApp/demoChat";
import { useDemoNav } from "../Demo1Shell";
import {
  C,
  DESIGN_H,
  SAFE_BOTTOM,
  SF_ROUNDED,
  STATUS_BAR,
  sfTop,
} from "../demo1Layout";
import { ScreenPage, Stroke } from "../ui";

/**
 * A call — XD `Chat home / Call – 1` (one person) and `– 3` (two). A black
 * page:
 *
 *   - the grey chevron (3 px line, 8 x 20 at 20, 65) and the add-person mark
 *     25 x 25 at (385, 63) — grey, blue once a person was added (`– 3`);
 *   - the photo 200 x 200, radius 12, a 1 px `#388CFF` line, shadow 0 10 15
 *     (white at 20%), centred at y 190. With two people: 150 x 150 each at
 *     x 55 and 225 (the second with shadow -3 3 10, black at 20%);
 *   - the name SF Pro Rounded 20 `#D3D3D3` on baseline 427 and the number
 *     SF Pro Rounded Light 14 `#8D8D8D` on 450, centred under the photo;
 *   - the call's state: a 25 px phone at y 511 and its words on baseline
 *     559 — grey "Calling …", then blue "Rining …" (the file's spelling), then
 *     green with the timer "03:44". The file stacks the three; the demo shows
 *     them one after the other.
 *   - at the bottom (y 825): the microphone at x 50, the red phone at 203
 *     with "End Call" on baseline 873, the camera at 355. The file stacks
 *     each switch's two states; the demo draws the one that is on.
 */
export default function CallScreen() {
  const { t, back } = useDemoNav();
  const [second, setSecond] = useState(false);
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(true);
  const [state, setState] = useState<"calling" | "ringing" | "live">("calling");
  const [seconds, setSeconds] = useState(CALL_TIMER_START);

  useEffect(() => {
    if (state === "live") {
      const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(tick);
    }
    const next = setTimeout(
      () => setState(state === "calling" ? "ringing" : "live"),
      2000,
    );
    return () => clearTimeout(next);
  }, [state]);

  const STATE: Record<typeof state, { icon: XdIconName; text: string }> = {
    calling: { icon: "callPhoneGrey", text: t("Calling …") },
    ringing: { icon: "callPhoneBlue", text: t("Rining …") },
    live: { icon: "callPhoneGreen", text: clock(seconds) },
  };

  const nameTop = sfTop(427, 20, 24);
  const phoneTop = sfTop(450, 14, 17);
  const stateTop = sfTop(559, 14, 17);

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
        onClick={() => setMic((v) => !v)}
        t={t}
      />
      <button
        type="button"
        data-pw="demo-call-end"
        onClick={back}
        className="flex flex-col items-center shrink-0 cursor-pointer active:opacity-60"
        style={{ marginLeft: 203 - 75, width: 25 }}
      >
        <XdIcon name="endCall" />
        <SfText
          size={14}
          weight={300}
          color={C.red}
          mt={sfTop(873, 14, 17) - 850}
        >
          {t("End Call")}
        </SfText>
      </button>
      <Switch
        on={camera}
        icons={["camOn", "camOff"]}
        label="Camera"
        testId="demo-call-camera"
        ml={355 - 228}
        onClick={() => setCamera((v) => !v)}
        t={t}
      />
    </div>
  );

  return (
    <ScreenPage
      testId="demo-call"
      bg={CHAT.callPage}
      scrollTop={STATUS_BAR}
      footer={footer}
    >
      <div className="flex items-start w-full shrink-0">
        <button
          type="button"
          data-pw="demo-back"
          aria-label={t("Back")}
          onClick={back}
          className="flex shrink-0 cursor-pointer active:opacity-60"
          style={{ marginLeft: 18.5, marginTop: 63.5 - 50 }}
        >
          <XdIcon name="callBackGrey" />
        </button>
        <button
          type="button"
          data-pw="demo-call-add-person"
          aria-label={t("Add person")}
          aria-pressed={second}
          onClick={() => setSecond((v) => !v)}
          className="flex shrink-0 ml-auto cursor-pointer active:opacity-60"
          style={{ marginRight: 430 - 410, marginTop: 63 - 50 }}
        >
          <XdIcon name={second ? "addPersonBlue" : "addPersonGrey"} />
        </button>
      </div>

      {second ? (
        <div
          className="flex items-start justify-center shrink-0"
          style={{ marginTop: 190 - 86.5 }}
        >
          <Person
            photo={CHAT_PHOTOS.caller}
            size={150}
            shadow="0 10px 15px rgba(255,255,255,0.2)"
            nameTop={nameTop - 340}
            phoneTop={phoneTop - (nameTop + 24)}
          />
          <Person
            photo={CHAT_PHOTOS.secondCaller}
            size={150}
            shadow="-3px 3px 10px rgba(0,0,0,0.2)"
            ml={20}
            nameTop={nameTop - 340}
            phoneTop={phoneTop - (nameTop + 24)}
          />
        </div>
      ) : (
        <div
          className="flex items-start justify-center shrink-0"
          style={{ marginTop: 190 - 86.5 }}
        >
          <Person
            photo={CHAT_PHOTOS.caller}
            size={200}
            shadow="0 10px 15px rgba(255,255,255,0.2)"
            nameTop={nameTop - 390}
            phoneTop={phoneTop - (nameTop + 24)}
          />
        </div>
      )}

      <div
        data-pw={`demo-call-state-${state}`}
        className="flex flex-col items-center shrink-0"
        style={{ marginTop: 511 - (phoneTop + 17) }}
      >
        <XdIcon name={STATE[state].icon} />
        <SfText size={14} weight={300} color={C.grey} mt={stateTop - 536}>
          {STATE[state].text}
        </SfText>
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

/** A caller: the photo with its blue line and shadow, the name and the number centred under it. */
function Person({
  photo,
  size,
  shadow,
  ml,
  nameTop,
  phoneTop,
}: {
  photo: string;
  size: number;
  shadow: string;
  ml?: number;
  /** The gap from the photo's bottom to the name's box. */
  nameTop: number;
  /** The gap from the name's box to the number's box. */
  phoneTop: number;
}) {
  return (
    <div
      className="flex flex-col items-center shrink-0"
      style={{ marginLeft: ml, width: size }}
    >
      <div
        className="relative shrink-0"
        style={{ width: size, height: size, borderRadius: 12, boxShadow: shadow }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: 12 }}
        >
          <img
            src={photo}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <Stroke color={CHAT.callBlue} width={1} radius={12} />
      </div>
      <SfText size={20} weight={400} color={CHAT.callName} mt={nameTop} lineHeight={24}>
        {CALLER.name}
      </SfText>
      <SfText size={14} weight={300} color={C.grey} mt={phoneTop}>
        {CALLER.phone}
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
      style={{ marginLeft: ml }}
    >
      <XdIcon name={on ? icons[0] : icons[1]} />
    </button>
  );
}
