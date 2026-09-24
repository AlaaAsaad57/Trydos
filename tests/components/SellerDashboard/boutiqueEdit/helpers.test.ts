// The boutique editor's pure layer: the language list, the media filename
// rules, the GET -> form mapping, the form -> save payload mapping, field
// validation, and the icon / banner file checks.
//
// Everything here is a plain function with no network and no DOM, apart from
// `checkBannerFile`, which reads the picture's size. jsdom never loads a
// picture, so that one block supplies its own `Image` (see the note above it).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AVAILABILITY_LABEL_KEYS,
  DEFAULT_AVAILABILITY,
  FALLBACK_LANGUAGES,
  MAX_BANNER_MB,
  MAX_ICON_MB,
  buildFormFromEdit,
  buildUpdatePayload,
  checkBannerFile,
  checkIconFile,
  emptyBoutiqueForm,
  extractUploadedNames,
  fileNameOf,
  mapLanguages,
  validate,
  type BoutiqueForm,
  type Language,
} from "components/SellerDashboard/boutiqueEdit/helpers";

/** The four languages the editor normally runs with. */
const LANGS: Language[] = FALLBACK_LANGUAGES;

/** A translation that passes every rule in `validate`. */
const filledTranslation = (code: string) => ({
  language_code: code,
  name: `Shop ${code}`,
  description: `<p>About ${code}</p>`,
  bio: `Bio ${code}`,
  icon: "icon.webp",
  iconPreview: "https://example.com/boutiques/icon.webp",
  banners: [{ banner: "b1.webp", previewUrl: "https://example.com/b1.webp" }],
});

/** A complete form, so a test only has to change the one field it is about. */
function completeForm(codes = ["en", "ar"]): BoutiqueForm {
  const translations: BoutiqueForm["translations"] = {};
  for (const code of codes) translations[code] = filledTranslation(code);
  return {
    countries_iso: ["sy"],
    related_product_ids: [7],
    translations,
    status: 1,
    availability: 3,
  };
}

/* --------------------------------- languages -------------------------------- */

describe("mapLanguages", () => {
  it("reads the plain { data: { languages: [...] } } shape", () => {
    const langs = mapLanguages({
      data: { languages: [{ code: "EN", native_name: "English" }] },
    });
    expect(
      langs.map((l) => l.code),
      "the code should be lower-cased",
    ).toEqual(["en"]);
    expect(langs[0].label, "the native name should become the tab label").toBe(
      "English",
    );
  });

  it("accepts the other key names the backends use for a code", () => {
    const langs = mapLanguages([
      { language_code: "ar" },
      { iso: "tr" },
      { slug: "ku" },
    ]);
    expect(
      langs.map((l) => l.code),
      "language_code / iso / slug should all be read as the code",
    ).toEqual(["ar", "tr", "ku"]);
  });

  it("marks a language right-to-left from the API flag", () => {
    const [lang] = mapLanguages([{ code: "fr", direction: "RTL" }]);
    expect(lang.isRtl, "direction RTL should set isRtl on fr").toBe(true);
  });

  it("marks a known right-to-left code even when the API says nothing", () => {
    const [lang] = mapLanguages([{ code: "ar", name: "العربية" }]);
    expect(lang.isRtl, "ar should be right-to-left without an API flag").toBe(
      true,
    );
  });

  it("leaves a left-to-right language alone", () => {
    const [lang] = mapLanguages([{ code: "tr", name: "Türkçe" }]);
    expect(lang.isRtl, "tr should not be marked right-to-left").toBe(false);
  });

  it("drops entries with no code and de-dupes the rest in order", () => {
    const langs = mapLanguages([
      { code: "en" },
      { name: "no code here" },
      { code: "EN" },
      { code: "ar" },
    ]);
    expect(
      langs.map((l) => l.code),
      "a code-less entry should be dropped and en should appear once",
    ).toEqual(["en", "ar"]);
  });

  it("falls back to the built-in list when the response is not a list", () => {
    expect(
      mapLanguages({ message: "server error" }),
      "an unusable response should fall back to the built-in languages",
    ).toEqual(FALLBACK_LANGUAGES);
  });

  it("falls back to the built-in list when every entry is unusable", () => {
    expect(
      mapLanguages([{ name: "x" }, {}]),
      "a list with no codes should fall back to the built-in languages",
    ).toEqual(FALLBACK_LANGUAGES);
  });
});

