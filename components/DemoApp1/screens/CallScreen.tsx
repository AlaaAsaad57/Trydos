"use client";

import React, { useEffect, useState } from "react";
import { CALLER, CALL_TIMER_START, CHAT_PHOTOS } from "../../DemoApp/demoChat";
import CallFace, { type CallPerson, type CallPhase } from "../chat/CallFace";
import { useDemoNav } from "../screenNav";

const FIRST: CallPerson = { ...CALLER, photo: CHAT_PHOTOS.caller, initials: "" };
const SECOND: CallPerson = { ...CALLER, photo: CHAT_PHOTOS.secondCaller, initials: "" };

/**
 * The call on the `/demo` preview only: timers walk it from "Calling …" to
 * "Ringing …" to the clock, with the XD file's caller. The real app draws the
 * same page with a real call (LiveCallScreen).
 */
export default function CallScreen() {
  const { t, back } = useDemoNav();
  const [second, setSecond] = useState(false);
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(true);
  const [phase, setPhase] = useState<CallPhase>("calling");
  const [seconds, setSeconds] = useState(CALL_TIMER_START);

  useEffect(() => {
    if (phase === "live") {
      const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(tick);
    }
    const next = setTimeout(() => setPhase(phase === "calling" ? "ringing" : "live"), 2000);
    return () => clearTimeout(next);
  }, [phase]);

  return (
    <CallFace
      people={second ? [FIRST, SECOND] : [FIRST]}
      phase={phase}
      seconds={seconds}
      mic={mic}
      camera={camera}
      added={second}
      onBack={back}
      onEnd={back}
      onMic={() => setMic((v) => !v)}
      onCamera={() => setCamera((v) => !v)}
      onAddPerson={() => setSecond((v) => !v)}
      t={t}
    />
  );
}
