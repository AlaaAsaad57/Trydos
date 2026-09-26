// The product editor's form sections (components/SellerDashboard/productEdit/sections.tsx).
//
// Each section is a controlled view over one ProductForm: it reads `form` and
// sends every change through `patch`. The harness below keeps a real form in
// state and merges each patch into it, the way ProductEditor does, so a test
// can type, click and then read both what was sent and what the seller now sees.
//
// Two neighbours are replaced:
//   - the TipTap editor, by a <textarea> with the same value/onChange API — it
//     has its own test file (tests/components/SellerDashboard/ui/RichTextEditor.test.tsx);
//   - the gallery picker modal, by two buttons that pick / close — it talks to
//     the media backend and is not what these sections decide.
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  Lookups,
  ProductForm,
} from "components/SellerDashboard/productEdit/helpers";
import { emptyProductForm } from "components/SellerDashboard/productEdit/helpers";
import {
  CategoriesSection,
  ClassificationSection,
  CoreSection,
  CountriesSection,
  DescriptorsSection,
  MediaSection,
  PricingSection,
  SeoSection,
  TranslationsSection,
  VariantsSection,
  VideosSection,
  type SectionProps,
} from "components/SellerDashboard/productEdit/sections";

import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
  within,
} from "../../../render";

const gallery = vi.hoisted(() => ({
  next: [] as { url: string; name: string }[],
}));

