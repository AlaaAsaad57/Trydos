/**
 * Surfacing a refused save on the product editor's own fields.
 *
 * The backend runs validation rules this form does not have and cannot have — a
 * barcode another product already uses is the reported case. Until this change
 * the mapper threw the backend's sentence away, replaced it with one constant of
 * ours, and silently dropped every field name that was not in a hand-written list
 * of twenty. `barcode` was not in that list, so a refused barcode showed nothing
 * at all.
 *
 * These tests cover the mapper, the summary chooser, the clearing helper, the
 * topmost-field picker and the scroll. Each `AC-n` named below is the acceptance
 * criterion in `_specs/product-editor-backend-field-errors/spec.md`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  chooseSaveErrorSummary,
  clearServerFieldErrors,
  mapServerErrors,
  pickTopmostErrorField,
  scrollToFirstError,
  type ServerErrorResult,
} from "components/SellerDashboard/productEdit/helpers";

/** A refusal exactly as the request layer hands it over: the parsed body, plus
 *  the flag and the status it attaches to every response it returns. */
const refusal = (detailed: unknown[], status = 422) => ({
  success: false,
  httpStatus: status,
  message: "The given data was invalid.",
  detailed_error: detailed,
});

/** The two field names the form owns that are also names of the whole editor —
 *  used where a test needs a field that is definitely displayable. */
const BARCODE_TAKEN = "This barcode already exists";

