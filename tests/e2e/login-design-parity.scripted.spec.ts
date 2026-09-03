// Does the new login design still sit on the XD grid?
//
// The designer's complaint was that the build did not respect his spaces, sizes
// and weights. Two things caused it: the canvas reshaped itself on a short
// screen, and every screen placed its blocks by stacking margins instead of by
// the anchor the design gives them. Both are fixed. This spec is what stops
// either coming back.
//
// It walks the demo route at three viewports and checks every anchor against
// `NewLoginDesign/authLayout.ts` — the same file the screens read, so the test
// and the code cannot drift apart. Positions are converted back to design px by
// dividing by the canvas scale, which is why the same numbers are expected at
// 430x932, at 430x745 and at 390x844: that identical-at-any-size behaviour is
// the whole point of the change.
//
// It is a browser test and not a unit test because a rendered position needs
// real layout, and jsdom has none. The arithmetic underneath it IS unit-tested,
// in tests/scaling/canvasFit.test.ts and tests/scaling/appScaler.test.tsx.
//
// Scripted, not live: the demo route talks to no backend and mints no token.
import { expect, test } from "@playwright/test";

import { XD } from "../../NewLoginDesign/authLayout";

/** How far a measured position may sit from the design, in design px. */
const TOLERANCE = 1;

/**
 * The canvas always fills the width. On a page shorter than the artboard the
 * screens give up the missing height (`--xd-flex-deficit`, see canvasFit) from
 * the space ABOVE the mark: a top-anchored element keeps its design y, and a
 * bottom-anchored one sits `deficit` higher. 430x745 is an iPhone Pro Max in
 * Safari — the phone the client saw the 80% build on. There the deficit is 187.
 */
const VIEWPORTS = [
  { name: "the artboard itself", width: 430, height: 932 },
  { name: "iPhone Pro Max in Safari", width: 430, height: 745 },
  { name: "iPhone 13", width: 390, height: 844 },
];

type Anchor = {
  /** What to look for. A `data-pw` value, or a raw selector when there is none. */
  selector: string;
  /** What to call it in a failure message. */
  label: string;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  /** The element keeps its distance from the bottom of the page, not the artboard. */
  fromBottom?: true;
};

type Screen = {
  /** The step's own id on the demo route's bar — `data-pw="demo-step-<id>"`. */
  tab: string;
  name: string;
  anchors: Anchor[];
};

const LOGO: Anchor = {
  selector: "[data-auth-logo-slot]",
  label: "the badge mark",
  top: XD.logo.top,
  width: XD.logo.size,
  height: XD.logo.size,
};

const CLOSE: Anchor = {
  selector: '[data-pw="close"]',
  label: "the close control",
  top: XD.control.top,
  left: XD.canvas.width - XD.control.right - XD.control.closeSize,
  width: XD.control.closeSize,
  height: XD.control.closeSize,
};

const TITLE: Anchor = {
  selector: "h2",
  label: "the title",
  top: XD.head.title,
  left: XD.textLeft,
};

const wideBox = (selector: string, label: string, top: number): Anchor => ({
  selector,
  label,
  top,
  left: XD.box.left,
  width: XD.box.width,
  height: XD.box.height,
});

/** The CTA cluster and everything under the mark's low stop anchor to the bottom. */
const bottom = (anchor: Anchor): Anchor => ({ ...anchor, fromBottom: true });

