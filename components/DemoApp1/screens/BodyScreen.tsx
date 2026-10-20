"use client";

import React from "react";
import type { DemoKey } from "../../DemoApp/demoKeys";
import { useDemoNav } from "../Demo1Shell";
import { useDemoData, type DemoProfile } from "../../DemoApp/DemoData";
import { Field, FieldInput, InfoBanner, ScreenHeader, ScreenPage } from "../ui";

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
 * bar. So nothing is added — what the shopper types is kept as it is typed.
 *
 * On /demo the banner and the fields keep 12 px to both edges of the screen
 * (fluid, 406 on a 430 px phone); `Field` and `InfoBanner` do it.
 */
const FIELDS: {
  mt: number;
  label: DemoKey;
  placeholder: DemoKey;
  id: keyof Pick<DemoProfile, "height" | "weight" | "foot">;
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

export default function BodyScreen() {
  const { t, back } = useDemoNav();
  const { profile, update } = useDemoData();

  return (
    <ScreenPage
      testId="demo-body"
      header={
        <ScreenHeader
          crumb={["Profile", "Body measurements"]}
          nudge={2}
          icon="titleBody"
          onBack={back}
          t={t}
        />
      }
    >
      <InfoBanner t={t} />
      {FIELDS.map((f) => (
        <Field key={f.id} mt={f.mt} label={t(f.label)} editing>
          <FieldInput
            testId={`demo-body-${f.id}`}
            inputMode="decimal"
            value={profile[f.id]}
            onChange={(v) =>
              update({ [f.id]: v.replace(/[^\d.]/g, "").slice(0, 5) })
            }
            editing
            placeholder={t(f.placeholder)}
          />
        </Field>
      ))}
    </ScreenPage>
  );
}
