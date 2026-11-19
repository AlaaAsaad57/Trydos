"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React, { useState } from "react";
import { useDemoNav } from "../Demo1Shell";
import EmailCodeSheet from "./EmailCodeSheet";
import { useDemoData, type DemoGender } from "../../DemoApp/DemoData";
import { C, lineBox } from "../demo1Layout";
import {
  Field,
  FieldInput,
  InfoBanner,
  ScreenHeader,
  ScreenPage,
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
const GENDERS: { id: DemoGender; label: DemoKey; slot?: number }[] = [
  { id: "man", label: "Man", slot: 186 - 68 },
  { id: "women", label: "Women", slot: 326 - 186 },
  { id: "other", label: "Other" },
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
            t={t}
            send={demoSend}
            check={demoCheck}
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
          style={{ marginLeft: 68 - 12 - 12 - 12 }}
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
                className={`text-left whitespace-nowrap ${editing ? "cursor-pointer" : ""} ${on ? "font-medium" : "font-normal"}`}
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
 * The demo's steps for the email code sheet: no email is sent, and any six
 * digits verify the address.
 */
const demoSend = async (email: string) => ({
  ok: true as const,
  email,
  expiresAt: null,
  resendAfterSeconds: CODE_SECONDS,
});
const demoCheck = async () => ({ ok: true as const, user: {} });
