"use client";

import React from "react";
import type { DemoKey } from "../demoKeys";
import { useDemoNav } from "../DemoShell";
import { useDemoData, type DemoProfile } from "../DemoData";
import { Field, FieldInput, InfoBanner, ScreenHeader, ScreenPage } from "../ui";

/**
 * Body measurements — XD `Home Page – 93`.
 *
 * The banner, then three 406 x 55 fields at y 160, 221 and 282 (6 px apart
 * here, not 4 as on Personal Info — the file's own spacing). Placeholders
 * "000 CM" and "000 KG"; the file also writes "000 KG" under the foot size, and
 * that is kept as drawn.
 *
 * The file has this one state only: no save button and nothing in the top
 * bar. So nothing is added — what the shopper types is kept as it is typed.
 */
const FIELDS: {
  y: number;
  label: DemoKey;
  placeholder: DemoKey;
  id: keyof Pick<DemoProfile, "height" | "weight" | "foot">;
}[] = [
  { y: 160, label: "How tall are you?", placeholder: "000 CM", id: "height" },
  {
    y: 221,
    label: "What is your weight?",
    placeholder: "000 KG",
    id: "weight",
  },
  {
    y: 282,
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
          icon="titleBody"
          onBack={back}
          t={t}
        />
      }
    >
      <InfoBanner t={t} />
      {FIELDS.map((f) => (
        <Field key={f.id} y={f.y} label={t(f.label)} editing>
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