vi.mock("components/SellerDashboard/ui/RichTextEditor", () => ({
  RichTextEditor: ({
    value,
    onChange,
    disabled,
  }: {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
  }) => (
    <textarea
      data-testid="rte"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock("components/SellerDashboard/productEdit/GalleryPickerModal", () => ({
  default: ({
    multiple,
    onClose,
    onPick,
  }: {
    multiple: boolean;
    onClose: () => void;
    onPick: (p: { url: string; name: string }[]) => void;
  }) => (
    <div data-testid="gallery-picker" data-multiple={String(multiple)}>
      <button type="button" onClick={() => onPick(gallery.next)}>
        pick from gallery
      </button>
      <button type="button" onClick={onClose}>
        close picker
      </button>
    </div>
  ),
}));

const LOOKUPS: Lookups = {
  parent_categories: [
    { id: 1, name: "Women" },
    { id: 2, name: "Men", translated_name: "Hommes" },
  ],
  sub_categories: [{ id: 11, name: "Dresses" }],
  sub_sub_categories: [],
  boutiques: [{ id: 5, name: "Main Boutique" }],
  brands: [
    { id: 3, name: "Acme", translated_name: "Acme Local" },
    { id: 4, name: "Zeta" },
  ],
  colors: [
    { id: 1, code: "#FF0000", name: "Red", translated_name: "Rouge" },
    { id: 2, code: "#0000FF", name: "Blue" },
  ],
  sizes: [
    { id: 1, name: "S" },
    { id: 2, name: "XL" },
  ],
  countries: [
    { id: 1, iso: "SY", nicename: "Syria" },
    { id: 2, iso: "IQ", nicename: "Iraq" },
  ],
  labels: [
    { id: 1, label: "New" },
    { id: 2, label: "Hot", translated_label: "Sicak" },
    { id: 3, label: "Sale" },
    { id: 4, label: "Eco" },
  ],
  tags: [
    { id: 1, name: "summer" },
    { id: 2, name: "winter", translations: [{ value: "kis" }] },
    { id: 3, name: "plain", translated_name: "Beach" },
  ],
  locations: [{ id: 9, name: "Store", address: "Damascus" }],
  descriptor_groups: [
    {
      id: 1,
      name: "Leather",
      icon: "group.svg",
      descriptors: [
        {
          id: 10,
          name: "Luster",
          descriptor_group_id: 1,
          type: "string_choice",
          options: '["Glossy","Matte"]',
          icon: "https://cdn.example.com/luster.svg",
        },
        { id: 11, name: "Thickness", descriptor_group_id: 1, type: "numeric" },
      ],
    },
    {
      id: 2,
      name: "Hidden group",
      descriptors: [
        { id: 20, name: "No options", descriptor_group_id: 2, type: "string_choice" },
      ],
    },
  ],
  units: [],
  seller_product_ids: [],
};

let latest: ProductForm;
const patchSpy = vi.fn();

function Harness({
  Comp,
  initial,
  props,
}: {
  Comp: (p: SectionProps) => React.ReactNode;
  initial: ProductForm;
  props: Partial<SectionProps>;
}) {
  const [form, setForm] = useState(initial);
  useEffect(() => {
    latest = form;
  });
  const patch = (p: Partial<ProductForm>) => {
    patchSpy(p);
    setForm((f) => ({ ...f, ...p }));
  };
  return (
    <Comp
      form={form}
      patch={patch}
      errors={{}}
      lookups={LOOKUPS}
      disabled={false}
      sellerId="7"
      {...props}
    />
  );
}

async function mount(
  Comp: (p: SectionProps) => React.ReactNode,
  form: Partial<ProductForm> = {},
  props: Partial<SectionProps> = {},
) {
  return renderWithProviders(
    <Harness Comp={Comp} initial={{ ...emptyProductForm(), ...form }} props={props} />,
  );
}

const field = (container: HTMLElement, key: string) =>
  container.querySelector(`[data-field="${key}"]`) as HTMLElement;
const inputIn = (container: HTMLElement, key: string) =>
  field(container, key).querySelector("input") as HTMLInputElement;
/** The clickable box of a Select (the element with a tabIndex). */
const selectBox = (container: HTMLElement, key: string) =>
  field(container, key).querySelector("[tabindex]") as HTMLElement;

beforeEach(() => {
  patchSpy.mockClear();
  gallery.next = [];
});

/* --------------------------------- Core ---------------------------------- */

describe("CoreSection", () => {
  it("sends each typed value to the form under its own key", async () => {
    const { container } = await mount(CoreSection);

    fireEvent.change(inputIn(container, "name"), { target: { value: "Silk scarf" } });
    fireEvent.change(inputIn(container, "barcode"), { target: { value: "123" } });
    fireEvent.change(inputIn(container, "model_number"), { target: { value: "M-1" } });
    fireEvent.change(inputIn(container, "report_ref_number"), { target: { value: "R-9" } });
    fireEvent.change(inputIn(container, "seller_product_id"), {
      target: { value: "ab c" },
    });

    expect(latest.name, "the product name did not reach the form").toBe("Silk scarf");
    expect(latest.barcode, "the barcode did not reach the form").toBe("123");
    expect(latest.model_number, "the model number did not reach the form").toBe("M-1");
    expect(latest.report_ref_number, "the report ref did not reach the form").toBe("R-9");
    expect(
      latest.seller_product_id,
      "the seller product id must be cleaned (no spaces) before it reaches the form",
    ).not.toContain(" ");
  });

  it("picks the unit, brand, boutique and location from their drop-downs", async () => {
    const { container } = await mount(CoreSection);

    fireEvent.click(selectBox(container, "unit"));
    fireEvent.click(within(field(container, "unit")).getByText("kg"));
    expect(latest.unit, "choosing kg did not set the unit").toBe("kg");

    fireEvent.click(selectBox(container, "brand_id"));
    fireEvent.click(within(field(container, "brand_id")).getByText("Acme Local"));
    expect(latest.brand_id, "choosing a brand must store its id").toBe("3");

    fireEvent.click(selectBox(container, "boutique_id"));
    fireEvent.click(within(field(container, "boutique_id")).getByText("Main Boutique"));
    expect(latest.boutique_id, "choosing a boutique must store its id").toBe("5");

    fireEvent.click(selectBox(container, "location_id"));
    fireEvent.click(within(field(container, "location_id")).getByText("Store - Damascus"));
    expect(latest.location_id, "choosing a location must store its id").toBe("9");
  });

  it("writes the description from the rich-text editor and shows its error", async () => {
    await mount(CoreSection, {}, { errors: { description: "Too long" } });

    const rte = await screen.findByTestId("rte");
    fireEvent.change(rte, { target: { value: "<p>Soft</p>" } });

    expect(latest.description, "the editor text did not reach the form").toBe("<p>Soft</p>");
    expect(
      screen.getByText("Too long"),
      "the description error must be shown under the editor",
    ).toBeInTheDocument();
  });

  it("turns the two toggles into 1 and back into 0", async () => {
    await mount(CoreSection);
    const [multiply, packed] = screen
      .getAllByRole("button")
      .filter((b) => b.hasAttribute("aria-pressed"));

    fireEvent.click(multiply);
    fireEvent.click(packed);
    expect(latest.multiply_qty, "switching on 'multiply shipping' must store 1").toBe(1);
    expect(latest.packed_after_ordering, "switching on 'packed after ordering' must store 1").toBe(1);
    expect(multiply, "the toggle must show as pressed").toHaveAttribute("aria-pressed", "true");

    fireEvent.click(multiply);
    expect(latest.multiply_qty, "switching it off again must store 0").toBe(0);
  });
});

/* -------------------------------- Select --------------------------------- */

describe("Select drop-down (through CoreSection)", () => {
  it("opens by keyboard, filters by search, says when nothing matches, and closes on an outside click", async () => {
    const { container } = await mount(CoreSection, { brand_id: "4" });
    const box = selectBox(container, "brand_id");

    expect(box, "the chosen brand must be shown in the closed box").toHaveTextContent("Zeta");

    fireEvent.keyDown(box, { key: "a" });
    expect(
      within(field(container, "brand_id")).queryByPlaceholderText("Search..."),
      "a key other than Enter/Space must not open the list",
    ).toBeNull();

    fireEvent.keyDown(box, { key: "Enter" });
    const search = within(field(container, "brand_id")).getByPlaceholderText("Search...");
    await waitFor(() =>
      expect(document.activeElement, "the search box must take focus when the list opens").toBe(search),
    );

    fireEvent.click(search);
    fireEvent.change(search, { target: { value: "acm" } });
    const list = field(container, "brand_id").querySelector(".absolute.left-0") as HTMLElement;
    expect(
      within(list).queryByText("Zeta"),
      "a brand that does not match the search must be hidden",
    ).toBeNull();

    fireEvent.change(search, { target: { value: "nothing-like-this" } });
    expect(
      within(field(container, "brand_id")).getByText("No options found"),
      "an empty search result must say so",
    ).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(
      within(field(container, "brand_id")).queryByPlaceholderText("Search..."),
      "a click outside must close the list",
    ).toBeNull();

    fireEvent.mouseDown(box);
    fireEvent.keyDown(box, { key: " " });
    expect(
      within(field(container, "brand_id")).getByPlaceholderText("Search..."),
      "Space must open the list too, and a click inside must not close it",
    ).toBeInTheDocument();
  });

  it("clears the value when the seller picks the 'Select' row", async () => {
    const { container } = await mount(CoreSection, { brand_id: "4" });
    fireEvent.click(selectBox(container, "brand_id"));
    const rows = within(field(container, "brand_id")).getAllByText("Select");
    fireEvent.click(rows[rows.length - 1]);
    expect(latest.brand_id, "picking 'Select' must clear the brand").toBe("");
  });

  it("does not open when the form is in view mode", async () => {
    const { container } = await mount(CoreSection, {}, { disabled: true });
    const box = selectBox(container, "brand_id");
    fireEvent.click(box);
    fireEvent.keyDown(box, { key: "Enter" });
    expect(
      within(field(container, "brand_id")).queryByPlaceholderText("Search..."),
      "a locked drop-down must stay closed",
    ).toBeNull();
  });
});

/* -------------------------------- Pricing -------------------------------- */

describe("PricingSection", () => {
  it("sends every price and stock number, and refuses a negative one", async () => {
    const { container } = await mount(PricingSection, {}, { currency: "SYP" });

    const keys = [
      "unit_price",
      "discount_price",
      "purchase_price",
      "luck_price",
      "current_stock",
      "weight",
      "max_allowed_qty",
      "count_of_pieces",
      "shipping_cost",
      "shipping_days",
      "tax",
    ] as const;
    for (const k of keys) {
      fireEvent.change(inputIn(container, k), { target: { value: "5" } });
      expect(latest[k], `typing 5 into ${k} did not reach the form`).toBe("5");
    }

    fireEvent.change(inputIn(container, "unit_price"), { target: { value: "-1" } });
    expect(latest.unit_price, "a negative price must be refused").toBe("5");

    expect(
      within(field(container, "unit_price")).getByText("SYP"),
      "money inputs must carry the shop currency",
    ).toBeInTheDocument();
    expect(
      within(field(container, "tax")).getByText("%"),
      "a percent tax must show the % sign",
    ).toBeInTheDocument();

    fireEvent.click(selectBox(container, "tax_type"));
    fireEvent.click(within(field(container, "tax_type")).getByText("Flat"));
    expect(latest.tax_type, "choosing Flat did not set the tax type").toBe("flat");
    expect(
      within(field(container, "tax")).getByText("SYP"),
      "a flat tax is an amount, so it must show the currency",
    ).toBeInTheDocument();
  });

  it("hides every price but the purchase price for an unapproved seller", async () => {
    const { container } = await mount(PricingSection, {}, { pricesLocked: true });
    for (const k of ["unit_price", "discount_price", "luck_price", "shipping_cost", "tax", "tax_type"]) {
      expect(field(container, k), `${k} must not be shown when prices are locked`).toBeNull();
    }
    expect(field(container, "purchase_price"), "purchase price must stay").not.toBeNull();
  });

  it("locks the stock field when variants exist, because it is their total", async () => {
    const { container } = await mount(PricingSection, {
      colors: [{ code: "#FF0000", name: "Red" }],
    });
    expect(inputIn(container, "current_stock"), "stock must be locked with variants").toBeDisabled();
    expect(
      screen.getByText("Auto-calculated from variations"),
      "the stock hint must explain why it is locked",
    ).toBeInTheDocument();
  });
});

/* ------------------------------ Categories ------------------------------- */

describe("CategoriesSection", () => {
  it("toggles a category chip on and off", async () => {
    await mount(CategoriesSection);
    fireEvent.click(screen.getByRole("button", { name: "Hommes" }));
    expect(latest.category_id, "picking a main category must add its id").toEqual([2]);
    fireEvent.click(screen.getByRole("button", { name: "Hommes" }));
    expect(latest.category_id, "picking it again must remove it").toEqual([]);
  });

  it("filters by name or translated name and explains an empty group", async () => {
    await mount(CategoriesSection);
    expect(
      screen.getByText("No options available for the current selection."),
      "an empty sub-sub list must explain why it is empty",
    ).toBeInTheDocument();

    const [mainSearch] = screen.getAllByPlaceholderText("Search...");
    fireEvent.change(mainSearch, { target: { value: "homm" } });
    expect(screen.queryByRole("button", { name: "Women" }), "Women does not match 'homm'").toBeNull();
    expect(screen.getByRole("button", { name: "Hommes" }), "a translated name must match").toBeInTheDocument();

    fireEvent.change(mainSearch, { target: { value: "zzz" } });
    expect(screen.getByText("No matching options."), "no match must say so").toBeInTheDocument();

    const subSearch = screen.getAllByPlaceholderText("Search...")[1];
    fireEvent.change(subSearch, { target: { value: "dress" } });
    expect(screen.getByRole("button", { name: "Dresses" }), "the sub search must keep matches").toBeInTheDocument();
  });

  it("shows only the chosen categories in view mode, 'None' for an empty group, and the error", async () => {
    await mount(
      CategoriesSection,
      { category_id: [1] },
      { disabled: true, errors: { category_id: "Pick one" } },
    );
    expect(screen.getByRole("button", { name: "Women" }), "the chosen category must show").toBeDisabled();
    expect(screen.queryByRole("button", { name: "Hommes" }), "an unchosen one must not").toBeNull();
    expect(screen.getAllByText("None").length > 0, "an empty group must say None").toBe(true);
    expect(screen.getByText("Pick one"), "the category error must show").toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search..."), "view mode has no search").toBeNull();
  });

  it("covers the section with a loading layer while lookups load", async () => {
    await mount(CategoriesSection, {}, { busy: true });
    expect(screen.getByText("Loading…"), "busy must show the loading layer").toBeInTheDocument();
  });
});

/* ------------------------------ Descriptors ------------------------------ */

describe("DescriptorsSection", () => {
  it("sets a choice, clears it by picking it again, and sets / clears a number", async () => {
    const { container } = await mount(DescriptorsSection);

    expect(screen.queryByText("Hidden group"), "a group with no usable descriptor must be hidden").toBeNull();
    const imgs = Array.from(container.querySelectorAll("img")).map((i) => i.getAttribute("src"));
    expect(imgs, "the group icon must come from the media server folder").toContain(
      "https://example.com/descriptors/descriptor_groups/group.svg",
    );
    expect(imgs, "an absolute descriptor icon must be used as-is").toContain(
      "https://cdn.example.com/luster.svg",
    );

    fireEvent.click(screen.getByRole("button", { name: "Glossy" }));
    expect(latest.descriptor_values, "picking Glossy must store it").toEqual({ 10: "Glossy" });
    fireEvent.click(screen.getByRole("button", { name: "Glossy" }));
    expect(latest.descriptor_values, "picking Glossy again must remove the value").toEqual({});

    const num = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(num, { target: { value: "3" } });
    expect(latest.descriptor_values, "the number must be stored as text").toEqual({ 11: "3" });
    fireEvent.change(num, { target: { value: "" } });
    expect(latest.descriptor_values, "an emptied number must remove the key").toEqual({});
  });

  it("shows a free-text string descriptor as a text input and sets / clears its value", async () => {
    const lookups = {
      ...LOOKUPS,
      descriptor_groups: [
        {
          id: 398,
          name: "Smartphone",
          descriptors: [
            { id: 181, name: "RAM Capacity (GP)", descriptor_group_id: 398, type: "string", options: null as any },
          ],
        },
      ],
    };
    const { container } = await mount(DescriptorsSection, {}, { lookups });

    expect(
      screen.queryByText("RAM Capacity (GP)"),
      "the string descriptor (options: null) was hidden from the editor",
    ).toBeInTheDocument();
    const text = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(text, "the string descriptor has no text input to type its value in").not.toBeNull();

    fireEvent.change(text, { target: { value: "8 GB" } });
    expect(latest.descriptor_values, "the typed text must be stored for descriptor 181").toEqual({ 181: "8 GB" });
    fireEvent.change(text, { target: { value: "" } });
    expect(latest.descriptor_values, "emptied text must remove the key").toEqual({});
  });

  it("asks for a category when there are no attributes, and shows the loading layer", async () => {
    await renderWithProviders(
      <Harness
        Comp={DescriptorsSection}
        initial={emptyProductForm()}
        props={{ lookups: { ...LOOKUPS, descriptor_groups: undefined as any }, busy: true }}
      />,
    );
    expect(
      screen.getByText("Select a category to see its attributes."),
      "no attributes in edit mode must ask for a category",
    ).toBeInTheDocument();
    expect(screen.getByText("Loading…"), "busy must show the loading layer").toBeInTheDocument();
  });

  it("in view mode shows only valued descriptors, or None when nothing is set", async () => {
    const { unmount } = await mount(
      DescriptorsSection,
      { descriptor_values: { 10: "Matte" } },
      { disabled: true },
    );
    expect(screen.getByRole("button", { name: "Matte" }), "the chosen option must show").toBeDisabled();
    expect(screen.queryByText("Thickness"), "a descriptor without a value must be hidden").toBeNull();
    unmount();

    await mount(DescriptorsSection, {}, { disabled: true });
    expect(screen.getByText("None"), "no values at all must read None").toBeInTheDocument();
  });
});

/* ---------------------------- Labels and tags ---------------------------- */

describe("ClassificationSection", () => {
  it("adds labels up to three, then locks the rest; removes one again", async () => {
    await mount(ClassificationSection);
    fireEvent.click(screen.getByRole("button", { name: "New" }));
    fireEvent.click(screen.getByRole("button", { name: "Sicak" }));
    fireEvent.click(screen.getByRole("button", { name: "Sale" }));
    expect(latest.labels, "three labels must be stored").toEqual([1, 2, 3]);
    expect(screen.getByRole("button", { name: "Eco" }), "a fourth label must be locked").toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "New" }));
    expect(latest.labels, "clicking a chosen label must remove it").toEqual([2, 3]);
  });

  it("searches labels and tags by name, translation or nested translation", async () => {
    await mount(ClassificationSection);
    const [labelSearch, tagSearch] = screen.getAllByPlaceholderText("Search...");

    fireEvent.change(labelSearch, { target: { value: "sic" } });
    expect(screen.getByRole("button", { name: "Sicak" }), "translated label must match").toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "New" }), "other labels hidden").toBeNull();
    fireEvent.change(labelSearch, { target: { value: "zzz" } });
    expect(screen.getAllByText("No matching options.").length, "label search miss").toBe(1);

    fireEvent.change(tagSearch, { target: { value: "summ" } });
    expect(screen.getByRole("button", { name: "summer" }), "a tag must match by name").toBeInTheDocument();
  });

  it("finds a tag by its nested translation and by its translated name", async () => {
    await mount(ClassificationSection);
    const tagSearch = screen.getAllByPlaceholderText("Search...")[1];

    fireEvent.change(tagSearch, { target: { value: "kis" } });
    expect(screen.getByRole("button", { name: "kis" }), "nested translation must match").toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "summer" }), "summer must be hidden").toBeNull();

    fireEvent.change(tagSearch, { target: { value: "beach" } });
    fireEvent.click(screen.getByRole("button", { name: "Beach" }));
    expect(latest.tags_ids, "clicking a tag must add its id").toEqual([3]);

    fireEvent.change(tagSearch, { target: { value: "zzz" } });
    expect(screen.getByText("No matching options."), "tag search miss must say so").toBeInTheDocument();
  });

  it("in view mode shows only chosen labels and tags, None when empty, and the label error", async () => {
    await mount(ClassificationSection, { labels: [1], tags_ids: [] }, {
      disabled: true,
      errors: { labels: "Too many" },
    });
    expect(screen.getByRole("button", { name: "New" }), "the chosen label must show").toBeDisabled();
    expect(screen.getByText("None"), "no tags must read None").toBeInTheDocument();
    expect(screen.getByText("Too many"), "the label error must show").toBeInTheDocument();
  });

  it("reads None for both lists when the lookups are missing", async () => {
    await renderWithProviders(
      <Harness
        Comp={ClassificationSection}
        initial={emptyProductForm()}
        props={{ lookups: { ...LOOKUPS, labels: undefined as any, tags: undefined as any } }}
      />,
    );
    expect(screen.getAllByText("None").length, "both empty lists must read None").toBe(2);
  });
});

