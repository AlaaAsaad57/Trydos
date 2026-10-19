// The one-shot hand-off from the "Add with AI" dialog to the create form, and
// how an AI suggestion is laid over an empty product form.
import { afterEach, describe, expect, it } from "vitest";
import {
  applyAiSuggestion,
  clearAiPrefill,
  descriptionToHtml,
  peekAiPrefill,
  setAiPrefill,
  type AiPrefill,
} from "components/SellerDashboard/productEdit/aiPrefill";
import { emptyProductForm } from "components/SellerDashboard/productEdit/helpers";

const prefill = (over: Partial<AiPrefill["suggestion"]> = {}): AiPrefill => ({
  suggestion: {
    title: "White Silk Robe",
    description: "A soft robe.\n\nIt has a belt.",
    brand_id: 2,
    category_id: 1,
    sub_category_id: 15,
    sub_sub_category_id: 33,
    ...over,
  },
  image: { name: "a1b2c3.jpg", url: "blob:preview", isNew: true },
});

afterEach(() => {
  clearAiPrefill("12");
  clearAiPrefill("99");
});

describe("applyAiSuggestion", () => {
  it("maps the six fields and the photo onto an empty form, escaping the description into paragraphs (AC-10)", () => {
    const form = applyAiSuggestion(emptyProductForm(), prefill());

    expect(form.name, "the title did not go into Name").toBe("White Silk Robe");
    expect(form.description, "the description is not two escaped paragraphs").toBe(
      "<p>A soft robe.</p><p>It has a belt.</p>",
    );
    expect(form.brand_id, "the brand is not selected as the select's string value").toBe("2");
    expect(form.category_id, "the category is not one selected chip").toEqual([1]);
    expect(form.sub_category_id, "the sub-category is not one selected chip").toEqual([15]);
    expect(form.sub_sub_category_id, "the sub-sub-category is not one selected chip").toEqual([33]);
    expect(form.images, "the uploaded photo is not the first product image").toEqual([
      { name: "a1b2c3.jpg", url: "blob:preview", isNew: true },
    ]);
    expect(form.unit, "a field the AI does not fill was changed").toBe(emptyProductForm().unit);
  });

  it("leaves every field the AI left empty empty", () => {
    const form = applyAiSuggestion(
      emptyProductForm(),
      prefill({
        title: null,
        description: null,
        brand_id: null,
        category_id: null,
        sub_category_id: null,
        sub_sub_category_id: null,
      }),
    );

    expect(form.name, "an empty title filled Name").toBe("");
    expect(form.description, "an empty description filled Description").toBe("");
    expect(form.brand_id, "an empty brand selected a brand").toBe("");
    expect(form.category_id, "an empty category selected a chip").toEqual([]);
    expect(form.images.length, "the photo was lost when the AI found nothing").toBe(1);
  });

  it("never lets markup from the AI render as markup", () => {
    const html = descriptionToHtml('<script>alert(1)</script> <img src=x onerror="alert(2)">');

    expect(html, "a script tag survived").not.toContain("<script");
    expect(html, "an image tag survived").not.toContain("<img");
    expect(html, "the text was not escaped").toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt; &lt;img src=x onerror=&quot;alert(2)&quot;&gt;</p>",
    );
  });
});

describe("the one-shot hand-off", () => {
  it("gives the hand-off only to its own shop, and nothing after it is cleared (AC-12)", () => {
    setAiPrefill("12", prefill());

    expect(peekAiPrefill("99"), "another shop received the hand-off").toBeNull();
    expect(peekAiPrefill("12"), "the shop that asked did not receive it").toEqual(prefill());
    expect(peekAiPrefill("12"), "peeking consumed the hand-off").toEqual(prefill());

    clearAiPrefill("99");
    expect(peekAiPrefill("12"), "clearing another shop removed this shop's hand-off").toEqual(prefill());

    clearAiPrefill("12");
    expect(peekAiPrefill("12"), "the hand-off survived its clear").toBeNull();
  });
});