/* ----------------------------------- media ---------------------------------- */

describe("fileNameOf", () => {
  it("keeps only the file itself, never the folder", () => {
    expect(
      fileNameOf("https://example.com/boutiques/boutiques/icon/a.webp"),
      "the backend wants the bare filename, not the folder path",
    ).toBe("a.webp");
  });

  it("drops a query string", () => {
    expect(
      fileNameOf("/boutiques/a.webp?v=2"),
      "a cache-busting query must not become part of the filename",
    ).toBe("a.webp");
  });

  it("leaves a bare filename untouched", () => {
    expect(fileNameOf("a.webp"), "a bare filename should pass through").toBe(
      "a.webp",
    );
  });

  it("returns an empty string for empty input", () => {
    expect(fileNameOf(""), "empty input should give an empty name").toBe("");
  });
});

describe("extractUploadedNames", () => {
  it("reads the { files: [...] } shape the media server answers with", () => {
    expect(
      extractUploadedNames({ files: ["boutiques/boutiques/one.webp"] }),
      "the media server's files list should give the bare filename",
    ).toEqual(["one.webp"]);
  });

  it("reads objects that carry the path under url / path / file_name", () => {
    expect(
      extractUploadedNames({
        data: [
          { url: "x/one.webp" },
          { path: "y/two.webp" },
          { file_name: "three.webp" },
        ],
      }),
      "url, path and file_name should each be read",
    ).toEqual(["one.webp", "two.webp", "three.webp"]);
  });

  it("reads a single { url } answer", () => {
    expect(
      extractUploadedNames({ url: "a/b/solo.webp" }),
      "a one-file answer should still give a list",
    ).toEqual(["solo.webp"]);
  });

  it("gives an empty list when the answer carries no files", () => {
    expect(
      extractUploadedNames({ message: "upload failed" }),
      "an answer with no files should give an empty list, not throw",
    ).toEqual([]);
  });
});

/* ------------------------------- form building ------------------------------ */

describe("emptyBoutiqueForm", () => {
  it("creates one blank translation per language", () => {
    const form = emptyBoutiqueForm(LANGS);
    for (const lang of LANGS) {
      expect(
        form.translations[lang.code],
        `the create form is missing the ${lang.code} translation`,
      ).toBeTruthy();
      expect(
        form.translations[lang.code].name,
        `the ${lang.code} name should start empty`,
      ).toBe("");
    }
  });

  it("starts inactive, so a half-written boutique is not live", () => {
    expect(
      emptyBoutiqueForm(LANGS).status,
      "a new boutique should start with status 0 (inactive)",
    ).toBe(0);
  });

  it("starts on the default availability", () => {
    expect(
      emptyBoutiqueForm(LANGS).availability,
      "a new boutique should start on Web + Mobile",
    ).toBe(DEFAULT_AVAILABILITY);
  });
});

