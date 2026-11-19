"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import RdbPinInputs from "components/Login/Enhanced/ui/RdbPinInputs";
import XdIcon from "../../DemoApp/XdIcon";
import { DEMO_KEYBOARD } from "../../DemoApp/demoKeyboard";
import { C, DESIGN_W, gapTo, lineBox, textBottom } from "../demo1Layout";
import { fromCentre, Sheet, Txt } from "../ui";
import {
  ENDS_THE_CODE,
  ENDS_THE_SHEET,
  normalizeEmail,
  PROBLEM_KEY,
  type EmailCodeProblem,
  type SendEmailCodeResult,
  type VerifyEmailCodeResult,
} from "services/customerEmail";

/**
 * The email code sheet — XD `Home Page – 90`.
 *
 * The page dims (`#1D1D1D` at 90%) and a sheet rises from y 90: "verification
 * Email !" (30 Bold, baseline 318), the line under it (16 Medium, 354), the
 * address with "resend after - 01:58" (a 15 px row from y 366), the purple
 * privacy line with its shield (a 14 px row from 389) and the six code boxes
 * at y 502 — the login's own boxes (RdbPinInputs), so the two flows cannot
 * drift apart. All 40 px in, the boxes 20.
 *
 * One sheet for the demo and for the real profile screens. The caller gives
 * the two steps:
 *
 *   send(email)        — asks for a code; called when the sheet opens and on
 *                        "resend". The answer sets the resend timer.
 *   check(email, code) — checks the six digits.
 *
 * The demo passes steps that always succeed and send nothing. The real
 * screens pass `auth.SendEmailOtp` and `auth.VerifyEmailOtp` (core backend,
 * customer-email-otp-frontend-guide.md).
 *
 * What a refused step shows sits under the boxes, in the login's own error
 * line (RdbPinInputs `label`), in the words of PROBLEM_KEY — never the
 * backend's English `message`.
 */