/* ------------------------------- Countries ------------------------------- */

describe("CountriesSection", () => {
  it("sets the country of origin from the flag list", async () => {
    const { container } = await mount(CountriesSection);
    fireEvent.click(selectBox(container, "origin_country_iso"));
    const search = within(field(container, "origin_country_iso")).getByPlaceholderText("Search...");
    fireEvent.change(search, { target: { value: "syria" } });
    fireEvent.click(within(field(container, "origin_country_iso")).getByText("Syria"));
    expect(latest.origin_country_iso, "picking Syria must store SY").toBe("SY");
    expect(
      selectBox(container, "origin_country_iso").querySelector("img"),
      "the chosen country must show its flag",
    ).not.toBeNull();
  });

  it("restricts to a country and adds, edits and removes a per-country surcharge", async () => {
    const { container } = await mount(CountriesSection, {}, { currency: "SYP" });

    fireEvent.click(screen.getByRole("button", { name: "Iraq" }));
    expect(latest.countries_iso, "picking Iraq must restrict to IQ").toEqual(["IQ"]);
    fireEvent.click(screen.getByRole("button", { name: "Iraq" }));
    expect(latest.countries_iso, "picking it again must remove IQ").toEqual([]);

    expect(screen.getByText("No per-country surcharges."), "empty list message").toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    const selects = container.querySelectorAll("select");
    fireEvent.change(selects[0], { target: { value: "SY" } });
    const prices = screen.getAllByPlaceholderText("Extra price");
    fireEvent.change(prices[0], { target: { value: "7" } });
    expect(latest.extra_price_for_country[0], "the first surcharge row must hold SY / 7").toEqual({
      country_iso: "SY",
      extra_price: "7",
    });
    expect(screen.getAllByText("SYP").length > 0, "the surcharge must carry the currency").toBe(true);

    const trash = container.querySelectorAll("button.shrink-0.w-\\[44px\\]");
    fireEvent.click(trash[1]);
    expect(latest.extra_price_for_country, "removing row 2 must keep only row 1").toEqual([
      { country_iso: "SY", extra_price: "7" },
    ]);
  });

  it("hides the surcharge block for an unapproved seller and the controls in view mode", async () => {
    const { unmount } = await mount(CountriesSection, {}, { pricesLocked: true });
    expect(screen.queryByText("Per-country Extra Price"), "locked prices hide surcharges").toBeNull();
    unmount();

    await mount(
      CountriesSection,
      { extra_price_for_country: [{ country_iso: "SY", extra_price: "1" }] },
      { disabled: true, lookups: { ...LOOKUPS, countries: undefined as any } },
    );
    expect(screen.queryByRole("button", { name: "Add" }), "view mode has no Add").toBeNull();
    expect(screen.getByPlaceholderText("Extra price"), "view mode inputs are locked").toBeDisabled();
  });
});