describe("buildFormFromEdit", () => {
  const boutique = {
    status: 1,
    availability: 2,
    restricted_countries_iso: ["sy", "iq"],
    related_product_ids: [11, 12],
    translations: [
      {
        id: 90,
        language_code: "EN",
        name: "My Shop",
        description: "<p>hi</p>",
        bio: "bio",
        icon: "https://example.com/boutiques/icon/en.webp",
        banners: [
          { id: 2, banner: "https://example.com/b/second.webp", sequence: 2 },
          { id: 1, banner: "https://example.com/b/first.webp", sequence: 1 },
        ],
      },
    ],
  };

  it("matches a translation whatever case the backend used for the code", () => {
    const form = buildFormFromEdit(boutique, LANGS);
    expect(
      form.translations.en.name,
      "language_code EN should map onto the en tab",
    ).toBe("My Shop");
  });

  it("keeps the translation id, so saving updates instead of duplicating", () => {
    expect(
      buildFormFromEdit(boutique, LANGS).translations.en.id,
      "the existing translation id must survive the mapping",
    ).toBe(90);
  });

  it("splits the icon into a bare name to save and a URL to show", () => {
    const en = buildFormFromEdit(boutique, LANGS).translations.en;
    expect(en.icon, "the saved icon should be the bare filename").toBe(
      "en.webp",
    );
    expect(en.iconPreview, "the shown icon should stay the full URL").toBe(
      "https://example.com/boutiques/icon/en.webp",
    );
  });

  it("orders the banners by the stored sequence, not by list position", () => {
    const en = buildFormFromEdit(boutique, LANGS).translations.en;
    expect(
      en.banners.map((b) => b.banner),
      "banners should come back in sequence order (first, second)",
    ).toEqual(["first.webp", "second.webp"]);
  });

  it("gives a language with no stored translation a blank one", () => {
    const form = buildFormFromEdit(boutique, LANGS);
    expect(
      form.translations.ar,
      "every listed language needs a tab, even with nothing stored",
    ).toBeTruthy();
    expect(
      form.translations.ar.name,
      "the untranslated language should open empty",
    ).toBe("");
  });

  it("reads the restricted countries into the country picker", () => {
    expect(
      buildFormFromEdit(boutique, LANGS).countries_iso,
      "restricted_countries_iso should seed the country picker",
    ).toEqual(["sy", "iq"]);
  });

  it("keeps the availability the boutique was saved with", () => {
    expect(
      buildFormFromEdit(boutique, LANGS).availability,
      "availability 2 (Mobile) should be kept",
    ).toBe(2);
  });

  it("falls back to the default when the stored availability is unknown", () => {
    expect(
      buildFormFromEdit({ ...boutique, availability: 99 }, LANGS).availability,
      "availability 99 is not an option, so it should fall back to the default",
    ).toBe(DEFAULT_AVAILABILITY);
    expect(
      Object.keys(AVAILABILITY_LABEL_KEYS),
      "only 1, 2 and 3 are offered as availability options",
    ).toEqual(["1", "2", "3"]);
  });

  it("does not throw on an empty answer", () => {
    const form = buildFormFromEdit({}, LANGS);
    expect(
      form.countries_iso,
      "an empty boutique should give an empty country list",
    ).toEqual([]);
    expect(form.status, "an empty boutique should read as inactive").toBe(0);
  });
});

/* -------------------------------- save payload ------------------------------ */

describe("buildUpdatePayload", () => {
  it("puts the per-language content under custom_data on update", () => {
    const body = buildUpdatePayload(completeForm(), LANGS, "update") as any;
    expect(
      body.custom_data,
      "update expects the per-language content under custom_data",
    ).toBeTruthy();
    expect(
      body.boutique_custom_data,
      "update must not send boutique_custom_data",
    ).toBeUndefined();
  });

  it("puts the per-language content under boutique_custom_data on create", () => {
    const body = buildUpdatePayload(completeForm(), LANGS, "create") as any;
    expect(
      body.boutique_custom_data,
      "create expects boutique_custom_data — the wrong key silently drops every translation",
    ).toBeTruthy();
    expect(body.custom_data, "create must not send custom_data").toBeUndefined();
  });

  it("defaults to the update key when no mode is given", () => {
    const body = buildUpdatePayload(completeForm(), LANGS) as any;
    expect(
      body.custom_data,
      "with no mode the payload should be the update shape",
    ).toBeTruthy();
  });

  it("derives the global data from the English translation", () => {
    const form = completeForm(["en", "ar"]);
    form.translations.en.name = "English Name";
    form.translations.ar.name = "الاسم";
    const body = buildUpdatePayload(form, LANGS, "update") as any;
    expect(
      body.boutique_global_data.name,
      "boutique_global_data takes its name from the default (English) language",
    ).toBe("English Name");
  });

  it("carries the picked availability into the global data", () => {
    const form = completeForm();
    form.availability = 1;
    const body = buildUpdatePayload(form, LANGS, "update") as any;
    expect(
      body.boutique_global_data.availability,
      "the availability the seller picked should be saved",
    ).toBe(1);
  });

  it("numbers the banners from 1, in the order they are shown", () => {
    const form = completeForm(["en"]);
    form.translations.en.banners = [
      { banner: "a.webp", previewUrl: "" },
      { id: 5, banner: "b.webp", previewUrl: "" },
    ];
    const body = buildUpdatePayload(form, LANGS, "update") as any;
    const banners = body.custom_data[0].banners;
    expect(
      banners.map((b: any) => b.sequence),
      "the shown order should become sequence 1, 2",
    ).toEqual([1, 2]);
    expect(
      banners.map((b: any) => b.file_path),
      "the banner reference key sent to the backend is file_path",
    ).toEqual(["a.webp", "b.webp"]);
    expect(banners[0].id, "a new banner must not carry an id").toBeUndefined();
    expect(banners[1].id, "an existing banner keeps its id").toBe(5);
  });

  it("drops a language that was never filled in and has no stored row", () => {
    const form = completeForm(["en"]);
    form.translations.ar = {
      language_code: "ar",
      name: "",
      description: "",
      bio: "",
      icon: "",
      iconPreview: "",
      banners: [],
    };
    const body = buildUpdatePayload(form, LANGS, "update") as any;
    expect(
      body.custom_data.map((c: any) => c.language_code),
      "an empty, never-saved language should not be sent",
    ).toEqual(["en"]);
  });

  it("keeps a stored language whose name was cleared, so the backend can update it", () => {
    const form = completeForm(["en"]);
    form.translations.ar = {
      id: 42,
      language_code: "ar",
      name: "",
      description: "",
      bio: "",
      icon: "",
      iconPreview: "",
      banners: [],
    };
    const body = buildUpdatePayload(form, LANGS, "update") as any;
    expect(
      body.custom_data.map((c: any) => c.language_code),
      "a language with a stored id must still be sent, even with an empty name",
    ).toEqual(["en", "ar"]);
  });

  it("strips dangerous HTML out of both descriptions", () => {
    const form = completeForm(["en"]);
    form.translations.en.description =
      '<p>safe</p><script>alert(1)</script><img src=x onerror="alert(2)">';
    const body = buildUpdatePayload(form, LANGS, "update") as any;
    const pairs: [string, string][] = [
      ["the per-language description", body.custom_data[0].description],
      ["the global description", body.boutique_global_data.description],
    ];
    for (const [where, html] of pairs) {
      expect(html, `${where} should keep the safe markup`).toContain(
        "<p>safe</p>",
      );
      expect(html, `${where} still carries a script tag`).not.toContain(
        "<script",
      );
      expect(html, `${where} still carries an onerror handler`).not.toContain(
        "onerror",
      );
    }
  });
});