const SCREENS: Screen[] = [
  {
    tab: "get-started",
    name: "get started",
    anchors: [
      {
        selector: '[data-pw="scan-qr-code"]',
        label: "the QR scan icon",
        top: XD.control.top,
        left: XD.canvas.width - XD.control.right - XD.control.qrSize,
        width: XD.control.qrSize,
        height: XD.control.qrSize,
      },
      bottom({ ...LOGO, top: XD.logo.centre }),
      bottom({ selector: '[data-pw="get-started"]', label: "the title", top: XD.getStarted.title }),
      bottom(wideBox('[data-pw="have-account-button"]', "the first button", XD.cta.second)),
      bottom(wideBox('[data-pw="create-account"]', "the second button", XD.cta.primary)),
      bottom({ selector: '[data-pw="take-look"]', label: "the bottom link", top: XD.cta.link }),
    ],
  },
  {
    tab: "terms",
    name: "terms",
    anchors: [
      bottom({ ...LOGO, top: XD.logo.centre }),
      bottom(wideBox('[data-pw="agree-continue"]', "the agree button", XD.cta.primary)),
      bottom({ selector: '[data-pw="take-look"]', label: "the bottom link", top: XD.cta.link }),
    ],
  },
  {
    tab: "enter-phone",
    name: "phone number",
    anchors: [
      CLOSE,
      LOGO,
      TITLE,
      wideBox('[data-pw="phone-number-display"]', "the phone input", XD.box.top),
    ],
  },
  {
    tab: "select-method",
    name: "SMS or WhatsApp",
    anchors: [
      CLOSE,
      LOGO,
      TITLE,
      {
        selector: '[data-pw="whatsapp-receive-otp"]',
        label: "the WhatsApp button",
        top: XD.box.top,
        left: XD.box.left,
        width: XD.method.width,
        height: XD.box.height,
      },
      {
        selector: '[data-pw="sms-receive-otp"]',
        label: "the SMS button",
        top: XD.box.top,
        left: XD.box.left + XD.method.width + XD.method.gap,
        width: XD.method.width,
        height: XD.box.height,
      },
    ],
  },
  {
    tab: "enter-pin",
    name: "code entry",
    anchors: [
      CLOSE,
      LOGO,
      TITLE,
      {
        selector: '[data-pw="otp-digit-1"]',
        label: "the first code box",
        top: XD.box.top,
        left: XD.box.left,
        width: XD.otp.size,
        height: XD.otp.size,
      },
      {
        selector: '[data-pw="otp-digit-6"]',
        label: "the last code box",
        top: XD.box.top,
        left: XD.box.left + 5 * (XD.otp.size + XD.otp.gap),
        width: XD.otp.size,
        height: XD.otp.size,
      },
    ],
  },
  {
    tab: "not-registered",
    name: "not registered",
    anchors: [
      CLOSE,
      LOGO,
      TITLE,
      bottom(wideBox('[data-pw="create-account-continue"]', "the create-account button", XD.cta.primary)),
      bottom({ selector: '[data-pw="cancel-take-look"]', label: "the bottom link", top: XD.cta.link }),
    ],
  },
  {
    tab: "already-registered",
    name: "already registered",
    anchors: [
      CLOSE,
      LOGO,
      TITLE,
      bottom(wideBox('[data-pw="login-continue"]', "the sign-in button", XD.cta.primary)),
      bottom({ selector: '[data-pw="cancel-take-look"]', label: "the bottom link", top: XD.cta.link }),
    ],
  },
  {
    tab: "input-name",
    name: "name entry",
    anchors: [LOGO, TITLE],
  },
  {
    tab: "signup-success",
    name: "sign-up done",
    anchors: [LOGO, TITLE],
  },
];

/**
 * Where an element sits inside the canvas, in DESIGN px.
 *
 * A client rect comes back in real px, because AppScaler scales the whole
 * canvas with one transform. Dividing by that scale gives the number the design
 * file uses, and it is the same number on every device — which is exactly what
 * this spec is checking.
 */
async function measure(page: import("@playwright/test").Page, selector: string) {
  return page.evaluate((sel) => {
    const canvas = document.getElementById("master-canvas");
    if (!canvas) return null;
    const scale = Number(
      getComputedStyle(document.documentElement).getPropertyValue("--app-scale"),
    );
    if (!scale) return null;
    const screen = canvas.querySelector("[data-auth-step]") ?? canvas;
    const el = screen.querySelector(sel);
    if (!el) return null;
    const box = canvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
      top: (r.top - box.top) / scale,
      left: (r.left - box.left) / scale,
      width: r.width / scale,
      height: r.height / scale,
    };
  }, selector);
}

