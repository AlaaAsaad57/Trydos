"use client";

import type { DemoKey } from "../demoKeys";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import RdbPinInputs from "components/Login/Enhanced/ui/RdbPinInputs";
import XdIcon from "../XdIcon";
import { useDemoNav } from "../DemoShell";
import { useDemoData, type DemoGender } from "../DemoData";
import { C } from "../demoLayout";
import {
  Field,
  FieldInput,
  InfoBanner,
  ScreenHeader,
  ScreenPage,
  Sheet,
  Txt,
  WideButton,
} from "../ui";

/**
 * Personal Info — XD `Home Page – 88` to `– 92`.
 *
 *   92  reading — where the screen opens: `#FCFCFC` fields with no line, and
 *       "Edit" top right;
 *   88  after "Edit": white fields with a 0.5 `#D3D3D3` line;
 *   89  typing: "Cancel" top right; an email that is not verified yet stays
 *       grey (`#D3D3D3`);
 *   90  the email code sheet (below), opened by "Add & save" when the email
 *       is new;
 *   91  "Add & save"; a right code saves the form and goes back to reading.
 *
 * Fields: 406 x 55 at y 160 (name), 219 (email) and 278 (gender); label 12
 * `#505050` on baseline +20, value 14 on +43. Gender is three words at x 68,
 * 186 and 326 — the picked one Medium `#1D1D1D`, the others Regular `#C3C3C3`.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENDERS: { id: DemoGender; label: DemoKey; x: number }[] = [
  { id: "man", label: "Man", x: 68 },
  { id: "women", label: "Women", x: 186 },
  { id: "other", label: "Other", x: 326 },
];

export default function PersonalInfoScreen() {
  const { t, back } = useDemoNav();
  const { profile, update } = useDemoData();
  // The screen opens to read (`Home Page – 92`); "Edit" makes the form editable.
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [verified, setVerified] = useState(
    profile.emailVerified ? profile.email : "",
  );
  const [gender, setGender] = useState<DemoGender>(profile.gender);
  const [codeFor, setCodeFor] = useState<string | null>(null);

  const dirty =
    name !== profile.name ||
    email !== profile.email ||
    gender !== profile.gender;
  const canSave = editing && dirty && name.trim() !== "";

  const save = (checkedEmail: string) => {
    update({
      name: name.trim(),
      email,
      emailVerified: email !== "" && checkedEmail === email,
      gender,
    });
    setEditing(false);
  };

  const reset = () => {
    setName(profile.name);
    setEmail(profile.email);
    setVerified(profile.emailVerified ? profile.email : "");
    setGender(profile.gender);
    setEditing(false);
  };

  const action = editing ? "Cancel" : "Edit";

  return (
    <ScreenPage
      testId="demo-personal-info"
      header={
        <ScreenHeader
          crumb={["Profile", "Personal Info"]}
          icon="titlePersonal"
          onBack={back}
          action={action}
          onAction={() => (editing ? reset() : setEditing(true))}
          t={t}
        />
      }
      footer={
        <>
          <WideButton
            testId="demo-personal-save"
            label={t("Add & save")}
            visible={canSave}
            // A new email is checked first: "Add & save" opens the code
            // sheet (`Home Page – 90`), and a right code saves the form.
            onClick={() => {
              if (EMAIL.test(email) && verified !== email) setCodeFor(email);
              else save(verified);
            }}
          />
          <EmailCodeSheet
            email={codeFor}
            onClose={() => setCodeFor(null)}
            onVerified={(address) => {
              setVerified(address);
              setCodeFor(null);
              save(address);
            }}
          />
        </>
      }
    >
      <InfoBanner t={t} />

      <Field y={160} label={t("full Name")} editing={editing}>
        <FieldInput
          testId="demo-personal-name"
          value={name}
          onChange={setName}
          editing={editing}
          placeholder={t("Enter Full Name")}
        />
      </Field>

      <Field y={219} label={t("Email")} editing={editing}>
        <FieldInput
          testId="demo-personal-email"
          type="email"
          inputMode="email"
          value={email}
          onChange={setEmail}
          editing={editing}
          placeholder={t("enter Email Address")}
          // Grey until the address is verified — `Home Page – 89`.
          color={verified === email ? C.ink : C.placeholder}
        />
      </Field>

      <Field y={278} label={t("Gender")} editing={editing}>
        {GENDERS.map((g) => {
          const on = g.id === gender;
          return (
            <button
              key={g.id}
              type="button"
              disabled={!editing}
              aria-pressed={on}
              data-pw={`demo-gender-${g.id}`}
              onClick={() => setGender(g.id)}
              className={`absolute ${editing ? "cursor-pointer" : ""} ${on ? "font-medium" : "font-normal"}`}
              style={{
                left: g.x - 12 - 12,
                top: 43 - 14 - 6,
                padding: "6px 12px",
                fontSize: 14,
                color: on ? C.ink : C.hint,
                transition: "color 0.2s",
              }}
            >
              {t(g.label)}
            </button>
          );
        })}
      </Field>
    </ScreenPage>
  );
}

/** Two minutes, the life of a code in the login flow. */
const CODE_SECONDS = 120;