/* -------------------------------- validation -------------------------------- */

describe("validate", () => {
  it("passes a form where every language is complete", () => {
    expect(
      validate(completeForm(["en", "ar"])),
      "a fully filled form should report no errors",
    ).toEqual({});
  });

  it.each([
    ["name", "Name is required."],
    ["description", "Description is required."],
    ["bio", "Bio is required."],
    ["icon", "Icon is required."],
  ])(
    "reports a missing %s on the language that is missing it",
    (field, message) => {
      const form = completeForm(["en", "ar"]);
      (form.translations.ar as any)[field] = "   ";
      const errors = validate(form);
      expect(
        errors[`translations.ar.${field}`],
        `a blank ${field} on the ar tab should be reported against that tab`,
      ).toBe(message);
      expect(
        errors[`translations.en.${field}`],
        `the filled en ${field} must not be reported`,
      ).toBeUndefined();
    },
  );

  it("reports a language with no banner", () => {
    const form = completeForm(["en"]);
    form.translations.en.banners = [];
    expect(
      validate(form)["translations.en.banners"],
      "a language with no banner should be blocked before the save",
    ).toBe("At least one banner is required.");
  });

  it("reports every missing language, not just the first", () => {
    const form = completeForm(["en", "ar", "tr"]);
    form.translations.ar.name = "";
    form.translations.tr.bio = "";
    const errors = validate(form);
    expect(
      errors["translations.ar.name"],
      "the missing ar name should be reported",
    ).toBeTruthy();
    expect(
      errors["translations.tr.bio"],
      "the missing tr bio should be reported in the same pass",
    ).toBeTruthy();
  });
});

/* ------------------------------- file checks -------------------------------- */

/** A file of a given size and type, without holding that many bytes in memory. */
function fakeFile(name: string, type: string, sizeBytes: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
}

const MB = 1024 * 1024;

