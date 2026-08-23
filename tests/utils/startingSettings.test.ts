// The starting-settings envelope resolver, driven directly.
//
// This is the smallest file in the money journey and the one with the most
// expensive failure. The platform settings — how many days the platform adds to
// a delivery estimate, and how many decimal places a price is written with —
// arrive nested under a key whose spelling depends on which backend answered:
// the core backend (verified shoppers) sends "starting-setting" with a hyphen,
// the gateway (guests) sends "starting_setting" with an underscore. Every reader
// in the app indexes the underscore form.
//
// So before this resolver existed, a verified shopper's lookup resolved to
// undefined and the delivery estimate silently lost the platform's own days,
// while a guest standing next to them saw the right number. Nothing crashed and
// nothing was logged — the estimate was simply short. That is the failure this
// file exists to stop, and none of it had a test.
//
// The tests are in two halves. The first drives the two functions directly. The
// second walks the same payloads through the exact indexing the components use
// (`settings?.["starting_setting"]?.shipping_duration_days`), because the
// resolver being right and the readers still seeing undefined is the bug in a
// different disguise.
//
// Four tests here originally pinned behaviour that was recorded rather than
// endorsed: a settings entry that was not an object, a fractional or negative
// number of days, and the old spelling left in the envelope beside the repaired
// one. All four were decided and fixed afterwards, and each test now asserts the
// decision and says what it used to do.

import { describe, expect, it } from "vitest";

import {
  normaliseStartingSettings,
  resolveStartingSetting,
  STARTING_SETTING_KEY,
} from "utils/startingSettings";

// The two spellings, written out once. Naming them here rather than typing the
// strings into forty assertions means a rename shows up as one failing test
// instead of forty.
const CORE_KEY = "starting-setting";
const GATEWAY_KEY = "starting_setting";

/** A settings object with the fields the app actually reads off it. */
const settingsObject = (overrides: Record<string, unknown> = {}) => ({
  shipping_duration_days: 3,
  decimal_point_settings: 2,
  minimum_order_price: 10,
  ...overrides,
});

/** What the core backend sends a verified shopper. */
const coreEnvelope = (setting: any = settingsObject()) => ({
  [CORE_KEY]: setting,
  currency: { code: "USD" },
});

/** What the gateway sends a guest. */
const gatewayEnvelope = (setting: any = settingsObject()) => ({
  [GATEWAY_KEY]: setting,
  currency: { code: "USD" },
});

describe("the key every reader indexes (STARTING_SETTING_KEY)", () => {
  it("is the underscore spelling, which is what the components read", () => {
    // Twenty-odd call sites index this string literally. If it ever changes,
    // every one of them resolves undefined and every delivery estimate loses
    // the platform's days again — silently, which is the whole problem.
    expect(STARTING_SETTING_KEY).toBe(GATEWAY_KEY);
  });
});

