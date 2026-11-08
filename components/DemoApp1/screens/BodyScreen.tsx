"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "store";
import auth from "services/auth";
import { LogError } from "utils/functions";
import type { DemoKey } from "../../DemoApp/demoKeys";
import { useDemoNav } from "../screenNav";
import { useProfileData } from "../useProfileData";
import Toast, { useToast } from "../chat/Toast";
import {
  Field,
  FieldInput,
  InfoBanner,
  ScreenHeader,
  ScreenPage,
  WideButton,
} from "../ui";

/**
 * Body measurements — XD `Home Page – 93`.
 *
 * The banner, then three 406 x 55 fields at y 160, 221 and 282: 12 px under
 * the banner, then 6 px apart (not 4 as on Personal Info — the file's own
 * spacing). Placeholders
 * "000 CM" and "000 KG"; the file also writes "000 KG" under the foot size, and
 * that is kept as drawn.
 *
 * The file has this one state only: no save button and nothing in the top
 * bar. D-28 adds the save the way Personal info has it: "Edit" in the top
 * bar opens the fields, "Cancel" puts them back, and "Add & save" sends the
 * measurements with auth.UpdateProfile, as the old size form did.
 * The designer must check it. The old limits stay: height 110–250 cm, weight
 * 40–180 kg; a value out of them says why in a toast.
 *
 * The foot size is `foot_size` on the backend (C-1). The column is nullable, so
 * the field is optional, and it is sent only when it changed: a customer with
 * null who saves a new height keeps null. A value must be an EU size, 20–55.
 *
 * On /demo the banner and the fields keep 12 px to both edges of the screen
 * (fluid, 406 on a 430 px phone); `Field` and `InfoBanner` do it.
 */
type BodyField = "height" | "weight" | "foot";

const FIELDS: {
  mt: number;
  label: DemoKey;
  placeholder: DemoKey;
  id: BodyField;
}[] = [
  { mt: 12, label: "How tall are you?", placeholder: "000 CM", id: "height" },
  {
    mt: 6,
    label: "What is your weight?",
    placeholder: "000 KG",
    id: "weight",
  },
  {
    mt: 6,
    label: "What is your Foot size?",
    placeholder: "000 KG",
    id: "foot",
  },
];

/** The old size form's checks. Null when the value is good. */
export function bodyError(
  height: string,
  weight: string,
  foot = "",
): DemoKey | null {
  const tall = Number(height);
  const kg = Number(weight);
  if (!height) return "Height is required";
  if (!(tall >= 110 && tall <= 250))
    return "Height must be between 110 and 250 cm";
  if (!weight) return "Weight is required";
  if (!(kg >= 40 && kg <= 180)) return "Weight must be between 40 and 180 kg";
  const eu = Number(foot);
  if (foot && !(eu >= 20 && eu <= 55))
    return "Foot size must be between 20 and 55";
  return null;
}

export default function BodyScreen() {
  const { t, back } = useDemoNav();
  const profile = useProfileData();
  const [toast, showToast] = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<BodyField, string>>({
    height: profile.height,
    weight: profile.weight,
    foot: profile.footSize,
  });

  // The profile can arrive after the screen opens. While the shopper is not
  // editing, the fields follow it.
  useEffect(() => {
    if (editing) return;
    setValues((now) => ({
      ...now,
      height: profile.height,
      weight: profile.weight,
      foot: profile.footSize,
    }));
  }, [profile.height, profile.weight, profile.footSize, editing]);

  const footChanged = values.foot !== profile.footSize;
  const dirty =
    values.height !== profile.height ||
    values.weight !== profile.weight ||
    footChanged;

  const save = async () => {
    const error = bodyError(values.height, values.weight, values.foot);
    if (error) {
      showToast(t(error));
      return;
    }
    setSaving(true);
    try {
      await auth.UpdateProfile(
        {
          tall: Number(values.height),
          weight: Number(values.weight),
          ...(footChanged && {
            foot_size: values.foot === "" ? null : Number(values.foot),
          }),
        },
        useAppStore.getState().userProfile,
      );
      setEditing(false);
    } catch (error) {
      // The request layer already showed the refusal; keep the values.
      LogError({ error, scenario: "BodyScreen save" });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setValues({
      height: profile.height,
      weight: profile.weight,
      foot: profile.footSize,
    });
    setEditing(false);
  };

  return (
    <ScreenPage
      testId="demo-body"
      header={
        <ScreenHeader
          crumb={["Profile", "Body measurements"]}
          nudge={2}
          icon="titleBody"
          onBack={back}
          action={editing ? "Cancel" : "Edit"}
          onAction={() => (editing ? reset() : setEditing(true))}
          t={t}
        />
      }
      footer={
        <>
          <WideButton
            testId="demo-body-save"
            label={t("Add & save")}
            visible={editing && dirty && !saving}
            onClick={() => void save()}
          />
          <Toast text={toast} bottom={140} fixed />
        </>
      }
    >
      <InfoBanner t={t} />
      {FIELDS.map((f) => (
        <Field key={f.id} mt={f.mt} label={t(f.label)} editing={editing}>
          <FieldInput
            testId={`demo-body-${f.id}`}
            inputMode="decimal"
            value={values[f.id]}
            onChange={(v) =>
              setValues((now) => ({
                ...now,
                [f.id]: v.replace(/[^\d.]/g, "").slice(0, 5),
              }))
            }
            editing={editing}
            placeholder={t(f.placeholder)}
          />
        </Field>
      ))}
    </ScreenPage>
  );
}
