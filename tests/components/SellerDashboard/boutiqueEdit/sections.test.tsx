/**
 * The three form sections of the boutique editor: availability, restricted
 * countries and the per-language translations (name, icon, description, bio,
 * banners). BoutiqueEditor.test.tsx replaces these sections with a stand-in, so
 * this file is where what the seller sees and what each control reports back
 * is checked.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AvailabilitySection,
  CountriesSection,
  TranslationsSection,
  type SectionProps,
} from "components/SellerDashboard/boutiqueEdit/sections";
import type { TranslationForm } from "components/SellerDashboard/boutiqueEdit/helpers";

import { fireEvent, renderWithProviders, screen, waitFor } from "../../../render";

// The description field is a lazy TipTap editor. The stand-in for next/dynamic
// runs the real loader (so the import path is proved) and shows the loading
// skeleton until it resolves; the editor itself is a plain textarea.
vi.mock("next/dynamic", async () => {
  const React = await import("react");
  return {
    default: (loader: () => Promise<any>, options: any) =>
      function Dyn(props: any) {
        const [C, setC] = React.useState<any>(null);
        React.useEffect(() => {
          loader().then((c) => setC(() => c));
        }, []);
        return C ? React.createElement(C, props) : options.loading();
      },
  };
});

vi.mock("components/SellerDashboard/ui/RichTextEditor", async () => {
  const React = await import("react");
  return {
    RichTextEditor: ({ value, onChange, disabled }: any) =>
      React.createElement("textarea", {
        "aria-label": "rich description",
        value,
        disabled,
        onChange: (e: any) => onChange(e.target.value),
      }),
  };
});

const tr = (over: Partial<TranslationForm> = {}): TranslationForm => ({
  language_code: "en",
  name: "",
  description: "",
  bio: "",
  icon: "",
  iconPreview: "",
  banners: [],
  ...over,
});

const makeProps = (over: Partial<SectionProps> = {}): SectionProps => ({
  form: {
    countries_iso: ["SY"],
    related_product_ids: [],
    status: 1,
    availability: 3,
    translations: {
      en: tr({
        name: "Shop",
        bio: "Bio",
        description: "<p>D</p>",
        iconPreview: "https://example.com/icon.png",
        banners: [
          { id: 1, banner: "b1.jpg", previewUrl: "https://example.com/b1.jpg" },
          { banner: "b2.jpg", previewUrl: "https://example.com/b2.jpg", isNew: true },
        ],
      }),
      ar: tr({
        language_code: "ar",
        name: "متجر",
        bio: "نبذة",
        description: "وصف",
        icon: "i.png",
        banners: [{ banner: "a.jpg", previewUrl: "https://example.com/a.jpg" }],
      }),
      tr: tr({ language_code: "tr" }),
    },
  },
  patch: vi.fn(),
  patchTranslation: vi.fn(),
  errors: {},
  lookups: { countries: [] },
  languages: [
    { code: "en", label: "English", isRtl: false },
    { code: "ar", label: "العربية", isRtl: true },
    { code: "tr", label: "Türkçe", isRtl: false },
    { code: "ku", label: "کوردی", isRtl: true },
  ],
  disabled: false,
  activeLang: "en",
  setActiveLang: vi.fn(),
  onUploadIcon: vi.fn(async () => {}),
  onAddBanners: vi.fn(async () => {}),
  onRemoveBanner: vi.fn(),
  onMoveBanner: vi.fn(),
  onCopyField: vi.fn(),
  uploading: {},
  shakeTick: 0,
  ...over,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AvailabilitySection", () => {
  it("offers only the known availabilities from the lookups and reports the pick", async () => {
    const props = makeProps({
      lookups: { countries: [], availabilities: [{ value: 1, label: "Web" }, { value: 2, label: "Mobile" }, { value: 9, label: "Moon" }] },
    });
    const { container } = await renderWithProviders(<AvailabilitySection {...props} />);
    const select = container.querySelector("select")!;

    expect(
      Array.from(select.options).map((o) => o.textContent),
      "an unknown availability from the backend was offered",
    ).toEqual(["Web", "Mobile"]);

    fireEvent.change(select, { target: { value: "2" } });
    expect(props.patch, "picking Mobile did not reach the form").toHaveBeenCalledWith({ availability: 2 });
  });

  it("falls back to the three built-in options and greys out when locked", async () => {
    const { container } = await renderWithProviders(<AvailabilitySection {...makeProps({ disabled: true })} />);
    const select = container.querySelector("select")!;

    expect(Array.from(select.options).map((o) => o.textContent), "the fallback options are wrong").toEqual([
      "Web",
      "Mobile",
      "Web + Mobile",
    ]);
    expect(select.disabled, "the locked select can still be changed").toBe(true);
    expect(select.className, "the locked select is not greyed out").toContain("opacity-70");
  });
});

describe("CountriesSection", () => {
  it("says so when there are no countries to pick", async () => {
    await renderWithProviders(<CountriesSection {...makeProps()} />);
    expect(screen.getByText("No Countries Available."), "the empty country list says nothing").toBeInTheDocument();
  });

  it("adds and removes a country when its chip is clicked", async () => {
    const props = makeProps({
      lookups: { countries: [{ iso: "SY", name: "Syria" }, { iso: "IQ", name: "Iraq" }] },
    });
    await renderWithProviders(<CountriesSection {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Syria" }));
    expect(props.patch, "clicking a selected country did not remove it").toHaveBeenLastCalledWith({ countries_iso: [] });

    fireEvent.click(screen.getByRole("button", { name: "Iraq" }));
    expect(props.patch, "clicking a free country did not add it").toHaveBeenLastCalledWith({ countries_iso: ["SY", "IQ"] });
  });

  it("locks the chips when the form is locked", async () => {
    await renderWithProviders(
      <CountriesSection {...makeProps({ disabled: true, lookups: { countries: [{ iso: "IQ", name: "Iraq" }] } })} />,
    );
    const chip = screen.getByRole("button", { name: "Iraq" });
    expect(chip, "a locked chip can still be clicked").toBeDisabled();
    expect(chip.className, "a locked, unselected chip is not faded").toContain("opacity-60");
  });
});

describe("TranslationsSection", () => {
  it("renders nothing for a language that has no translation row", async () => {
    const { container } = await renderWithProviders(<TranslationsSection {...makeProps({ activeLang: "ku" })} />);
    expect(container.innerHTML, "a language with no row still rendered a form").toBe("");
  });

  it("edits the active language's name, bio and description", async () => {
    const props = makeProps();
    const { container } = await renderWithProviders(<TranslationsSection {...props} />);

    fireEvent.change(container.querySelector('input[type="text"]')!, { target: { value: "New" } });
    expect(props.patchTranslation, "typing a name did not reach the form").toHaveBeenCalledWith("en", { name: "New" });

    fireEvent.change(container.querySelector('textarea[rows="3"]')!, { target: { value: "B2" } });
    expect(props.patchTranslation, "typing a bio did not reach the form").toHaveBeenCalledWith("en", { bio: "B2" });

    const rich = await screen.findByLabelText("rich description");
    fireEvent.change(rich, { target: { value: "<p>X</p>" } });
    expect(props.patchTranslation, "editing the description did not reach the form").toHaveBeenCalledWith("en", {
      description: "<p>X</p>",
    });
  });

  it("switches language from the tabs", async () => {
    const props = makeProps();
    await renderWithProviders(<TranslationsSection {...props} />);
    fireEvent.click(screen.getByRole("tab", { name: "Türkçe" }));
    expect(props.setActiveLang, "the language tab did not switch").toHaveBeenCalledWith("tr");
  });

  it("offers to copy each field only from languages where it is filled", async () => {
    const props = makeProps();
    await renderWithProviders(<TranslationsSection {...props} />);
    const selects = screen.getAllByTitle("Copy from another language") as HTMLSelectElement[];

    expect(
      selects.map((s) => Array.from(s.options).map((o) => o.value)),
      "a copy source was offered for an empty or missing language",
    ).toEqual([
      ["", "ar"],
      ["", "ar"],
      ["", "ar"],
      ["", "ar"],
      ["", "ar"],
    ]);

    fireEvent.change(selects[0], { target: { value: "" } });
    expect(props.onCopyField, "choosing the placeholder copied something").not.toHaveBeenCalled();

    fireEvent.change(selects[4], { target: { value: "ar" } });
    expect(props.onCopyField, "copying the banners from Arabic did not reach the editor").toHaveBeenCalledWith("banners", "ar");
    expect(selects[4].value, "the copy select did not reset to its placeholder").toBe("");
  });

  it("offers every filled language as a copy source to an empty language", async () => {
    await renderWithProviders(<TranslationsSection {...makeProps({ activeLang: "tr" })} />);
    const selects = screen.getAllByTitle("Copy from another language") as HTMLSelectElement[];
    expect(
      selects.map((s) => Array.from(s.options).map((o) => o.value)),
      "the empty Turkish row was offered as a copy source",
    ).toEqual([
      ["", "en", "ar"],
      ["", "en", "ar"],
      ["", "en", "ar"],
      ["", "en", "ar"],
      ["", "en", "ar"],
    ]);
  });

  it("shows each field's error for the active language and shakes on a failed save", async () => {
    const errors = {
      "translations.en.name": "Name Is Required",
      "translations.en.icon": "Icon Is Required",
      "translations.en.description": "Description Is Required",
      "translations.en.bio": "Bio is required",
      "translations.en.banners": "At least one banner is required",
      "translations.ar.name": "not this one",
    };
    const { container } = await renderWithProviders(<TranslationsSection {...makeProps({ errors, shakeTick: 2 })} />);

    for (const message of Object.values(errors).slice(0, 5)) {
      expect(screen.getByText(message), `the error "${message}" is not shown`).toBeInTheDocument();
    }
    expect(screen.queryByText("not this one"), "another language's error was shown").toBeNull();
    expect(container.querySelectorAll(".shake-anim").length, "not every failing field shakes").toBe(5);
    expect(container.querySelector('input[type="text"]')!.className, "the failing name box is not red").toContain(
      "border-[#f85555]",
    );
    expect(container.querySelector('textarea[rows="3"]')!.className, "the failing bio box is not red").toContain(
      "border-[#f85555]",
    );
  });

  it("shows the icon preview and uploads a picked icon file", async () => {
    const props = makeProps();
    const { container } = await renderWithProviders(<TranslationsSection {...props} />);
    expect(screen.getByAltText("Boutique Icon"), "the icon preview is missing").toHaveAttribute(
      "src",
      "https://example.com/icon.png",
    );

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: /Upload Icon/ }));
    expect(clickSpy, "the Upload icon button did not open the file picker").toHaveBeenCalled();

    const [iconInput, bannerInput] = Array.from(container.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
    const file = new File(["x"], "icon.png", { type: "image/png" });
    fireEvent.change(iconInput, { target: { files: [file] } });
    expect(props.onUploadIcon, "the picked icon was not uploaded").toHaveBeenCalledWith("en", file);

    fireEvent.change(iconInput, { target: { files: [] } });
    expect(props.onUploadIcon, "an empty pick still uploaded an icon").toHaveBeenCalledTimes(1);

    fireEvent.change(bannerInput, { target: { files: [file, file] } });
    expect(props.onAddBanners, "the picked banners were not added").toHaveBeenCalledWith("en", [file, file]);
    fireEvent.change(bannerInput, { target: { files: null } });
    expect(props.onAddBanners, "an empty pick still added banners").toHaveBeenCalledTimes(1);
  });

  it("shows a placeholder icon when there is no preview", async () => {
    await renderWithProviders(<TranslationsSection {...makeProps({ activeLang: "tr" })} />);
    expect(screen.queryByAltText("Boutique Icon"), "a preview was shown for a row with no icon").toBeNull();
  });

  it("moves, removes and adds banners", async () => {
    const props = makeProps();
    await renderWithProviders(<TranslationsSection {...props} />);

    const left = screen.getAllByRole("button", { name: "Move Left" });
    const right = screen.getAllByRole("button", { name: "Move Right" });
    expect(left[0], "the first banner can move further left").toBeDisabled();
    expect(right[1], "the last banner can move further right").toBeDisabled();

    fireEvent.click(right[0]);
    expect(props.onMoveBanner, "moving the first banner right did not reach the editor").toHaveBeenCalledWith("en", 0, 1);
    fireEvent.click(left[1]);
    expect(props.onMoveBanner, "moving the second banner left did not reach the editor").toHaveBeenCalledWith("en", 1, -1);

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[1]);
    expect(props.onRemoveBanner, "deleting the second banner did not reach the editor").toHaveBeenCalledWith("en", 1);

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Add Banner" }));
    expect(clickSpy, "Add banner did not open the file picker").toHaveBeenCalled();
  });

  it("says a banner upload is running", async () => {
    await renderWithProviders(<TranslationsSection {...makeProps({ uploading: { banners: true, icon: true } })} />);
    expect(screen.getByText("Uploading…"), "a running banner upload says nothing").toBeInTheDocument();
    expect(screen.queryByText("Add Banner"), "the add button still invites a second upload").toBeNull();
  });

  it("hides every edit control when the form is locked", async () => {
    await renderWithProviders(<TranslationsSection {...makeProps({ disabled: true })} />);
    expect(screen.queryByTitle("Copy from another language"), "a locked form still offers to copy").toBeNull();
    expect(screen.queryByRole("button", { name: /Upload Icon/ }), "a locked form still offers an icon upload").toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" }), "a locked form still lets a banner be deleted").toBeNull();
    expect(screen.queryByRole("button", { name: "Add Banner" }), "a locked form still lets a banner be added").toBeNull();
    await waitFor(() =>
      expect(screen.getByLabelText("rich description"), "the locked description can still be edited").toBeDisabled(),
    );
  });
});
