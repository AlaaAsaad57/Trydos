"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React from "react";
import { useDemoNav } from "../Demo1Shell";
import { BODY_Y, C, gapTo, textBottom } from "../demo1Layout";
import { Icon, ScreenHeader, ScreenPage, Txt } from "../ui";

/**
 * Cart and chat. The XD file has no design for either yet.
 *
 * Until it does, they are drawn like the empty address page (`Home Page – 96`)
 * and nothing more: the white page, the header with no shadow line and the
 * title in the crumb's type (14 Medium on baseline 80, like "Address"), with
 * no back arrow, and the empty state (the grey help mark, a 13 Medium line and
 * an 11 Regular line under it, all `#C3C3C3`, centred on the artboard). The
 * address page's banner, card and button are left out: the file has no copy
 * for them on these screens.
 */
export default function EmptyTabScreen({
  title,
  message,
  hint,
}: {
  title: DemoKey;
  message: DemoKey;
  hint: DemoKey;
}) {
  const { t } = useDemoNav();
  return (
    <ScreenPage
      testId={`demo-${title.toLowerCase()}`}
      header={<ScreenHeader title={title} small t={t} />}
      tabBar
    >
      {/* The 19 px mark at y 432.5, centred; the lines on baselines 472 and
          492. XD shows the gaps as 7 and 5 from its own text boxes; placed by
          baseline they are 7.5 and 6 here, the same pixels. */}
      <Icon
        name="helpBig"
        mt={432.5 - BODY_Y}
        style={{ alignSelf: "center" }}
      />
      <Txt
        center
        size={13}
        weight="medium"
        color={C.hint}
        mt={gapTo(451.5, 472, 13)}
      >
        {t(message)}
      </Txt>
      <Txt
        center
        size={11}
        color={C.hint}
        mt={gapTo(textBottom(472, 13), 492, 11)}
      >
        {t(hint)}
      </Txt>
    </ScreenPage>
  );
}
