"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import RdbPinInputs from "components/Login/Enhanced/ui/RdbPinInputs";
import XdIcon from "../../DemoApp/XdIcon";
import { DEMO_KEYBOARD } from "../../DemoApp/demoKeyboard";
import { useAppStore } from "store";
import auth from "services/auth";
import { LogError } from "utils/functions";
import { useDemoNav } from "../screenNav";
import Toast, { useToast } from "../chat/Toast";
import {
  GENDER_TO_BACKEND,
  useProfileData,
  type ProfileGender,
} from "../useProfileData";
import { C, DESIGN_W, gapTo, lineBox, textBottom } from "../demo1Layout";
import {
  Field,
  FieldInput,
  fromCentre,
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
 * Fields: 406 x 55 at y 160 (name), 219 (email) and 278 (gender) — 12 under
 * the banner, then 4 apart; label 12
 * `#505050` on baseline +20, value 14 on +43. Gender is three words at x 68,
 * 186 and 326 — the picked one Medium `#1D1D1D`, the others Regular `#C3C3C3`.
 *
 * Real data (Stage 4): the fields start from the shopper's profile, and "Add
 * & save" sends the changed name and gender with auth.UpdateProfile, as the
 * old form did (stories, chat and market, then the User-Data cookie). A
 * changed e-mail opens the code sheet; the backend has no e-mail code yet, so
 * its end says "Soon available" and the e-mail is not saved (S4-8, A-8).
 *
 * On /demo the banner and the fields keep 12 px to both edges of the screen
 * (fluid, 406 on a 430 px phone). The gender words keep their x from the
 * left: they are words, not a block that stretches.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/**
 * The words start at x 68, 186 and 326. Each button is a slot as wide as the
 * step to the next word, with 12 px of padding round its word, so every word
 * lands on the file's x whatever width the browser gives it.
 */
const GENDERS: { id: ProfileGender; label: DemoKey; slot?: number }[] = [
  { id: "man", label: "Man", slot: 186 - 68 },
  { id: "women", label: "Women", slot: 326 - 186 },
  { id: "other", label: "Other" },
];

export default function PersonalInfoScreen() {
  const { t, back } = useDemoNav();
  const profile = useProfileData();
  const [toast, showToast] = useToast();
  // The screen opens to read (`Home Page – 92`); "Edit" makes the form editable.
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  // The e-mail on record counts as checked: only a new one needs a code.
  const verified = profile.email;
  const [gender, setGender] = useState<ProfileGender | null>(profile.gender);
  const [codeFor, setCodeFor] = useState<string | null>(null);

  // The profile can arrive after the screen opens (the store fills from the
  // cookie and /customer/info). While the shopper is not editing, the fields
  // follow it.
  useEffect(() => {
    if (editing) return;
    setName(profile.name);
    setEmail(profile.email);
    setGender(profile.gender);
  }, [profile.name, profile.email, profile.gender, editing]);

  const emailChanged = email !== profile.email;
  const dirty =
    name !== profile.name || emailChanged || gender !== profile.gender;
  const canSave =
    editing &&
    dirty &&
    !saving &&
    name.trim() !== "" &&
    (!emailChanged || email === "" || EMAIL.test(email));

  /** Sends the changed name and gender. The e-mail is not sent (S4-8). */
  const save = async () => {
    const changed: Record<string, unknown> = {};
    if (name.trim() !== profile.name) changed.name = name.trim();
    if (gender && gender !== profile.gender)
      changed.gender = GENDER_TO_BACKEND[gender];
    if (!Object.keys(changed).length) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await auth.UpdateProfile(changed, useAppStore.getState().userProfile);
      setEditing(false);
    } catch (error) {
      // The request layer already showed the refusal. Keep what the shopper
      // typed, so they can correct it (as the old form did).
      LogError({ error, scenario: "PersonalInfoScreen save" });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setName(profile.name);
    setEmail(profile.email);
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
            // "Add & save" sends the name and gender. A new e-mail then
            // opens the code sheet (`Home Page – 90`).
            onClick={() => {
              void save();
              if (EMAIL.test(email) && verified !== email) setCodeFor(email);
            }}
          />
          <EmailCodeSheet
            email={codeFor}
            onClose={() => {
              setCodeFor(null);
              setEmail(profile.email);
            }}
            onDone={() => {
              // No e-mail codes on the backend yet (S4-8, A-8).
              setCodeFor(null);
              setEmail(profile.email);
              showToast(t("Soon available"));
            }}
          />
          <Toast text={toast} bottom={140} fixed />
        </>
      }
    >
      <InfoBanner t={t} />

      <Field mt={12} label={t("full Name")} editing={editing}>
        <FieldInput
          testId="demo-personal-name"
          value={name}
          onChange={setName}
          editing={editing}
          placeholder={t("Enter Full Name")}
        />
      </Field>

      <Field mt={4} label={t("Email")} editing={editing}>
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

      <Field mt={4} label={t("Gender")} editing={editing}>
        {/* The first word at x 68: the row starts 12 before it, under the label. */}
        <div
          className="flex shrink-0 min-w-0"
          style={{ marginInlineStart: 68 - 12 - 12 - 12 }}
        >
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
                // The slot is the file's width, but it may shrink down to its
                // word: on a phone narrower than 430 px the field is narrower,
                // and the three words must still fit in it. On a 430 px phone
                // nothing shrinks, so every word is on the file's x.
                className={`text-start whitespace-nowrap ${editing ? "cursor-pointer" : ""} ${on ? "font-medium" : "font-normal"}`}
                style={{
                  width: g.slot,
                  padding: "6px 12px",
                  fontSize: 14,
                  lineHeight: `${lineBox(14)}px`,
                  color: on ? C.ink : C.hint,
                  transition: "color 0.2s",
                }}
              >
                {t(g.label)}
              </button>
            );
          })}
        </div>
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
 * address with "resend after - 01:58" (a 15 px row from y 366), the purple
 * privacy line with its shield (a 14 px row from 389) and the six code boxes
 * at y 502 — the login's own boxes (RdbPinInputs), so the two flows cannot
 * drift apart. All 40 px in, the boxes 20.
 *
 * No e-mail is sent: the backend has no e-mail code yet. The six digits end
 * in "Soon available" (S4-8, A-8); no code passes.
 */