/* ---------------------------------- SEO ---------------------------------- */

describe("SeoSection", () => {
  it("sends the meta title and description", async () => {
    const { container } = await mount(SeoSection);
    fireEvent.change(inputIn(container, "meta_title"), { target: { value: "T" } });
    fireEvent.change(inputIn(container, "meta_description"), { target: { value: "D" } });
    expect([latest.meta_title, latest.meta_description], "meta text must reach the form").toEqual(["T", "D"]);
  });

  it("uploads a meta image from the device when there is no gallery", async () => {
    const onUploadMeta = vi.fn();
    const { container } = await mount(SeoSection, {}, { onUploadMeta });
    const file = new File(["x"], "meta.png", { type: "image/png" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    fireEvent.click(screen.getByRole("button", { name: /Upload Image/ }));
    expect(clickSpy, "the button must open the file picker").toHaveBeenCalled();

    fireEvent.change(input, { target: { files: [file] } });
    expect(onUploadMeta, "the chosen file must be uploaded").toHaveBeenCalledWith(file);

    fireEvent.change(input, { target: { files: [] } });
    expect(onUploadMeta, "no file chosen must upload nothing").toHaveBeenCalledTimes(1);
  });

  it("offers gallery or device, and a gallery pick becomes the meta image", async () => {
    gallery.next = [{ url: "https://example.com/g.png", name: "g.png" }];
    const { container } = await mount(SeoSection, {}, { canUseGallery: true });

    fireEvent.click(screen.getByRole("button", { name: /Add Image/ }));
    fireEvent.click(screen.getByRole("button", { name: /Choose from gallery/ }));
    expect(screen.getByTestId("gallery-picker"), "the picker must open").toHaveAttribute("data-multiple", "false");

    fireEvent.click(screen.getByRole("button", { name: "pick from gallery" }));
    expect([latest.meta_image, latest.meta_image_url], "the pick must set the meta image").toEqual([
      "g.png",
      "https://example.com/g.png",
    ]);
    expect(screen.getByAltText("Meta Image"), "the preview must show").toHaveAttribute("src", "https://example.com/g.png");
    expect(screen.getByRole("button", { name: /Change Image/ }), "the button must now say Change").toBeInTheDocument();

    gallery.next = [];
    fireEvent.click(screen.getByRole("button", { name: "pick from gallery" }));
    expect(latest.meta_image, "an empty pick must change nothing").toBe("g.png");
    fireEvent.click(screen.getByRole("button", { name: "close picker" }));
    expect(screen.queryByTestId("gallery-picker"), "close must hide the picker").toBeNull();

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    fireEvent.click(screen.getByRole("button", { name: /Change Image/ }));
    fireEvent.click(screen.getByRole("button", { name: /Upload from device/ }));
    expect(clickSpy, "Upload from device must open the file picker").toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Change Image/ }));
    fireEvent.click(container.querySelector(".fixed.inset-0") as HTMLElement);
    expect(screen.queryByRole("button", { name: /Choose from gallery/ }), "a backdrop click closes the menu").toBeNull();
  });

  it("shows 'Change Image' on the device button and hides it in view mode", async () => {
    const { unmount } = await mount(SeoSection, { meta_image: "m.png" });
    expect(screen.getByRole("button", { name: /Change Image/ }), "existing image -> Change").toBeInTheDocument();
    unmount();
    await mount(SeoSection, {}, { disabled: true });
    expect(screen.queryByRole("button", { name: /Image/ }), "view mode has no upload").toBeNull();
  });
});