describe("mapping a refused save onto the form's fields (AC-1 … AC-8, AC-11 … AC-14, AC-17, AC-22, AC-23, AC-27, AC-30)", () => {
  it("AC-1 / AC-3: a barcode already in use marks the barcode field", () => {
    const result = mapServerErrors(
      refusal([{ code: "barcode", message: BARCODE_TAKEN }]),
    );

    expect(
      Object.keys(result.fields),
      "the backend refused the barcode and no field was marked — this is the reported bug",
    ).toContain("barcode");
  });

  it("AC-2: the field carries the backend's own sentence, character for character", () => {
    const result = mapServerErrors(
      refusal([{ code: "barcode", message: BARCODE_TAKEN }]),
    );

    expect(
      result.fields.barcode,
      `the barcode field shows something other than what the backend said ("${BARCODE_TAKEN}")`,
    ).toBe(BARCODE_TAKEN);
  });

  it("AC-4: a field name nothing in the code has ever mentioned still reaches the seller", () => {
    const result = mapServerErrors(
      refusal([{ code: "a_rule_added_next_year", message: "The backend refused this" }]),
    );

    expect(
      result.messages,
      "an unanticipated field name was dropped instead of being shown as text — the old allowlist bug",
    ).toContain("The backend refused this");
  });

  it("AC-5: a code naming an item inside a list marks that list's own field", () => {
    const dotted = mapServerErrors(
      refusal([{ code: "category_id.0", message: "Pick a real category" }]),
    );
    const bracketed = mapServerErrors(
      refusal([{ code: "labels[1]", message: "That label is gone" }]),
    );

    expect(
      dotted.fields.category_id,
      "the backend refused the first category and the category field was not marked",
    ).toBe("Pick a real category");
    expect(
      bracketed.fields.labels,
      "the backend refused the second label and the labels field was not marked",
    ).toBe("That label is gone");
  });

  it("AC-6: a colour/size row and a translation row are shown as text, and a variant key never reaches the flat field it starts with", () => {
    const result = mapServerErrors(
      refusal([
        { code: "barcode_Black-M", message: "That variant barcode is taken" },
        { code: "custom_data[0][name]", message: "The Arabic name is required" },
      ]),
    );

    expect(
      result.fields.barcode,
      "a variant barcode refusal was bound to the flat barcode input — the prefix was cut at an underscore",
    ).toBeUndefined();
    expect(
      result.messages,
      "the variant barcode refusal reached neither a field nor the message list",
    ).toContain("That variant barcode is taken");
    expect(
      result.messages,
      "a translation row refusal reached neither a field nor the message list",
    ).toContain("The Arabic name is required");
  });

  it("AC-7: a code cannot become a key on its own, and the field record has no prototype", () => {
    const result = mapServerErrors(
      refusal([
        { code: "__proto__", message: "polluted" },
        { code: 'a"]', message: "quoted" },
      ]),
    );

    expect(
      Object.getPrototypeOf(result.fields),
      "the field record was built on a normal object, so a backend code could reach its prototype",
    ).toBeNull();
    expect(
      Object.keys(result.fields),
      "a backend-controlled code became a field key without passing the displayable-field check",
    ).toEqual([]);
    expect(
      result.messages,
      "the refusal was dropped entirely instead of being shown as text",
    ).toEqual(["polluted", "quoted"]);
  });

  it("AC-8: a field problem and a non-field problem in one refusal both survive", () => {
    const result = mapServerErrors(
      refusal([
        { code: "barcode", message: BARCODE_TAKEN },
        { code: "colors", message: "Pick at least one colour" },
      ]),
    );

    expect(
      result.fields.barcode,
      "the field problem was lost when the same refusal also carried a non-field problem",
    ).toBe(BARCODE_TAKEN);
    expect(
      result.messages,
      "the non-field problem was lost when the same refusal also carried a field problem",
    ).toContain("Pick at least one colour");
  });

  it("AC-11: a refusal that is not a validation refusal marks nothing and says nothing", () => {
    const result = mapServerErrors(
      refusal([{ code: "barcode", message: BARCODE_TAKEN }], 500),
    );

    expect(
      result,
      "the backend failed with a server error, not a validation refusal, and its text was surfaced anyway",
    ).toEqual({ fields: {}, messages: [], withheld: 0 });
  });

  it("AC-12: every coded entry lands in exactly one output, and a codeless entry is counted rather than lost", () => {
    const result = mapServerErrors(
      refusal([
        { code: "barcode", message: BARCODE_TAKEN },
        { code: "colors", message: "Pick at least one colour" },
        { message: "Undefined array key \"luck_price\"" },
      ]),
    );

    expect(
      Object.keys(result.fields).length + result.messages.length + result.withheld,
      "the three outputs do not account for all three refusal entries — one was dropped",
    ).toBe(3);
    expect(
      result.messages,
      "raw server text carrying no field name was shown to the seller",
    ).toEqual(["Pick at least one colour"]);
    expect(
      result.withheld,
      "the withheld entry was not counted, so nothing records that it existed",
    ).toBe(1);
  });

  it("AC-14: the four codeless image failures still mark their own inputs, with our wording", () => {
    const images = mapServerErrors(
      refusal([{ message: "Add at least one product image" }]),
    );
    const colorImages = mapServerErrors(
      refusal([{ message: "Every color must have at least one image" }]),
    );

    expect(
      images.fields.images,
      "the codeless image assert stopped marking the images input",
    ).toBeTruthy();
    expect(
      images.fields.images,
      "the images input now shows the backend's own codeless text instead of our wording",
    ).not.toBe("Add at least one product image");
    expect(
      colorImages.fields.colorImages,
      "the codeless colour-image assert stopped marking the colour images input",
    ).toBeTruthy();
  });

  it("AC-14: a codeless entry matching none of the four phrases marks no field at all", () => {
    const result = mapServerErrors(
      refusal([{ message: "Undefined array key \"luck_price\"" }]),
    );

    expect(
      Object.keys(result.fields),
      "a codeless entry that matches none of the four image phrases marked a field",
    ).toEqual([]);
  });

  it("AC-16: the same refusal produces the same outputs for an add and for an edit", () => {
    const body = [{ code: "barcode", message: BARCODE_TAKEN }];

    expect(
      mapServerErrors(refusal(body)),
      "the same refusal was mapped differently depending on the save",
    ).toEqual(mapServerErrors(refusal(body)));
  });

  it("AC-17: two problems naming the same field leave one readable message", () => {
    const result = mapServerErrors(
      refusal([
        { code: "barcode", message: BARCODE_TAKEN },
        { code: "barcode", message: "Barcode must be 13 digits" },
      ]),
    );

    expect(
      result.fields.barcode,
      "two problems on one field left it with no readable message",
    ).toBe("Barcode must be 13 digits");
  });

  it("AC-22: an entry naming a field with an empty message marks nothing", () => {
    const result = mapServerErrors(
      refusal([{ code: "barcode", message: "   " }]),
    );

    expect(
      Object.keys(result.fields),
      "a field was marked with a blank message, so the seller sees a red field and no reason",
    ).toEqual([]);
  });

  it("AC-23: a validation refusal carrying no detail at all yields empty outputs to fall back on", () => {
    const result = mapServerErrors(refusal([]));

    expect(
      Object.keys(result.fields).length + result.messages.length,
      "a refusal with no per-problem detail produced something to show, which it cannot have",
    ).toBe(0);
  });

  it("AC-27: a failure carrying no refusal body at all behaves as it does today", () => {
    const networkDrop = { success: false, httpStatus: 0, message: "Failed to fetch" };

    expect(
      mapServerErrors(networkDrop),
      "a dropped request was treated as a validation refusal",
    ).toEqual({ fields: {}, messages: [], withheld: 0 });
  });

  it("AC-30: with prices locked, a refusal naming a hidden price input is shown as text, not marked", () => {
    const body = [{ code: "unit_price", message: "The unit price is too low" }];

    const locked = mapServerErrors(refusal(body), true);
    const unlocked = mapServerErrors(refusal(body), false);

    expect(
      locked.fields.unit_price,
      "the unit price input is not on the page while prices are locked, but it was marked anyway",
    ).toBeUndefined();
    expect(
      locked.messages,
      "the refusal on a hidden price input was lost instead of being shown as text",
    ).toContain("The unit price is too low");
    expect(
      unlocked.fields.unit_price,
      "the unit price input is on the page while prices are unlocked, and it was not marked",
    ).toBe("The unit price is too low");
  });
});

