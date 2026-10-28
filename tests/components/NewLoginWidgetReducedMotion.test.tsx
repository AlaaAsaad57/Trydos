import React, { useContext } from "react";
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MotionConfigContext } from "framer-motion";

// The locale segment the page is on; the right-to-left cases set `sy-ar`.
const page = vi.hoisted(() => ({ lang: "sy-en" }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: page.lang }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));

// The probe stands where the first screen (Quick Preview) is drawn, so it sees
// what every login screen sees from the widget.
const seen = vi.hoisted(() => ({
  reducedMotion: undefined as string | undefined,
  logoIgnores: undefined as boolean | undefined,
  complete: undefined as (() => void) | undefined,
}));
vi.mock("NewLoginDesign/QuickPreviewScreen", async (importOriginal) => {
  const actual = await importOriginal<typeof import("NewLoginDesign/QuickPreviewScreen")>();
  const { useLogoAnimation } = await import("NewLoginDesign/LogoAnimationContext");
  function Probe({ onComplete }: { onComplete: () => void }) {
    seen.reducedMotion = useContext(MotionConfigContext).reducedMotion;
    seen.logoIgnores = useLogoAnimation().ignoreReducedMotion;
    seen.complete = onComplete;
    return null;
  }
  return { ...actual, default: Probe };
});
// The next screen is only a place to land; its own drawing is not under test.
vi.mock("NewLoginDesign/NewGetStartedScreen", () => ({ default: () => null }));
// The QR sheet asks for a session when it opens; here the answer never comes,
// so the sheet stays on its first state.
vi.mock("services/qrLogin", () => ({
  createQrSession: () => new Promise(() => {}),
  getQrStatus: () => new Promise(() => {}),
}));

// jsdom has no ResizeObserver; the scaled page measures with one. Here the
// window never changes size, so it never fires.
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

import NewLoginWidget from "NewLoginDesign/NewLoginWidget";
import QrBottomSheet from "NewLoginDesign/QrBottomSheet";

describe("NewLoginWidget — reduced motion (decided in Stage 1 of UI-MIGRATION-PLAN.md)", () => {
  it("follows the shopper's setting: the logo stays still and the screens do not slide", () => {
    render(<NewLoginWidget />);
    expect(
      seen.logoIgnores,
      "the login logo still ignores the shopper's reduced-motion setting (ignoreReducedMotion is on)",
    ).toBe(false);
    expect(
      seen.reducedMotion,
      'the login does not set MotionConfig reducedMotion="user", so its screens still slide for a shopper who turned motion off',
    ).toBe("user");
  });
});

describe("NewLoginWidget — right to left on Arabic and Kurdish pages (D-3 in UI-MIGRATION-PLAN.md)", () => {
  /** Where the screen that comes in after the Quick Preview starts: framer-motion draws its first frame inline. */
  const nextScreenStart = (container: HTMLElement) => {
    act(() => seen.complete!());
    return container.querySelector<HTMLElement>('[data-auth-step="get-started"]')?.style.transform;
  };

  it.each([
    ["sy-ar", "rtl"],
    ["iq-ku", "rtl"],
    ["sy-en", "ltr"],
  ])("on %s the login is %s", (lang, dir) => {
    page.lang = lang;
    const { container } = render(<NewLoginWidget />);
    expect(
      container.querySelector('[data-pw="new-login-widget"]')?.getAttribute("dir"),
      `the login on ${lang} is not ${dir}`,
    ).toBe(dir);
  });

  it.each([
    ["sy-ar", "rtl"],
    ["sy-en", "ltr"],
  ])("on %s the open QR sheet (on <body>, outside the login) is %s", (lang, dir) => {
    page.lang = lang;
    render(<QrBottomSheet isOpen onClose={() => {}} lang={lang.split("-")[1]} />);
    const sheet = document.body.querySelector("[dir]");
    expect(sheet, `the open QR sheet on ${lang} carries no writing direction`).not.toBeNull();
    expect(sheet!.getAttribute("dir"), `the open QR sheet on ${lang} is not ${dir}`).toBe(dir);
  });

  it("an English page: the next screen comes in from the right", () => {
    page.lang = "sy-en";
    const { container } = render(<NewLoginWidget />);
    expect(nextScreenStart(container), "on an English page Get Started did not start off the right edge").toBe(
      "translateX(100%)",
    );
  });

  it("an Arabic page: the next screen comes in from the left", () => {
    page.lang = "sy-ar";
    const { container } = render(<NewLoginWidget />);
    expect(
      nextScreenStart(container),
      "on an Arabic page Get Started did not start off the left edge, so the slide is not mirrored",
    ).toBe("translateX(-100%)");
  });
});