/* --------------------------------- Media --------------------------------- */

const IMGS = [
  { name: "a.png", url: "https://example.com/a.png" },
  { name: "b.png", url: "https://example.com/b.png" },
];

describe("MediaSection", () => {
  it("marks the cover, moves an image and removes one from every color", async () => {
    const { container } = await mount(MediaSection, {
      images: IMGS,
      colorImages: { "#FF0000": ["a.png", "b.png"] },
    });
    expect(screen.getByText("Cover"), "the first image must be the cover").toBeInTheDocument();

    const tile = (name: string) => screen.getByAltText(name).parentElement as HTMLElement;
    const [left, right] = within(tile("a.png")).getAllByRole("button");
    expect(left, "the first image cannot move left").toBeDisabled();
    fireEvent.click(right);
    expect(latest.images.map((i) => i.name), "moving right must swap the order").toEqual(["b.png", "a.png"]);

    const trash = within(tile("a.png")).getAllByRole("button")[2];
    fireEvent.click(trash);
    expect(latest.images.map((i) => i.name), "removing must drop the image").toEqual(["b.png"]);
    expect(latest.colorImages, "removing must also drop it from the color lists").toEqual({
      "#FF0000": ["b.png"],
    });
  });

  it("ignores a move past either end", async () => {
    // A single image: both arrows are disabled in the UI, so call through
    // the enabled buttons of a two-image list at the ends instead.
    await mount(MediaSection, { images: IMGS });
    const tileB = screen.getByAltText("b.png").parentElement as HTMLElement;
    const [leftB, rightB] = within(tileB).getAllByRole("button");
    expect(rightB, "the last image cannot move right").toBeDisabled();
    // Force the handler anyway: a disabled button's click is swallowed by the
    // DOM, so remove the attribute to prove the guard itself.
    rightB.removeAttribute("disabled");
    fireEvent.click(rightB);
    expect(latest.images.map((i) => i.name), "a move past the end must change nothing").toEqual(["a.png", "b.png"]);
    fireEvent.click(leftB);
    expect(latest.images.map((i) => i.name), "moving left must swap").toEqual(["b.png", "a.png"]);
  });

  it("uploads files from the device and shows the uploading tile", async () => {
    const onUploadImages = vi.fn();
    const { container, unmount } = await mount(MediaSection, {}, { onUploadImages });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    fireEvent.click(screen.getByRole("button", { name: /Add/ }));
    expect(clickSpy, "the Add tile must open the file picker").toHaveBeenCalled();

    const f = new File(["x"], "c.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [f] } });
    expect(onUploadImages, "chosen files must be uploaded").toHaveBeenCalledWith([f]);
    fireEvent.change(input, { target: { files: null } });
    expect(onUploadImages, "no files must upload nothing").toHaveBeenCalledTimes(1);
    unmount();

    await mount(MediaSection, {}, { uploading: { images: true }, errors: { images: "Need one" } });
    expect(screen.getByText("Uploading…"), "the tile must say it is uploading").toBeInTheDocument();
    expect(screen.getByText("Need one"), "the images error must show").toBeInTheDocument();
  });

  it("adds only new gallery picks and ignores duplicates", async () => {
    gallery.next = [
      { name: "a.png", url: "https://example.com/a.png" },
      { name: "", url: "https://example.com/blank.png" },
      { name: "z.png", url: "https://example.com/z.png" },
    ];
    await mount(MediaSection, { images: [IMGS[0]] }, { canUseGallery: true });
    fireEvent.click(screen.getByRole("button", { name: /Add/ }));
    fireEvent.click(screen.getByRole("button", { name: /Choose from gallery/ }));
    expect(screen.getByTestId("gallery-picker"), "the picker allows many").toHaveAttribute("data-multiple", "true");
    fireEvent.click(screen.getByRole("button", { name: "pick from gallery" }));
    expect(latest.images, "only z.png is new").toEqual([
      IMGS[0],
      { name: "z.png", url: "https://example.com/z.png", isNew: true },
    ]);

    patchSpy.mockClear();
    gallery.next = [{ name: "z.png", url: "https://example.com/z.png" }];
    fireEvent.click(screen.getByRole("button", { name: "pick from gallery" }));
    expect(patchSpy, "a pick with nothing new must not patch").not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "close picker" }));
    expect(screen.queryByTestId("gallery-picker"), "close must hide the picker").toBeNull();
  });

  it("has no controls in view mode", async () => {
    await mount(MediaSection, { images: IMGS }, { disabled: true });
    expect(screen.queryAllByRole("button"), "view mode must have no buttons").toEqual([]);
  });
});