describe("the set of fields that can show a message (AC-10)", () => {
  /** Every input completed alongside this change. Each must bind. */
  const COMPLETED_FIELDS = [
    "count_of_pieces",
    "labels",
    "origin_country_iso",
    "images",
    "colorImages",
    "barcode",
    "luck_price",
    "model_number",
    "report_ref_number",
    "shipping_cost",
    "shipping_days",
    "max_allowed_qty",
    "meta_title",
    "meta_description",
  ];

  /** Every input that already showed a message and already had an anchor. */
  const ALREADY_COMPLETE_FIELDS = [
    "name",
    "seller_product_id",
    "unit",
    "brand_id",
    "boutique_id",
    "location_id",
    "description",
    "unit_price",
    "discount_price",
    "purchase_price",
    "current_stock",
    "weight",
    "tax",
    "tax_type",
    "category_id",
    "variations",
    "translations",
  ];

  it.each([...ALREADY_COMPLETE_FIELDS, ...COMPLETED_FIELDS])(
    "binds a refusal naming %s to that field",
    (field) => {
      const result = mapServerErrors(
        refusal([{ code: field, message: "The backend refused this" }]),
      );

      expect(
        result.fields[field],
        `a refusal naming ${field} was not bound to it — that input recreates the reported bug`,
      ).toBe("The backend refused this");
    },
  );

  it("does not bind similar_words, which carries an anchor but has no message slot", () => {
    const result = mapServerErrors(
      refusal([{ code: "similar_words", message: "Too many similar words" }]),
    );

    expect(
      result.fields.similar_words,
      "similar_words was marked, but it has nowhere to show a message — a silent swallow",
    ).toBeUndefined();
    expect(
      result.messages,
      "the similar_words refusal was dropped instead of being shown as text",
    ).toContain("Too many similar words");
  });
});

describe("the summary line shown alongside a refusal (AC-25)", () => {
  const FIX = "Please fix the highlighted fields before saving.";
  const FALLBACK = "Failed to update product";

  const result = (over: Partial<ServerErrorResult>): ServerErrorResult => ({
    fields: {},
    messages: [],
    withheld: 0,
    ...over,
  });

  it("claims highlighted fields only when a field was actually marked", () => {
    expect(
      chooseSaveErrorSummary(result({ fields: { barcode: BARCODE_TAKEN } }), FIX, FALLBACK),
      "a field was marked and the summary did not point the seller at it",
    ).toBe(FIX);
  });

  it("says what happened instead when nothing could be put on a field", () => {
    expect(
      chooseSaveErrorSummary(result({ messages: ["Pick at least one colour"] }), FIX, FALLBACK),
      "no field was marked, yet the summary told the seller to fix highlighted fields",
    ).toBe("Pick at least one colour");
  });

  it("falls back to the caller's own wording when the refusal named nothing usable", () => {
    expect(
      chooseSaveErrorSummary(result({ withheld: 2 }), FIX, FALLBACK),
      "nothing was shown anywhere, yet the summary claimed highlighted fields",
    ).toBe(FALLBACK);
  });
});