function EmailCodeSheet({
  email,
  onClose,
  onDone,
}: {
  email: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useDemoNav();
  const [pin, setPin] = useState("");
  const [valid, setValid] = useState<"" | "valid">("");
  const [left, setLeft] = useState(CODE_SECONDS);
  /**
   * True once the sheet has finished rising. The code boxes open the keypad
   * 300 ms after they mount. In the old scaled demo a keypad opened while the sheet was
   * still low pushed the sheet's top off the screen. /demo has no canvas
   * to lift, but it keeps the same rule: the boxes are mounted again,
   * focused, only when the sheet is in place, so the keypad opens on a sheet
   * that has stopped moving.
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
          {email}
        </bdi>
        <button
          type="button"
          disabled={left > 0}
          onClick={() => setLeft(CODE_SECONDS)}
          className="font-normal"
          style={{ marginInlineStart: 5, color: C.hint }}
        >
          {t("resend after")} -{" "}
          <span className="font-medium" style={{ color: C.blue }}>
            {clock}
          </span>
        </button>
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
        style={{
          // The same value from either side: the block is centred.
          marginInlineStart: fromCentre(20, DESIGN_W),
          marginTop: 502 - (389 + 14),
        }}
      >
        <RdbPinInputs
          key={ready ? "focused" : "resting"}
          autoFocus={ready}
          // The demo's keyboard types the code, not the login's keypad.
          disableCustomKeypad={DEMO_KEYBOARD}
          value={pin}
          onChange={setPin}
          isValidPin={valid}
          disabled={valid === "valid"}
          onComplete={() => {
            setValid("valid");
            setTimeout(onDone, 600);
          }}
        />
      </motion.div>
    </Sheet>
  );
}