/* -------------------------------- Variants ------------------------------- */

describe("VariantsSection", () => {
  it("builds a row per color x size, seeds defaults, and totals the stock", async () => {
    const { container } = await mount(
      VariantsSection,
      { unit_price: "10" },
      { isCreate: true, currency: "SYP", errors: { variations: "Fix rows" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Rouge" }));
    fireEvent.click(screen.getByRole("button", { name: "S" }));

    await waitFor(() =>
      expect(latest.variations["Red-S"]?.price, "the row price must be seeded from the unit price").toBe("10"),
    );
    expect(latest.variations["Red-S"].sku, "a new row's SKU defaults to its key").toBe("Red-S");
    expect(screen.getByText("Red · S"), "the row must be labelled color · size").toBeInTheDocument();
    expect(screen.getByText("Fix rows"), "the variations error must show").toBeInTheDocument();

    const row = screen.getByText("Red · S").closest("tr") as HTMLElement;
    const inputs = within(row).getAllByRole("spinbutton");
    fireEvent.change(inputs[3], { target: { value: "4" } });
    await waitFor(() => expect(latest.current_stock, "stock must be the sum of variant qty").toBe("4"));
    fireEvent.change(inputs[3], { target: { value: "-2" } });
    expect(latest.variations["Red-S"].qty, "a negative qty must be refused").toBe("4");

    fireEvent.change(within(row).getByRole("combobox"), { target: { value: "9" } });
    expect(latest.variations["Red-S"].location_id, "the row location must be stored").toBe("9");
    expect(within(row).getAllByText("SYP").length, "the three money cells carry the currency").toBe(3);
  });

  it("flags duplicate SKUs and shows a server SKU error", async () => {
    await mount(
      VariantsSection,
      {
        colors: [{ code: "#FF0000", name: "Red" }, { code: "#0000FF", name: "Blue" }],
        variations: {
          Red: { price: "1", discount: "1", luck: "1", qty: "", sku: "same", barcode: "", location_id: "" },
          Blue: { price: "1", discount: "1", luck: "1", qty: "", sku: "SAME", barcode: "", location_id: "" },
        },
      },
      { errors: { variation_sku_Red: "Taken on the server" } },
    );
    expect(screen.getByText("Taken on the server"), "the server SKU error must win").toBeInTheDocument();
    expect(screen.getByText("SKU must be unique"), "the duplicate must be flagged").toBeInTheDocument();

    const blueRow = screen
      .getAllByText("Blue")
      .find((el) => el.tagName === "TD")!
      .closest("tr") as HTMLElement;
    const sku = within(blueRow).getAllByRole("textbox")[0];
    fireEvent.change(sku, { target: { value: "other" } });
    expect(latest.variations.Blue.sku, "typing a SKU must reach the form").toBe("other");
  });

  it("removes a color with its image list, removes a size, and assigns images to a color", async () => {
    await mount(VariantsSection, {
      images: IMGS,
      colors: [{ code: "#FF0000", name: "Red", translated_name: "Rouge" }],
      sizes: [{ id: 2, name: "XL" }],
      colorImages: { "#FF0000": [] },
    });

    const colorBlock = screen.getByText("Color Images").parentElement as HTMLElement;
    fireEvent.click(within(colorBlock).getByAltText("a.png").parentElement as HTMLElement);
    expect(latest.colorImages["#FF0000"], "clicking an image must assign it").toEqual(["a.png"]);
    fireEvent.click(within(colorBlock).getByAltText("a.png").parentElement as HTMLElement);
    expect(latest.colorImages["#FF0000"], "clicking again must unassign it").toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "XL" }));
    expect(latest.sizes, "clicking a chosen size must remove it").toEqual([]);

    const chips = screen.getAllByRole("button", { name: /Rouge/ });
    fireEvent.click(chips[0]);
    expect(latest.colors, "clicking a chosen color must remove it").toEqual([]);
    expect(latest.colorImages, "and drop its image list").toEqual({});
  });

  it("asks for images first, hides money columns when prices are locked, and searches", async () => {
    await mount(
      VariantsSection,
      { colors: [{ code: "#ABCDEF", name: "Custom" }] },
      { pricesLocked: true },
    );
    expect(screen.getByText("Upload images first."), "no images must say so").toBeInTheDocument();
    expect(screen.queryByText("Price"), "locked prices hide the Price column").toBeNull();

    const [colorSearch, sizeSearch] = screen.getAllByPlaceholderText("Search...");
    fireEvent.change(colorSearch, { target: { value: "#0000" } });
    expect(screen.getByRole("button", { name: "Blue" }), "a color must match by code").toBeInTheDocument();
    fireEvent.change(colorSearch, { target: { value: "roug" } });
    expect(screen.getByRole("button", { name: "Rouge" }), "a color must match by translation").toBeInTheDocument();
    fireEvent.change(colorSearch, { target: { value: "zzz" } });
    fireEvent.change(sizeSearch, { target: { value: "x" } });
    expect(screen.getByRole("button", { name: "XL" }), "a size must match by name").toBeInTheDocument();
    fireEvent.change(sizeSearch, { target: { value: "zzz" } });
    expect(screen.getAllByText("No matching options.").length, "both misses must say so").toBe(2);
  });

  it("in view mode shows only the chosen color and size and seeds nothing", async () => {
    await mount(
      VariantsSection,
      {
        colors: [{ code: "#FF0000", name: "Red" }],
        sizes: [{ id: 1, name: "S" }],
        unit_price: "10",
      },
      { disabled: true },
    );
    expect(patchSpy, "view mode must not seed or total anything").not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Blue" }), "unchosen colors are hidden").toBeNull();
    expect(screen.getByRole("button", { name: "S" }), "the chosen size shows").toBeDisabled();
  });

  it("reads None for empty color and size lookups", async () => {
    await renderWithProviders(
      <Harness
        Comp={VariantsSection}
        initial={emptyProductForm()}
        props={{ lookups: { ...LOOKUPS, colors: undefined as any, sizes: undefined as any, locations: undefined as any } }}
      />,
    );
    expect(screen.getAllByText("None").length, "both empty lists must read None").toBe(2);
  });

  it("shows a size-only row with an empty location list", async () => {
    await renderWithProviders(
      <Harness
        Comp={VariantsSection}
        initial={{ ...emptyProductForm(), sizes: [{ id: 1, name: "S" }] }}
        props={{ lookups: { ...LOOKUPS, locations: undefined as any } }}
      />,
    );
    const row = screen.getAllByText("S").find((el) => el.tagName === "TD")!.closest("tr") as HTMLElement;
    expect(within(row).getAllByRole("option").length, "only the Select option").toBe(1);
  });
});