describe("reading the settings out of either envelope (resolveStartingSetting)", () => {
  it("finds the settings under the core backend's hyphen spelling", () => {
    expect(resolveStartingSetting(coreEnvelope())).toMatchObject({
      shipping_duration_days: 3,
      decimal_point_settings: 2,
    });
  });

  it("finds the settings under the gateway's underscore spelling", () => {
    expect(resolveStartingSetting(gatewayEnvelope())).toMatchObject({
      shipping_duration_days: 3,
      decimal_point_settings: 2,
    });
  });

  it("prefers the core spelling when a payload somehow carries both", () => {
    // The core shape is the accepted contract and the gateway is expected to
    // align to it, so when both are present the core one is the answer.
    const both = {
      [CORE_KEY]: settingsObject({ shipping_duration_days: 7 }),
      [GATEWAY_KEY]: settingsObject({ shipping_duration_days: 1 }),
    };
    expect(resolveStartingSetting(both).shipping_duration_days).toBe(7);
  });

  it("falls through to the gateway spelling when the core one is empty", () => {
    const partial = {
      [CORE_KEY]: null,
      [GATEWAY_KEY]: settingsObject({ shipping_duration_days: 4 }),
    };
    expect(resolveStartingSetting(partial).shipping_duration_days).toBe(4);
  });

  it("hands back every other field, not just the days", () => {
    // The order-status list and the payment screen read other fields off this
    // same result. A resolver that returned only the days it repairs would
    // break both of them.
    const resolved = resolveStartingSetting(
      coreEnvelope(settingsObject({ some_future_field: "kept" })),
    );
    expect(resolved).toMatchObject({
      decimal_point_settings: 2,
      minimum_order_price: 10,
      some_future_field: "kept",
    });
  });

  it("keeps the decimal-place count, the other half of the same fault", () => {
    // The payment screen writes every price with this many decimals. Losing it
    // to the spelling meant a verified shopper saw whole numbers where a guest
    // saw pennies.
    expect(
      resolveStartingSetting(coreEnvelope()).decimal_point_settings,
    ).toBe(2);
  });

  it("leaves the payload it was given untouched", () => {
    const payload = coreEnvelope(settingsObject({ shipping_duration_days: "5" }));
    resolveStartingSetting(payload);
    expect(payload[CORE_KEY]).toEqual(
      settingsObject({ shipping_duration_days: "5" }),
    );
  });

  describe("when there is nothing to read", () => {
    it("gives nothing back for a payload with neither spelling", () => {
      expect(resolveStartingSetting({ currency: { code: "USD" } })).toBeUndefined();
    });

    it("gives nothing back rather than throwing when there is no payload", () => {
      // The call site is `resolveStartingSetting(response?.data?.data)`, so a
      // failed request arrives here as undefined.
      expect(resolveStartingSetting(undefined)).toBeUndefined();
      expect(resolveStartingSetting(null)).toBeUndefined();
    });

    it("gives nothing back when the core entry is empty and there is no gateway one", () => {
      // An empty core entry is not an answer — it falls through to the gateway
      // spelling, and when that is absent too the result is nothing at all.
      expect(resolveStartingSetting({ [CORE_KEY]: null })).toBeUndefined();
    });

    it("treats a settings entry that is not an object as no entry at all", () => {
      // A false or 0 entry used to be neither empty enough to fall through to
      // the other spelling nor an object to repair, so it was handed on as it
      // was and the readers indexed into it and found nothing. It now counts as
      // absent, so the gateway spelling gets its turn.
      expect(resolveStartingSetting({ [CORE_KEY]: false })).toBeUndefined();
      expect(resolveStartingSetting({ [CORE_KEY]: 0 })).toBeUndefined();
      expect(
        resolveStartingSetting({
          [CORE_KEY]: 0,
          [GATEWAY_KEY]: settingsObject({ shipping_duration_days: 4 }),
        }).shipping_duration_days,
      ).toBe(4);
    });

    it("still answers for an empty settings object, with the days at zero", () => {
      expect(resolveStartingSetting({ [CORE_KEY]: {} })).toEqual({
        shipping_duration_days: 0,
      });
    });
  });
});

describe("the platform's delivery days, whatever shape they arrive in", () => {
  // Every case here ends up added to a product's own shipping days. A value
  // that is not a number turns that sum into NaN, and NaN reaches the screen as
  // "NaN days" — which is why the coercion exists at all.
  const daysFor = (value: unknown) =>
    resolveStartingSetting(coreEnvelope(settingsObject({ shipping_duration_days: value })))
      .shipping_duration_days;

  it("keeps a plain number as it is", () => {
    expect(daysFor(3)).toBe(3);
  });

  it("reads a number sent as text", () => {
    // Both backends have sent this as a string at some point.
    expect(daysFor("5")).toBe(5);
  });

  it("counts a missing value as zero, not as nothing", () => {
    expect(daysFor(undefined)).toBe(0);
  });

  it("counts an empty value as zero", () => {
    expect(daysFor(null)).toBe(0);
    expect(daysFor("")).toBe(0);
  });

  it("counts text that is not a number as zero rather than letting NaN through", () => {
    // "3 days" is not 3. It is the case that produced "NaN days" on the page.
    expect(daysFor("3 days")).toBe(0);
    expect(daysFor("soon")).toBe(0);
    expect(daysFor({})).toBe(0);
  });

  it("counts an endless value as zero", () => {
    expect(daysFor(Infinity)).toBe(0);
  });

  it("rounds a fraction up to a whole day", () => {
    // Half a day cannot be shown, and rounding down would make the estimate
    // shorter than the platform actually needs — the failure this module exists
    // to stop. It used to pass 2.5 straight through. No backend sends one.
    expect(daysFor(2.5)).toBe(3);
    expect(daysFor(2.1)).toBe(3);
    expect(daysFor(3)).toBe(3);
  });

  it("counts a negative value as zero", () => {
    // A negative platform duration would pull the estimate earlier than the
    // product's own shipping days. It used to pass through unguarded.
    expect(daysFor(-1)).toBe(0);
  });
});