for (const view of VIEWPORTS) {
  test.describe(`the login design on the XD grid at ${view.width} x ${view.height}`, () => {
    test.use({ viewport: { width: view.width, height: view.height } });

    test(`${view.name}: every screen sits on the anchors in the design file`, async ({
      page,
    }) => {
      /** Design px the page lacks, read from the canvas once it is drawn. */
      let deficit = 0;
      await test.step("the demo route draws the design canvas", async () => {
        await page.goto("/sy-en/loginDemo", { waitUntil: "domcontentloaded" });
        await page.waitForSelector("#master-canvas");

        const canvas = await page.evaluate(() => {
          const el = document.getElementById("master-canvas");
          const root = getComputedStyle(document.documentElement);
          const scale = Number(root.getPropertyValue("--app-scale"));
          const deficit = Number.parseFloat(root.getPropertyValue("--xd-flex-deficit")) || 0;
          const r = el!.getBoundingClientRect();
          return { designW: r.width / scale, designH: r.height / scale, scale, deficit };
        });
        deficit = canvas.deficit;

        expect(
          canvas.scale,
          `${view.name}: the canvas must fill the ${view.width} px width (scale ${(view.width / XD.canvas.width).toFixed(4)}) — a shrunk canvas is the 80% app the client saw, the scale is ${canvas.scale.toFixed(4)}`,
        ).toBeCloseTo(view.width / XD.canvas.width, 3);
        expect(
          canvas.designW,
          `${view.name}: the canvas must be the full ${XD.canvas.width} design px wide however small the screen, it is ${canvas.designW.toFixed(1)}`,
        ).toBeCloseTo(XD.canvas.width, 0);
        expect(
          canvas.designH,
          `${view.name}: the canvas must be ${XD.canvas.height} design px minus the ${canvas.deficit.toFixed(1)} px deficit, it is ${canvas.designH.toFixed(1)}`,
        ).toBeCloseTo(XD.canvas.height - canvas.deficit, 0);
      });

      await test.step("the demo step bar is open", async () => {
        // The bar is a client-side toggle on a page that is still hydrating when
        // #master-canvas first appears, so the first click can land before React
        // is listening. Clicking again is the whole fix; three tries is plenty.
        const toggle = page.getByTestId("demo-flow-steps");
        const firstStep = page.getByTestId("demo-step-enter-phone");
        await toggle.waitFor({ state: "visible" });

        for (let attempt = 0; attempt < 3; attempt += 1) {
          await toggle.click();
          try {
            await firstStep.waitFor({ state: "visible", timeout: 4000 });
            break;
          } catch {
            // The click toggled nothing, or toggled it shut again. Try once more.
          }
        }

        await expect(
          firstStep,
          "the demo route's step bar did not open, so no screen can be reached",
        ).toBeVisible();
      });

      for (const screen of SCREENS) {
        await test.step(`the ${screen.name} screen`, async () => {
          await page.getByTestId(`demo-step-${screen.tab}`).click();
          // The screens slide in, and the shared mark springs to its new stop.
          await page.waitForTimeout(2000);

          for (const anchor of screen.anchors) {
            const got = await measure(page, anchor.selector);

            expect(
              got,
              `${view.name}, the ${screen.name} screen: ${anchor.label} (${anchor.selector}) is not on the page at all`,
            ).not.toBeNull();
            if (!got) continue;

            const wantTop =
              anchor.top === undefined ? undefined : anchor.top - (anchor.fromBottom ? deficit : 0);
            const checks: [string, number | undefined, number][] = [
              ["top", wantTop, got.top],
              ["left", anchor.left, got.left],
              ["width", anchor.width, got.width],
              ["height", anchor.height, got.height],
            ];

            for (const [side, want, have] of checks) {
              if (want === undefined) continue;
              const anchored =
                side === "top" && anchor.fromBottom && deficit
                  ? ` (${anchor.top} in the design, ${deficit.toFixed(1)} px up because the page is that much shorter than the artboard)`
                  : "";
              expect(
                Math.abs(have - want),
                `${view.name}, the ${screen.name} screen: ${anchor.label} must have a ${side} of ${want.toFixed(1)} design px${anchored}, it is ${have.toFixed(1)}`,
              ).toBeLessThanOrEqual(TOLERANCE);
            }
          }
        });
      }
    });
  });
}