/* ------------------------------ Translations ----------------------------- */

describe("TranslationsSection (create)", () => {
  it("fills the default-language name and description and copies them to the product", async () => {
    const { container } = await mount(TranslationsSection, {}, { isCreate: true, errors: { translations: "Need en" } });
    expect(screen.getByText("Need en"), "the translations error must show").toBeInTheDocument();

    fireEvent.change(container.querySelector('[data-field="translations"] input[type="text"]') as HTMLElement, {
      target: { value: "Scarf" },
    });
    expect(latest.name, "the first name typed must also become the product name").toBe("Scarf");
    expect(latest.translations, "an en row must be created").toEqual([
      { language_code: "en", name: "Scarf", description: "", similar_words: [] },
    ]);

    const rte = await screen.findByTestId("rte");
    fireEvent.change(rte, { target: { value: "<p>D</p>" } });
    expect(latest.description, "the first description must also become the product description").toBe("<p>D</p>");
    expect(latest.translations[0].description, "the en row must hold it").toBe("<p>D</p>");
  });

  it("does not overwrite an existing product name or description", async () => {
    const { container } = await mount(
      TranslationsSection,
      { name: "Kept", description: "Kept d", translations: [{ language_code: "en", name: "Kept", description: "Kept d", similar_words: [] }] },
      { isCreate: true },
    );
    fireEvent.change(container.querySelector('[data-field="translations"] input[type="text"]') as HTMLElement, {
      target: { value: "New" },
    });
    fireEvent.change(await screen.findByTestId("rte"), { target: { value: "New d" } });
    expect([latest.name, latest.description], "existing product text must stay").toEqual(["Kept", "Kept d"]);
    expect(latest.translations[0].name, "the translation must still change").toBe("New");
  });

  it("switches the default language, reusing a row that exists or starting a new one", async () => {
    const { container } = await mount(
      TranslationsSection,
      {
        name: "N",
        default_language_code: "xx",
        translations: [{ language_code: "tr", name: "Atki", description: "", similar_words: [] }],
      },
      { isCreate: true },
    );
    expect(screen.getByText("English"), "an unknown default falls back to English").toBeInTheDocument();

    const box = container.querySelector('[data-field="translations"] [tabindex]') as HTMLElement;
    fireEvent.click(box);
    fireEvent.click(screen.getByText("Türkçe (tr)"));
    expect(latest.default_language_code, "the default language must change").toBe("tr");
    expect(latest.translations, "the tr row must be reused").toEqual([
      { language_code: "tr", name: "Atki", description: "", similar_words: [] },
    ]);

    fireEvent.click(box);
    fireEvent.click(screen.getByText("Kurdî (ku)"));
    expect(latest.translations, "a new ku row starts from the product name").toEqual([
      { language_code: "ku", name: "N", description: "", similar_words: [] },
    ]);
  });

  it("adds similar words by button and Enter, skips a repeat, and removes one", async () => {
    const { container } = await mount(TranslationsSection, {}, { isCreate: true });
    const input = screen.getByPlaceholderText("Type a word and press Enter");

    fireEvent.change(input, { target: { value: "  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(patchSpy, "a blank word must be ignored").not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "wrap" } });
    fireEvent.click(within(field(container, "similar_words")).getByRole("button", { name: "Add" }));
    fireEvent.change(input, { target: { value: "shawl" } });
    fireEvent.keyDown(input, { key: "a" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(latest.translations[0].similar_words, "both words must be stored").toEqual(["wrap", "shawl"]);

    patchSpy.mockClear();
    fireEvent.change(input, { target: { value: "wrap" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(patchSpy, "a repeated word must not be added").not.toHaveBeenCalled();
    expect((input as HTMLInputElement).value, "the box must clear anyway").toBe("");

    fireEvent.click(within(field(container, "similar_words")).getAllByRole("button", { name: "✕" })[0]);
    expect(latest.translations[0].similar_words, "removing must drop wrap").toEqual(["shawl"]);
  });
});

describe("TranslationsSection (edit)", () => {
  it("shows all four languages and writes into existing or new rows", async () => {
    const { container } = await mount(TranslationsSection, {
      translations: [{ language_code: "en", name: "Scarf", description: "", similar_words: undefined as any }],
    });
    for (const l of ["English", "العربية", "Türkçe", "Kurdî"]) {
      expect(screen.getByText(l), `the ${l} block must show`).toBeInTheDocument();
    }
    const nameInputs = container.querySelectorAll('[data-field="translations"] > div > div input[type="text"]');
    fireEvent.change(nameInputs[0], { target: { value: "Scarf 2" } });
    expect(latest.translations[0].name, "the en name must change in place").toBe("Scarf 2");

    const rtes = await screen.findAllByTestId("rte");
    fireEvent.change(rtes[1], { target: { value: "<p>ar</p>" } });
    expect(latest.translations.find((t) => t.language_code === "ar"), "a new ar row must be added").toEqual({
      language_code: "ar",
      name: "",
      description: "<p>ar</p>",
      similar_words: [],
    });

    const words = screen.getAllByPlaceholderText("Type a word and press Enter");
    fireEvent.change(words[2], { target: { value: "atki" } });
    fireEvent.keyDown(words[2], { key: "Enter" });
    expect(latest.translations.find((t) => t.language_code === "tr")?.similar_words, "tr words").toEqual(["atki"]);
  });

  it("has no word controls in view mode", async () => {
    await mount(
      TranslationsSection,
      { translations: [{ language_code: "en", name: "S", description: "", similar_words: ["w"] }] },
      { disabled: true },
    );
    expect(screen.queryByPlaceholderText("Type a word and press Enter"), "view mode has no word box").toBeNull();
    expect(screen.queryByRole("button", { name: "✕" }), "view mode cannot remove words").toBeNull();
    expect(screen.getByText("w"), "the word itself still shows").toBeInTheDocument();
  });
});

/* --------------------------------- Videos -------------------------------- */

describe("VideosSection", () => {
  it("marks an existing video for removal and keeps it again", async () => {
    await mount(VideosSection, { existing_videos: ["https://example.com/v/clip.mp4"] });
    expect(screen.getByText("clip.mp4"), "the file name must show").toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(latest.remove_videos, "Remove must mark it").toEqual(["https://example.com/v/clip.mp4"]);
    fireEvent.click(screen.getByRole("button", { name: "Keep" }));
    expect(latest.remove_videos, "Keep must unmark it").toEqual([]);
  });

  it("drops a freshly uploaded video and uploads a new one", async () => {
    const onUploadVideo = vi.fn();
    const { container } = await mount(VideosSection, { cloud_video: "new.mp4" }, { onUploadVideo, uploading: { video: false } });
    expect(screen.getByText(/New video ready/), "the new video must show").toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(latest.cloud_video, "Remove must drop the new video").toBe("");
    expect(screen.getByText("No video attached."), "then nothing is attached").toBeInTheDocument();

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    fireEvent.click(screen.getByRole("button", { name: /Upload Video/ }));
    expect(clickSpy, "Upload Video must open the file picker").toHaveBeenCalled();
    const f = new File(["x"], "v.mp4", { type: "video/mp4" });
    fireEvent.change(input, { target: { files: [f] } });
    expect(onUploadVideo, "the file must be uploaded").toHaveBeenCalledWith(f);
    fireEvent.change(input, { target: { files: [] } });
    expect(onUploadVideo, "no file must upload nothing").toHaveBeenCalledTimes(1);
  });

  it("has no buttons in view mode", async () => {
    await mount(VideosSection, { existing_videos: ["a/b.mp4"], cloud_video: "c.mp4" }, { disabled: true });
    expect(screen.queryAllByRole("button"), "view mode must have no buttons").toEqual([]);
  });
});