export default function EmailCodeSheet({
  email,
  t,
  send,
  check,
  onClose,
  onVerified,
  testId = "demo-email-code",
  z,
}: {
  /** The address to verify. The sheet is open while it is not null. */
  email: string | null;
  t: (key: DemoKey) => string;
  send: (email: string) => Promise<SendEmailCodeResult>;
  check: (email: string, code: string) => Promise<VerifyEmailCodeResult>;
  onClose: () => void;
  /** A right code. `email` is the address as the backend saved it. */
  onVerified: (email: string) => void;
  testId?: string;
  /**
   * The layer's `z` (see `Layer`). A screen outside /demo raises it over its
   * own bars. It stays under the sign-in overlay (AuthOverlay), so a session
   * that ends while the sheet is open is asked to sign in first.
   */
  z?: number;
}) {
  const [pin, setPin] = useState("");
  const [valid, setValid] = useState<"" | "valid" | "notvalid">("");
  /** Seconds until "resend" may be pressed. */
  const [left, setLeft] = useState(0);
  /** A request is out: the boxes wait. */
  const [busy, setBusy] = useState(false);
  /** The words under the boxes, or "". */
  const [problem, setProblem] = useState("");
  /** The code is dead (expired, no tries left, replaced): only "resend" helps. */
  const [dead, setDead] = useState(false);
  /** Nothing in this sheet can help (the email is taken, a guest account). */
  const [final, setFinal] = useState(false);
  /** The address the backend sent the code to (trimmed, lowercase). */
  const [sentTo, setSentTo] = useState<string | null>(null);
  /**
   * True once the sheet has finished rising. The code boxes open the keypad
   * 300 ms after they mount. In the old scaled demo a keypad opened while the sheet was
   * still low pushed the sheet's top off the screen. /demo has no canvas
   * to lift, but it keeps the same rule: the boxes are mounted again,
   * focused, only when the sheet is in place, so the keypad opens on a sheet
   * that has stopped moving.
   */
  const [ready, setReady] = useState(false);
  /**
   * Which opening of the sheet an answer belongs to. An answer that comes
   * back after the sheet closed, or after it opened again for another
   * address, is dropped.
   */
  const round = useRef(0);

  const wordsFor = (p: EmailCodeProblem, attemptsLeft?: number) =>
    p === "wrong-code" && attemptsLeft !== undefined
      ? `${t(PROBLEM_KEY[p])}. ${t("Tries left")}: ${attemptsLeft}`
      : t(PROBLEM_KEY[p]);

  const ask = async (address: string) => {
    const mine = round.current;
    setBusy(true);
    const answer = await send(address);
    if (mine !== round.current) return;
    setBusy(false);
    // `in`, not `answer.ok`: the project compiles without strictNullChecks,
    // and there a boolean field does not narrow the union.
    if (!("problem" in answer)) {
      setSentTo(answer.email);
      setLeft(answer.resendAfterSeconds);
      setProblem("");
      setDead(false);
      setPin("");
      setValid("");
      return;
    }
    if (answer.problem === "too-soon") {
      // A code went out less than the resend wait ago (the sheet was closed
      // and opened again). That code still works, so the boxes stay open;
      // only the timer says when a new one may be asked.
      setSentTo((was) => was ?? normalizeEmail(address));
      setLeft(answer.retryAfterSeconds ?? 0);
      return;
    }
    setProblem(wordsFor(answer.problem));
    setLeft(answer.retryAfterSeconds ?? 0);
    // No code went out: the boxes close until "resend" works.
    if (ENDS_THE_SHEET.has(answer.problem)) setFinal(true);
    else setDead(true);
  };

  useEffect(() => {
    round.current += 1;
    if (!email) return;
    setPin("");
    setValid("");
    setProblem("");
    setDead(false);
    setFinal(false);
    setSentTo(null);
    setReady(false);
    setLeft(0);
    void ask(email);
    const timer = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
    // `ask` reads only state setters and the props of this opening.
  }, [email]);

  const submit = async (code: string) => {
    if (!email) return;
    const mine = round.current;
    const address = sentTo ?? email;
    setBusy(true);
    const answer = await check(address, code);
    if (mine !== round.current) return;
    setBusy(false);
    if (!("problem" in answer)) {
      setProblem("");
      setValid("valid");
      setTimeout(() => {
        if (mine === round.current) onVerified(address);
      }, 600);
      return;
    }
    setProblem(wordsFor(answer.problem, answer.attemptsLeft));
    if (answer.problem === "wrong-code") {
      // The boxes shake red, then empty for the next try.
      setValid("notvalid");
      setTimeout(() => {
        if (mine !== round.current) return;
        setPin("");
      }, 700);
      return;
    }
    setValid("");
    setPin("");
    if (ENDS_THE_CODE.has(answer.problem)) setDead(true);
    if (ENDS_THE_SHEET.has(answer.problem)) setFinal(true);
  };

  const canResend = left === 0 && !busy && !final && valid !== "valid";
  const clock = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  const closed = dead || final;

  return (
    <Sheet
      open={email !== null}
      onClose={onClose}
      y={90}
      testId={testId}
      z={z}
      onEntered={() => setReady(true)}
    >
      <Txt ml={40} mt={gapTo(90 + 13, 318, 30)} size={30} weight="bold">
        {t("verification Email !")}
      </Txt>
      <Txt
        ml={40}
        mt={gapTo(textBottom(318, 30), 354, 16)}
        size={16}
        weight="medium"
      >
        {t("enter verification code sent to your Email")}
      </Txt>
      <div
        className="flex items-center shrink-0"
        style={{
          marginInlineStart: 40,
          marginTop: 366 - textBottom(354, 16),
          height: 15,
          fontSize: 12,
        }}
      >
        <bdi dir="ltr" className="font-medium" style={{ color: C.ink }}>
          {sentTo ?? email}
        </bdi>
        {!final && (
        <button
          type="button"
          data-pw={`${testId}-resend`}
          disabled={!canResend}
          onClick={() => email && void ask(email)}
          className="font-normal"
          style={{ marginInlineStart: 5, color: C.hint }}
        >
          {left > 0 ? (
            <>
              {t("resend after")} -{" "}
              <span className="font-medium" style={{ color: C.blue }}>
                {clock}
              </span>
            </>
          ) : (
            <span className="font-medium" style={{ color: C.blue }}>
              {t("Resend Code")}
            </span>
          )}
        </button>
        )}
        <XdIcon name="otpHelp" style={{ marginInlineStart: 3.5 }} />
      </div>
      <div
        className="flex items-center shrink-0"
        style={{ marginInlineStart: 40, marginTop: 389 - (366 + 15), height: 14 }}
      >
        <span
          className="font-normal"
          style={{
            fontSize: 11,
            lineHeight: `${lineBox(11)}px`,
            color: C.purple,
          }}
        >
          {t("Your privacy is completely safe")}
        </span>
        <XdIcon name="shield" style={{ marginInlineStart: 6 }} />
      </div>
      {/* The login's boxes are a fixed 390 px block (six 60 px boxes). The
          file centres it, 20 px from each edge, so it stays centred on the
          sheet: the file's x 20 on a 430 px phone. */}
      <motion.div
        className="shrink-0"
        data-pw={`${testId}-boxes`}
        style={{
          // The same value from either side: the block is centred.
          marginInlineStart: fromCentre(20, DESIGN_W),
          marginTop: 502 - (389 + 14),
        }}
      >
        <RdbPinInputs
          // Mounted again, focused, once the sheet is in place and the code
          // is on its way (see `ready`).
          key={ready && sentTo !== null ? "focused" : "resting"}
          autoFocus={ready && sentTo !== null}
          // The demo's keyboard types the code, not the login's keypad.
          disableCustomKeypad={DEMO_KEYBOARD}
          value={pin}
          onChange={(next) => {
            setPin(next);
            if (valid === "notvalid") setValid("");
          }}
          isValidPin={valid}
          disabled={busy || closed || valid === "valid"}
          isExpired={closed}
          label={problem || undefined}
          labelTone="error"
          onComplete={(code) => void submit(code)}
        />
      </motion.div>
    </Sheet>
  );
}
