"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React from "react";
import { useDemoNav } from "../screenNav";
import { BODY_Y, C, gapTo, textBottom } from "../demo1Layout";
import { Icon, ScreenHeader, ScreenPage, Txt } from "../ui";
import { MainAnswer, type AskAnswer } from "./AskSheet";

/** A line that may wrap: the error's sentence is longer than the screen. */
const WRAP = { whiteSpace: "normal", paddingInline: 30 } as const;

/**
 * The cart. The XD file has no design for it yet (chat has its own now:
 * ChatListScreen).
 *
 * Until it does, they are drawn like the empty address page (`Home Page – 96`)
 * and nothing more: the white page, the header with no shadow line and the
 * title in the crumb's type (14 Medium on baseline 80, like "Address"), with
 * no back arrow, and the empty state (the grey help mark, a 13 Medium line and
 * an 11 Regular line under it, all `#C3C3C3`, centred on the artboard). The
 * address page's banner, card and button are left out: the file has no copy
 * for them on these screens.
 *
 * The bag's read error uses the same screen (Stage 7d): its own words, the
 * server's line under them in red, and "Try Again" as the sheets' dark
 * button. The file has no board for the error, so it is drawn as the empty
 * bag is. With no `note` and no `action` the screen is the empty one.
 */
export default function EmptyTabScreen({
  title,
  message,
  hint,
  note,
  action,
  testId,
}: {
  title: DemoKey;
  message: DemoKey;
  hint: DemoKey;
  /** A line from the server (not a key), in red under the hint. */
  note?: string | null;
  /** A button under the lines (the error's "Try Again"). */
  action?: AskAnswer;
  testId?: string;
}) {
  const { t } = useDemoNav();
  return (
    <ScreenPage
      testId={testId ?? `demo-${title.toLowerCase()}`}
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
        style={action ? WRAP : undefined}
      >
        {t(hint)}
      </Txt>
      {note && (
        <Txt
          as="p"
          center
          size={11}
          color={C.red}
          mt={6}
          data-pw={testId ? `${testId}-note` : undefined}
          style={WRAP}
        >
          {note}
        </Txt>
      )}
      {action && <MainAnswer answer={action} mt={28} />}
    </ScreenPage>
  );
}
