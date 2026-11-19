"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React, { useEffect, useState } from "react";
import { useAppStore } from "store";
import auth from "services/auth";
import {
  EmailVerificationRequiredError,
  normalizeEmail,
} from "services/customerEmail";
import { LogError } from "utils/functions";
import { useDemoNav } from "../screenNav";
import EmailCodeSheet from "./EmailCodeSheet";
import {
  GENDER_TO_BACKEND,
  useProfileData,
  type ProfileGender,
} from "../useProfileData";
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
 * Real data (Stage 4): the fields start from the shopper's profile, and "Add
 * & save" sends the changed name, gender and e-mail with auth.UpdateProfile,
 * as the old form did (stories, chat and market, then the User-Data cookie).
 *
 * The e-mail code (customer-email-otp-frontend-guide.md, backend PR #699):
 * the core backend refuses a new e-mail that was not verified with a code,
 * and saves nothing of that request. That answer opens the code sheet
 * (EmailCodeSheet, `Home Page – 90`), which asks for the code. A right code
 * saves the e-mail (verify-otp), and the refused save goes again without it.
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
  // The screen opens to read (`Home Page – 92`); "Edit" makes the form editable.
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  // The e-mail on record, when the backend says it is verified. A profile
  // stored before the backend sent `is_email_verified` (PR #698) has no
  // answer: its e-mail counts as checked, as it did before.
  const verified = profile.emailVerified === false ? "" : profile.email;
  const [gender, setGender] = useState<ProfileGender | null>(profile.gender);
  const [codeFor, setCodeFor] = useState<string | null>(null);
  /** The save the backend refused for the e-mail code; sent again after a right code. */
  const [waitingSave, setWaitingSave] = useState<Record<string, unknown> | null>(
    null,
  );

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

  /** The fields the shopper changed, in the backend's form. */
  const changedFields = () => {
    const changed: Record<string, unknown> = {};
    if (name.trim() !== profile.name) changed.name = name.trim();
    if (gender && gender !== profile.gender)
      changed.gender = GENDER_TO_BACKEND[gender];
    // An emptied e-mail is not sent: the screen has no way to remove one.
    if (emailChanged && EMAIL.test(email)) changed.email = normalizeEmail(email);
    return changed;
  };

  /** Sends `changed`. A refusal for the e-mail code opens the code sheet. */
  const save = async (changed: Record<string, unknown>) => {
    if (!Object.keys(changed).length) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await auth.UpdateProfile(changed, useAppStore.getState().userProfile);
      setEditing(false);
    } catch (error) {
      if (error instanceof EmailVerificationRequiredError) {
        // The next step of the change, not an error: prove the e-mail with a
        // code, then send the rest again.
        setWaitingSave(changed);
        setCodeFor(String(changed.email));
        return;
      }
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
            // "Add & save" sends what changed. When the backend wants a
            // code for the new e-mail, the code sheet opens (`Home Page – 90`).
            onClick={() => void save(changedFields())}
          />
          <EmailCodeSheet
            email={codeFor}
            t={t}
            send={(address) => auth.SendEmailOtp(address)}
            check={(address, code) => auth.VerifyEmailOtp(address, code)}
            // Closed without a right code: nothing was saved, and the form
            // keeps what the shopper typed.
            onClose={() => {
              setCodeFor(null);
              setWaitingSave(null);
            }}
            onVerified={() => {
              // verify-otp saved the e-mail; send the rest of the change.
              const rest = { ...(waitingSave ?? {}) };
              delete rest.email;
              setCodeFor(null);
              setWaitingSave(null);
              void save(rest);
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