describe("handing the envelope on to the store (normaliseStartingSettings)", () => {
  it("puts the core backend's settings under the key the readers index", () => {
    // This is the whole point of the function: the store must keep receiving an
    // envelope, with the settings under the underscore key, no matter which
    // backend answered.
    const normalised = normaliseStartingSettings(coreEnvelope());
    expect(normalised[GATEWAY_KEY]).toMatchObject({
      shipping_duration_days: 3,
      decimal_point_settings: 2,
    });
  });

  it("repairs the gateway's own payload in place too", () => {
    const normalised = normaliseStartingSettings(
      gatewayEnvelope(settingsObject({ shipping_duration_days: "6" })),
    );
    expect(normalised[GATEWAY_KEY].shipping_duration_days).toBe(6);
  });

  it("keeps the rest of the envelope, which the same response carries", () => {
    const normalised = normaliseStartingSettings(coreEnvelope());
    expect(normalised.currency).toEqual({ code: "USD" });
  });

  it("never hands the store the settings object on its own", () => {
    // If the inner object were returned instead of the envelope, every
    // `settings["starting_setting"]` reader would resolve undefined — the same
    // failure this file exists to prevent, arriving from the other side.
    const normalised = normaliseStartingSettings(coreEnvelope());
    expect(normalised).toHaveProperty(GATEWAY_KEY);
    expect(normalised).not.toHaveProperty("shipping_duration_days");
  });

  it("carries the settings once, under the key the readers index", () => {
    // The original key used to be left in place, so a core payload reached the
    // store holding the same settings twice and a reader could pick the spelling
    // the app does not index. Only the repaired entry survives now.
    const normalised = normaliseStartingSettings(coreEnvelope());
    expect(normalised).toHaveProperty(GATEWAY_KEY);
    expect(normalised).not.toHaveProperty(CORE_KEY);
  });

  it("hands a payload with no settings back exactly as it came", () => {
    // A failed or empty response must not become an envelope with an empty
    // settings entry — the screens tell "not loaded yet" and "loaded, zero
    // days" apart by whether the entry is there.
    const payload = { currency: { code: "USD" } };
    expect(normaliseStartingSettings(payload)).toBe(payload);
  });

  it("hands nothing back for nothing, rather than throwing", () => {
    expect(normaliseStartingSettings(undefined)).toBeUndefined();
    expect(normaliseStartingSettings(null)).toBeNull();
  });

  it("leaves the response it was given untouched", () => {
    // The caller stores the response in session storage as well, so writing
    // into it here would change what is stored.
    const payload = coreEnvelope(settingsObject({ shipping_duration_days: "9" }));
    normaliseStartingSettings(payload);
    expect(payload).not.toHaveProperty(GATEWAY_KEY);
    expect(payload[CORE_KEY].shipping_duration_days).toBe("9");
  });
});

describe("what the screens actually read off the result", () => {
  // These use the exact expression the components use, rather than a tidier
  // one. The resolver being right is only half the fix; the readers seeing the
  // value is the other half, and only this half is what a shopper sees.
  const platformDays = (settings: any) =>
    settings?.[GATEWAY_KEY]?.shipping_duration_days;

  it("gives a verified shopper the platform's days, where the raw response gives none", () => {
    const raw = coreEnvelope();
    // The bug, pinned: reading the raw core response the way every component
    // does finds nothing.
    expect(platformDays(raw)).toBeUndefined();
    // The fix: after normalising, the same expression finds the days.
    expect(platformDays(normaliseStartingSettings(raw))).toBe(3);
  });

  it("gives a guest the same days it always did", () => {
    // Guests were the ones the app read correctly. They must not regress while
    // the other half is repaired.
    expect(platformDays(normaliseStartingSettings(gatewayEnvelope()))).toBe(3);
  });

  it("adds up with a product's own shipping days instead of producing NaN", () => {
    // What components/Cart/AddToCart/Card.tsx does: the product's days plus the
    // platform's. Before the coercion, a missing platform value made the whole
    // sum NaN and the card read "NaN days".
    const missing = normaliseStartingSettings(
      coreEnvelope(settingsObject({ shipping_duration_days: undefined })),
    );
    const productDays = 4;
    expect(productDays + platformDays(missing)).toBe(4);
  });

  it("gives the payment screen a decimal-place count it can use", () => {
    // components/Cart/PaymentMethod.tsx: `...decimal_point_settings || 0`.
    const settings = normaliseStartingSettings(coreEnvelope());
    expect(settings[GATEWAY_KEY]?.decimal_point_settings || 0).toBe(2);
  });

  it("leaves the screens on their own fallback when the response carried nothing", () => {
    // The readers all end in `|| 0` or `?? 0`. With no settings entry, that is
    // what they land on, and the estimate shows the product's days alone.
    const settings = normaliseStartingSettings({ currency: { code: "USD" } });
    expect(platformDays(settings)).toBeUndefined();
    expect(Number(platformDays(settings)) || 0).toBe(0);
  });
});
