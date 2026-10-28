import React, { useContext } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MotionConfigContext } from "framer-motion";

vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "sy-en" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));

// The probe stands where the first screen (Quick Preview) is drawn, so it sees
// what every login screen sees from the widget.
const seen = vi.hoisted(() => ({ reducedMotion: undefined as string | undefined, logoIgnores: undefined as boolean | undefined }));
vi.mock("NewLoginDesign/QuickPreviewScreen", async (importOriginal) => {
  const actual = await importOriginal<typeof import("NewLoginDesign/QuickPreviewScreen")>();
  const { useLogoAnimation } = await import("NewLoginDesign/LogoAnimationContext");
  function Probe() {
    seen.reducedMotion = useContext(MotionConfigContext).reducedMotion;
    seen.logoIgnores = useLogoAnimation().ignoreReducedMotion;
    return null;
  }
  return { ...actual, default: Probe };
});

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