/**
 * The email code sheet — XD `Home Page – 90`.
 *
 * The page dims (`#1D1D1D` at 90%) and a sheet rises from y 90: "verification
 * Email !" (30 Bold, baseline 318), the line under it (16 Medium, 354), the
 * address with "resend after - 01:58" (12, 378), the purple privacy line with
 * its shield (11, 400) and the six code boxes at y 502 — the login's own boxes
 * (RdbPinInputs), so the two flows cannot drift apart.
 *
 * No email is sent. Any six digits verify the address.
 */
function EmailCodeSheet({
  email,
  onClose,
  onVerified,
}: {
  email: string | null;
  onClose: () => void;
  onVerified: (email: string) => void;
}) {
  const { t } = useDemoNav();
  const [pin, setPin] = useState("");
  const [valid, setValid] = useState<"" | "valid">("");
  const [left, setLeft] = useState(CODE_SECONDS);
  /**
   * True once the sheet has finished rising. The code boxes open the keypad
   * (and AppScaler lifts the canvas to keep them above it) 300 ms after they
   * mount. Mounted with the sheet, that measured the boxes while the sheet was
   * still low, the lift came out far too big, and the sheet's top was pushed
   * off the screen. So the boxes are mounted again, focused, only when the
   * sheet is in place.
   */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!email) return;
    setPin("");
    setValid("");
    setReady(false);
    setLeft(CODE_SECONDS);
    const timer = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [email]);

  const clock = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;

  return (
    <Sheet
      open={email !== null}
      onClose={onClose}
      y={90}
      testId="demo-email-code"
      onEntered={() => setReady(true)}
    >
      <Txt x={40} baseline={318} size={30} weight="bold">
        {t("verification Email !")}
      </Txt>
      <Txt x={40} baseline={354} size={16} weight="medium">
        {t("enter verification code sent to your Email")}
      </Txt>
      <div
        className="absolute flex items-center"
        style={{ left: 40, top: 378 - 12, height: 15, fontSize: 12 }}
      >
        <span className="font-medium" style={{ color: C.ink }}>
          {email}
        </span>
        <button
          type="button"
          disabled={left > 0}
          onClick={() => setLeft(CODE_SECONDS)}
          className="font-normal"
          style={{ marginLeft: 5, color: C.hint }}
        >
          {t("resend after")} -{" "}
          <span className="font-medium" style={{ color: C.blue }}>
            {clock}
          </span>
        </button>
        <XdIcon name="otpHelp" style={{ marginLeft: 3.5 }} />
      </div>
      <div
        className="absolute flex items-center"
        style={{ left: 40, top: 400 - 11, height: 14 }}
      >
        <span className="font-normal" style={{ fontSize: 11, color: C.purple }}>
          {t("Your privacy is completely safe")}
        </span>
        <XdIcon name="shield" style={{ marginLeft: 6 }} />
      </div>
      <motion.div className="absolute" style={{ left: 20, top: 502 }}>
        <RdbPinInputs
          key={ready ? "focused" : "resting"}
          autoFocus={ready}
          value={pin}
          onChange={setPin}
          isValidPin={valid}
          disabled={valid === "valid"}
          onComplete={() => {
            setValid("valid");
            setTimeout(() => email && onVerified(email), 600);
          }}
        />
      </motion.div>
    </Sheet>
  );
}