describe("clearing a backend failure as the seller fixes it (AC-13, AC-29)", () => {
  it("AC-13: removes only the changed field and leaves the others in place", () => {
    const current = { barcode: BARCODE_TAKEN, name: "Name is required" };

    const next = clearServerFieldErrors(current, ["barcode"]);

    expect(
      next.barcode,
      "the seller changed the barcode and the old backend message stayed under it",
    ).toBeUndefined();
    expect(
      next.name,
      "changing the barcode also cleared the failure on an untouched field",
    ).toBe("Name is required");
  });

  it("AC-13: never touches the record the form's own validation writes", () => {
    const ownValidation = { weight: "Weight is required" };
    const current = { barcode: BARCODE_TAKEN };

    clearServerFieldErrors(current, ["weight", "barcode"]);

    expect(
      ownValidation.weight,
      "clearing a backend failure reached into the form's own validation record",
    ).toBe("Weight is required");
  });

  it("AC-29: returns the very same object when nothing was cleared", () => {
    const current = { barcode: BARCODE_TAKEN };

    expect(
      clearServerFieldErrors(current, ["name"]),
      "typing in a field with no backend failure built a new record, costing a state change per keystroke",
    ).toBe(current);
  });
});

describe("moving the seller to the problem (AC-9, AC-26)", () => {
  /** jsdom implements no layout, so `scrollIntoView` is not merely unimplemented
   *  — it is absent from the prototype, which is why it cannot be spied on and
   *  has to be defined. Without this the scroll cases throw; without the fake
   *  timers below they pass while never scrolling, because the scroll runs
   *  inside a 100 ms timer. */
  const stubScrollIntoView = () => {
    const spy = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      value: spy,
      configurable: true,
      writable: true,
    });
    return spy;
  };

  beforeEach(() => {
    // The form is read top to bottom, so document order is what decides which
    // field the page moves to. `name` is placed last on purpose.
    document.body.innerHTML = `
      <div data-field="description"></div>
      <div data-field="barcode"></div>
      <div data-field="name"></div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    delete (Element.prototype as Partial<Element>).scrollIntoView;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("AC-26: picks the field highest in the document, not the first key in the record", () => {
    // `name` comes first in the record and last on the page.
    const target = pickTopmostErrorField({ name: "a", barcode: "b" });

    expect(
      target?.getAttribute("data-field"),
      "the page moved to whichever field the backend happened to list first, not the topmost one",
    ).toBe("barcode");
  });

  it("AC-26: ignores an anchor whose field is not failing", () => {
    const target = pickTopmostErrorField({ name: "a" });

    expect(
      target?.getAttribute("data-field"),
      "the page moved to a field that is not failing",
    ).toBe("name");
  });

  it("AC-9: scrolls the failing field into view", () => {
    // jsdom implements no layout, so `scrollIntoView` does not exist on the
    // prototype at all; and the scroll runs inside a timer. Without both of
    // these the case would throw, or pass without ever scrolling.
    vi.useFakeTimers();
    const scrollIntoView = stubScrollIntoView();

    scrollToFirstError({ barcode: BARCODE_TAKEN });
    vi.runAllTimers();

    expect(
      scrollIntoView,
      "the save was refused and the page never moved to the failing field",
    ).toHaveBeenCalled();
    expect(
      scrollIntoView.mock.instances[0],
      "the page moved, but not to the field the backend refused",
    ).toBe(document.querySelector('[data-field="barcode"]'));
  });

  it("AC-9: does not scroll when nothing is failing", () => {
    vi.useFakeTimers();
    const scrollIntoView = stubScrollIntoView();

    scrollToFirstError({});
    vi.runAllTimers();

    expect(
      scrollIntoView,
      "the page moved even though no field was marked",
    ).not.toHaveBeenCalled();
  });
});
