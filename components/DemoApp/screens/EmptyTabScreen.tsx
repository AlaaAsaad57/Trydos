"use client";

import type { DemoKey } from "../demoKeys";
import React from "react";
import { useDemoNav } from "../DemoShell";
import { C } from "../demoLayout";
import { Icon, ScreenHeader, Txt } from "../ui";

/**
 * Cart and chat. The XD file has no design for either yet.
 *
 * Until it does, they are drawn only with parts the file already has, so they
 * sit in the same family as the screens around them: the header of the inner
 * screens (title 16 Medium, centred) without a back arrow, and the empty state
 * of `Home Page – 96` (the grey help mark, a 13 Medium line and an 11 line
 * under it, all `#C3C3C3`, centred on the artboard).
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
    <div
      data-pw={`demo-${title.toLowerCase()}`}
      className="absolute inset-0 font-quicksand"
      style={{ background: C.page }}
    >
      <ScreenHeader title={title} shadow t={t} />
      <div
        className="absolute left-0 w-full"
        style={{
          top: "calc(-50px + env(safe-area-inset-top, 0px))",
          height: 932,
        }}
      >
        <Icon name="helpBig" x={205.5} y={432.5} />
        <Txt center baseline={472} size={13} weight="medium" color={C.hint}>
          {t(message)}
        </Txt>
        <Txt center baseline={492} size={11} color={C.hint}>
          {t(hint)}
        </Txt>
      </div>
    </div>
  );
}
