"use client";

import type { DemoKey } from "../demoKeys";
import React from "react";
import { useDemoNav } from "../DemoShell";
import type { DemoScreen } from "../demoRoutes";
import { MenuRow, ScreenHeader, ScreenPage } from "../ui";
import type { XdIconName } from "../xdIcons";

/**
 * Profile — XD `Home Page – 16`.
 *
 * Four 406 x 60 rows from y 120, 64 apart, radius 15, `#FCFCFC`; a 30 px icon
 * at x 24 and the label, 14 Regular, at x 66.
 */
const ROWS: { icon: XdIconName; label: DemoKey; to: DemoScreen }[] = [
  {
    icon: "rowClient",
    label: "client Info",
    to: "settings/profile/client-info",
  },
  {
    icon: "rowPersonal",
    label: "Personal Info",
    to: "settings/profile/personal-info",
  },
  { icon: "rowBody", label: "Body measurements", to: "settings/profile/body" },
  { icon: "rowAddress", label: "Address", to: "settings/profile/address" },
];

export default function ProfileMenuScreen() {
  const { t, back, navigate } = useDemoNav();
  return (
    <ScreenPage
      testId="demo-profile-menu"
      header={<ScreenHeader title="Profile" onBack={back} t={t} />}
    >
      {ROWS.map((row, i) => (
        <MenuRow
          key={row.to}
          y={120 + i * 64}
          icon={row.icon}
          iconSize={30}
          label={t(row.label)}
          textX={66}
          testId={`demo-profile-row-${i}`}
          onClick={() => navigate(row.to)}
        />
      ))}
    </ScreenPage>
  );
}
