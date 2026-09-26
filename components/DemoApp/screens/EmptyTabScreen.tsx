"use client";

import type { DemoKey } from "../demoKeys";
import React from "react";
import { useDemoNav } from "../DemoShell";
import { C } from "../demoLayout";
import { Icon, ScreenHeader, Txt } from "../ui";

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
    <div
      data-pw={`demo-${title.toLowerCase()}`}
      className="absolute inset-0 font-quicksand"
      style={{ background: C.white }}
    >
      <ScreenHeader title={title} small t={t} />
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
