import React from "react";
import { render } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// An Arabic page: the blocks below must mirror on it (D-3 in UI-MIGRATION-PLAN.md).
vi.mock("next/navigation", () => ({ useParams: () => ({ lang: "sy-ar" }) }));

// jsdom has no ResizeObserver; FileLines measures its box with one.
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

import {
  Box,
  FileLines,
  Icon,
  InfoBanner,
  MenuRow,
  ScreenHeader,
  Txt,
  WhyCard,
} from "components/DemoApp1/ui";

const t = (key: string) => key;

// jsdom lays nothing out, so every box is 0 px wide, and FileLines then wraps
// its text as a plain paragraph. A 1000 px box lets it draw the file's lines.
let widthSpy: ReturnType<typeof vi.spyOn> | undefined;
beforeAll(() => {
  widthSpy = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
});
afterAll(() => widthSpy?.mockRestore());

/**
 * Every place in the tree that is set by the physical left or right: an inline
 * margin or padding on one side, or a Tailwind class for one. Such a place stays
 * where it is on a right-to-left page, so the block is not mirrored there.
 */
const physicalSides = (root: HTMLElement) =>
  [root, ...root.querySelectorAll<HTMLElement>("*")].flatMap((el) => {
    const style = el.getAttribute("style") ?? "";
    const classes = String(el.getAttribute("class") ?? "");
    return [
      ...(style.match(/(margin|padding)-(left|right)\s*:[^;]*/g) ?? []),
      ...(classes.match(/(^|\s)(-?m[lr]|p[lr])-\S+|(^|\s)text-(left|right)\b/g) ?? []),
    ].map((found) => `${el.tagName.toLowerCase()} ${found.trim()}`);
  });

describe("the new UI's shared blocks — placed from the start side, so they mirror on a right-to-left page", () => {
  it.each<[string, React.ReactElement]>([
    ["Txt", <Txt key="t" size={14} ml={12} center nudge={2}>a</Txt>],
    ["Box", <Box key="b" w={10} h={10} ml={12} />],
    ["Icon", <Icon key="i" name="help" ml={12} />],
    [
      "FileLines",
      <FileLines key="f" text="a b" lines={[{ x: 30, text: "a b" }]} left={20} width={100} size={12} lineHeight={16} ml={4} align="left" />,
    ],
    [
      "ScreenHeader",
      <ScreenHeader key="h" crumb={["Profile", "Address"]} icon="help" action="Edit" nudge={-2} onBack={() => {}} t={t} />,
    ],
    ["InfoBanner", <InfoBanner key="n" t={t} />],
    ["MenuRow", <MenuRow key="m" mt={4} icon="help" iconSize={18} label="a" textX={60} />],
    ["WhyCard", <WhyCard key="w" bottom={20} t={t} onClose={() => {}} />],
  ])("%s sets no margin or padding by the physical left or right", (_name, block) => {
    const { container } = render(block);
    expect(physicalSides(container), "these places stay on the left on a right-to-left page").toEqual([]);
  });

  it("Txt, Box and Icon put their `ml` on the start side", () => {
    const { container } = render(
      <>
        <Txt size={14} ml={12} data-pw="txt">a</Txt>
        <Box w={10} h={10} ml={13} data-pw="box" />
        <Icon name="help" ml={14} />
      </>,
    );
    const at = (el: Element | null) => (el as HTMLElement | null)?.style.marginInlineStart;
    expect(at(container.querySelector('[data-pw="txt"]')), "Txt's `ml` is not on the start side").toBe("12px");
    expect(at(container.querySelector('[data-pw="box"]')), "Box's `ml` is not on the start side").toBe("13px");
    expect(at(container.querySelector("img")), "Icon's `ml` is not on the start side").toBe("14px");
  });

  it("a nudged centred line pads its start side, so the nudge mirrors too", () => {
    const { container } = render(
      <Txt size={14} center nudge={2} data-pw="txt">
        a
      </Txt>,
    );
    expect(
      (container.querySelector('[data-pw="txt"]') as HTMLElement).style.paddingInlineStart,
      "a 2 px nudge is not 4 px of padding on the start side",
    ).toBe("4px");
  });

  it("a left FileLines line keeps its x from the start edge of its box", () => {
    const { container } = render(
      <FileLines text="a b" lines={[{ x: 30, text: "a b" }]} left={20} width={100} size={12} lineHeight={16} align="left" />,
    );
    expect(
      container.querySelector<HTMLElement>("p > span")?.style.marginInlineStart,
      "the line at x 30 in a box at x 20 is not 10 px from the box's start edge",
    ).toBe("10px");
  });
});