describe("checkIconFile", () => {
  it("accepts an ordinary image", () => {
    expect(
      checkIconFile(fakeFile("icon.png", "image/png", 200_000)).hardError,
      "a small PNG should be accepted as an icon",
    ).toBeUndefined();
  });

  it("blocks a file that is not an image", () => {
    expect(
      checkIconFile(fakeFile("notes.pdf", "application/pdf", 1000)).hardError,
      "a PDF should be blocked before it reaches the media server",
    ).toBe("Please choose an image file.");
  });

  it(`blocks an image over ${MAX_ICON_MB} MB`, () => {
    expect(
      checkIconFile(fakeFile("huge.png", "image/png", MAX_ICON_MB * MB + 1))
        .hardError,
      `an icon over ${MAX_ICON_MB} MB should be blocked`,
    ).toBe("Icon image must be 10 MB or smaller.");
  });

  it(`accepts an image exactly at ${MAX_ICON_MB} MB`, () => {
    expect(
      checkIconFile(fakeFile("edge.png", "image/png", MAX_ICON_MB * MB))
        .hardError,
      `exactly ${MAX_ICON_MB} MB is inside the limit, not over it`,
    ).toBeUndefined();
  });
});

/*
 * `checkBannerFile` reads the picture's real width and height. jsdom never
 * loads a picture, so a real `new Image()` would sit there with no `onload` and
 * the promise would never settle. The two stubs below stand in for the browser:
 * `createObjectURL` hands back a dummy URL, and the fake `Image` reports the
 * size this test asked for. Size is the only thing the test controls; the rest
 * behaves as the browser does.
 */
describe("checkBannerFile", () => {
  let nextSize: { width: number; height: number } | null = null;

  beforeEach(() => {
    nextSize = { width: 1280, height: 750 };
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: () => "blob:banner",
      revokeObjectURL: () => {},
    });
    vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 0;
        naturalHeight = 0;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          setTimeout(() => {
            if (!nextSize) {
              this.onerror?.();
              return;
            }
            this.naturalWidth = nextSize.width;
            this.naturalHeight = nextSize.height;
            this.onload?.();
          }, 0);
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("accepts the recommended 1280 x 750 banner with no warning", async () => {
    nextSize = { width: 1280, height: 750 };
    const check = await checkBannerFile(
      fakeFile("b.webp", "image/webp", 500_000),
    );
    expect(
      check.hardError,
      "the recommended size should not be blocked",
    ).toBeUndefined();
    expect(check.warning, "the recommended size should not warn").toBeUndefined();
  });

  it("blocks a file that is not an image", async () => {
    const check = await checkBannerFile(
      fakeFile("sheet.xlsx", "application/vnd.ms-excel", 1000),
    );
    expect(check.hardError, "a spreadsheet should be blocked as a banner").toBe(
      "Please choose an image file.",
    );
  });

  it(`blocks an image over ${MAX_BANNER_MB} MB`, async () => {
    const check = await checkBannerFile(
      fakeFile("huge.webp", "image/webp", MAX_BANNER_MB * MB + 1),
    );
    expect(
      check.hardError,
      `a banner over ${MAX_BANNER_MB} MB should be blocked`,
    ).toBe("Banner image must be 10 MB or smaller.");
  });

  it("warns, but does not block, a banner that is too narrow", async () => {
    nextSize = { width: 400, height: 250 };
    const check = await checkBannerFile(
      fakeFile("small.webp", "image/webp", 1000),
    );
    expect(
      check.hardError,
      "a low-resolution banner is a warning, not a block",
    ).toBeUndefined();
    expect(
      check.warning,
      "the warning should carry the real size so the seller can see it",
    ).toBe("400×250");
  });

  it("warns on a banner that is too square", async () => {
    nextSize = { width: 1200, height: 1200 };
    const check = await checkBannerFile(
      fakeFile("square.webp", "image/webp", 1000),
    );
    expect(
      check.warning,
      "a 1:1 banner is outside the 1.5-1.8 ratio and should warn",
    ).toBe("1200×1200");
  });

  it("warns on a banner that is too wide", async () => {
    nextSize = { width: 2400, height: 600 };
    const check = await checkBannerFile(
      fakeFile("wide.webp", "image/webp", 1000),
    );
    expect(
      check.warning,
      "a 4:1 banner is outside the 1.5-1.8 ratio and should warn",
    ).toBe("2400×600");
  });

  it("allows a picture whose size cannot be read", async () => {
    nextSize = null;
    const check = await checkBannerFile(
      fakeFile("odd.webp", "image/webp", 1000),
    );
    expect(
      check.hardError,
      "an unreadable picture should not be blocked",
    ).toBeUndefined();
    expect(
      check.warning,
      "an unreadable picture has no size to warn about",
    ).toBeUndefined();
  });
});
