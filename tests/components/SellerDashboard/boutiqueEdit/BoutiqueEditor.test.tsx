// The boutique editor of the seller dashboard (create and edit).
//
// The three form sections are replaced with a stand-in that only records the
// props the editor hands them. Every handler the editor owns (upload, copy,
// banner queue, move, remove) is then called straight from those props, and the
// test reads what the editor did with it: the service call, the toast, the
// header, the next props.
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const svc = vi.hoisted(() => ({
  getSellerPermissions: vi.fn(),
  getLanguages: vi.fn(),
  getBoutiqueCreateForm: vi.fn(),
  getBoutiqueForEdit: vi.fn(),
  uploadShopImage: vi.fn(),
  bulkUploadImages: vi.fn(),
  addBoutique: vi.fn(),
  updateBoutique: vi.fn(),
  changeBoutiqueStatus: vi.fn(),
  deleteBoutique: vi.fn(),
}));
vi.mock("services/sellerDashboard", () => ({ default: svc }));

const showErrorMessage = vi.fn();
const showSuccessMessage = vi.fn();
vi.mock("components/global/AddToCartMessage", () => ({
  showErrorMessage: (m: string) => showErrorMessage(m),
  showSuccessMessage: (m: string) => showSuccessMessage(m),
}));

const logError = vi.fn();
vi.mock("utils/functions", async (orig) => ({
  ...(await orig<typeof import("utils/functions")>()),
  LogError: (e: unknown) => logError(e),
}));

const profile: { sellerPermissions: string[]; setSellerPermissions: ReturnType<typeof vi.fn> } = {
  sellerPermissions: [],
  setSellerPermissions: vi.fn(),
};
vi.mock("app/(client)/[lang]/sellerProfile/SellerProfileContext", () => ({
  useSellerProfile: () => profile,
}));

const checkBannerFile = vi.fn();
vi.mock("components/SellerDashboard/boutiqueEdit/helpers", async (orig) => ({
  ...(await orig<typeof import("components/SellerDashboard/boutiqueEdit/helpers")>()),
  checkBannerFile: (f: File) => checkBannerFile(f),
}));

// The latest props the sections got from the editor.
let props: any = null;
vi.mock("components/SellerDashboard/boutiqueEdit/sections", () => ({
  AvailabilitySection: (p: any) => {
    props = p;
    return <div data-testid="availability" data-disabled={String(p.disabled)} />;
  },
  TranslationsSection: (p: any) => (
    <div data-testid="translations">
      {Object.values(p.form.translations).map((tr: any) => (
        <div key={tr.language_code} data-testid={`tr-${tr.language_code}`}>
          {`${tr.name}|${tr.icon}|${tr.banners.map((b: any) => b.banner).join(",")}`}
        </div>
      ))}
      <span data-testid="active-lang">{p.activeLang}</span>
    </div>
  ),
  CountriesSection: () => null,
}));

import BoutiqueEditor from "components/SellerDashboard/boutiqueEdit/BoutiqueEditor";

import { routerSpies } from "../../../mocks/nextNavigation";
import { renderWithProviders, screen, userEvent, waitFor } from "../../../render";

const SELLER = "77";
const LOCAL = "sy-en";
const DASH = `/${LOCAL}/sellerProfile/sellerDashboard/${SELLER}`;

const EN_ONLY = { data: [{ code: "en", name: "English" }] };
const EN_AR = { data: [{ code: "en", name: "English" }, { code: "ar", name: "Arabic" }] };

const fullTr = (code: string, over: Record<string, unknown> = {}) => ({
  id: code === "en" ? 11 : 12,
  language_code: code,
  name: `Name ${code}`,
  description: `<p>Desc ${code}</p>`,
  bio: `Bio ${code}`,
  icon: `https://example.com/boutiques/icon-${code}.webp`,
  banners: [
    { id: 1, banner: `https://example.com/boutiques/b1-${code}.webp`, sequence: 1 },
    { id: 2, banner: `https://example.com/boutiques/b2-${code}.webp`, sequence: 2 },
  ],
  ...over,
});

const editAnswer = (boutique: Record<string, unknown> = {}) => ({
  success: true,
  data: {
    boutique: {
      status: 1,
      availability: 3,
      translations: [fullTr("en"), fullTr("ar")],
      ...boutique,
    },
    lookups: { countries: [{ iso: "sy" }] },
  },
});

const img = (name = "pic.webp", type = "image/webp") =>
  new File(["x"], name, { type });

async function renderEdit(perms: string[] = ["UPDATE_BUTIKS", "CHANGE_BOUTIQUE_STATUS"]) {
  profile.sellerPermissions = perms;
  const r = await renderWithProviders(
    <BoutiqueEditor sellerId={SELLER} boutiqueId="9" local={LOCAL} />,
  );
  await screen.findByTestId("availability");
  return r;
}

async function renderCreate() {
  profile.sellerPermissions = ["SUPER_ADMIN"];
  const r = await renderWithProviders(
    <BoutiqueEditor sellerId={SELLER} local={LOCAL} mode="create" />,
  );
  await screen.findByTestId("availability");
  return r;
}

beforeEach(() => {
  vi.resetAllMocks();
  props = null;
  profile.sellerPermissions = ["UPDATE_BUTIKS"];
  svc.getLanguages.mockResolvedValue(EN_AR);
  svc.getBoutiqueForEdit.mockResolvedValue(editAnswer());
  svc.getBoutiqueCreateForm.mockResolvedValue({ success: true, data: { countries: [] } });
  svc.getSellerPermissions.mockResolvedValue({ data: [] });
  URL.createObjectURL = vi.fn(() => "blob:local");
});

describe("BoutiqueEditor — permissions for a deep link", () => {
  it("asks the core backend for the seller's permissions when the context has none, and stores them", async () => {
    profile.sellerPermissions = [];
    svc.getSellerPermissions.mockResolvedValue({
      data: [
        { seller_id: 1, permissions: ["OTHER"] },
        { seller_id: 77, permissions: ["UPDATE_BUTIKS"] },
      ],
    });
    await renderWithProviders(<BoutiqueEditor sellerId={SELLER} boutiqueId="9" local={LOCAL} />);
    await waitFor(() =>
      expect(profile.setSellerPermissions, "the seller 77 permissions were not stored").toHaveBeenCalledWith([
        "UPDATE_BUTIKS",
      ]),
    );
  });

  it("stores nothing when the permissions answer is not a list", async () => {
    profile.sellerPermissions = [];
    svc.getSellerPermissions.mockResolvedValue({ data: null });
    await renderWithProviders(<BoutiqueEditor sellerId={SELLER} boutiqueId="9" local={LOCAL} />);
    await screen.findByTestId("availability");
    expect(profile.setSellerPermissions, "permissions were stored from an empty answer").not.toHaveBeenCalled();
  });

  it("logs a refused permissions call under its own scenario", async () => {
    profile.sellerPermissions = [];
    svc.getSellerPermissions.mockRejectedValueOnce("down");
    await renderWithProviders(<BoutiqueEditor sellerId={SELLER} boutiqueId="9" local={LOCAL} />);
    await waitFor(() =>
      expect(logError, "the refused permissions call was not logged").toHaveBeenCalledWith({
        scenario: "BoutiqueEditor.getSellerPermissions",
        error: "down",
      }),
    );
  });

  it("logs an Error thrown by the permissions call with its message", async () => {
    profile.sellerPermissions = [];
    svc.getSellerPermissions.mockRejectedValueOnce(new Error("boom"));
    await renderWithProviders(<BoutiqueEditor sellerId={SELLER} boutiqueId="9" local={LOCAL} />);
    await waitFor(() =>
      expect(logError, "the Error message was not logged").toHaveBeenCalledWith({
        scenario: "BoutiqueEditor.getSellerPermissions",
        error: "boom",
      }),
    );
  });
});

describe("BoutiqueEditor — loading", () => {
  it("shows the boutique name, icon, Active pill and id once the edit form loads", async () => {
    const preloaded: string[] = [];
    const RealImage = window.Image;
    vi.stubGlobal(
      "Image",
      class {
        set src(v: string) {
          preloaded.push(v);
        }
      },
    );
    await renderEdit();
    vi.stubGlobal("Image", RealImage);
    expect(screen.getByRole("heading", { name: "Name en" }), "the boutique name is not the heading").toBeInTheDocument();
    expect(screen.getByAltText("Name en"), "the header does not show the boutique icon").toHaveAttribute(
      "src",
      "https://example.com/boutiques/icon-en.webp",
    );
    expect(screen.getByText("Active"), "an active boutique does not say Active").toBeInTheDocument();
    expect(screen.getByText("ID: 9"), "the boutique id is not shown").toBeInTheDocument();
    expect(preloaded, "the other language's banner was not warmed in the cache").toContain(
      "https://example.com/boutiques/b2-ar.webp",
    );
  });

  it("falls back to the built-in languages when the languages call fails, and to the first one when 'en' is missing", async () => {
    svc.getLanguages.mockRejectedValueOnce(new Error("no langs"));
    await renderEdit();
    expect(screen.getByTestId("tr-en"), "the built-in English tab is missing").toBeInTheDocument();

    svc.getLanguages.mockResolvedValueOnce({ data: [{ code: "ar", name: "Arabic" }] });
    await renderEdit();
    expect(screen.getAllByTestId("active-lang").at(-1), "the active tab is not the first language").toHaveTextContent("ar");
  });

  it("shows a nameless inactive boutique as 'Unnamed Boutique' / 'Inactive' with the placeholder icon", async () => {
    svc.getBoutiqueForEdit.mockResolvedValueOnce({
      success: true,
      data: { boutique: { status: 0, translations: [] } },
    });
    await renderEdit();
    expect(screen.getByRole("heading", { name: "Unnamed Boutique" }), "no fallback name").toBeInTheDocument();
    expect(screen.getByText("Inactive"), "an inactive boutique does not say Inactive").toBeInTheDocument();
  });

  it("shows 'Boutique Not Found.' with a retry that loads again", async () => {
    svc.getBoutiqueForEdit.mockResolvedValueOnce({ success: true, data: {} });
    await renderWithProviders(<BoutiqueEditor sellerId={SELLER} boutiqueId="9" local={LOCAL} />);
    expect(await screen.findByText("Boutique Not Found."), "the missing boutique is not reported").toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByTestId("availability"), "retry did not load the boutique").toBeInTheDocument();
    expect(logError, "the missing boutique was not logged").toHaveBeenCalledWith({
      scenario: "BoutiqueEditor.load",
      error: "Boutique Not Found.",
      boutiqueId: "9",
    });
  });

  it("shows the access-denied panel when the core backend refuses with 403", async () => {
    svc.getBoutiqueForEdit.mockRejectedValueOnce(new Error("403 Forbidden"));
    await renderWithProviders(<BoutiqueEditor sellerId={SELLER} boutiqueId="9" local={LOCAL} />);
    expect(
      await screen.findByText("You Don't Have Permission To View Or Edit This Boutique."),
      "a 403 did not show access denied",
    ).toBeInTheDocument();
  });

  it("uses 'Failed To Load Boutique.' when the edit error has no message", async () => {
    svc.getBoutiqueForEdit.mockRejectedValueOnce(new Error(""));
    await renderWithProviders(<BoutiqueEditor sellerId={SELLER} boutiqueId="9" local={LOCAL} />);
    expect(await screen.findByText("Failed To Load Boutique."), "no fallback load error").toBeInTheDocument();
  });

  it("uses 'Failed To Load Boutique Form.' when the create form error has no message", async () => {
    svc.getBoutiqueCreateForm.mockRejectedValueOnce("");
    await renderWithProviders(<BoutiqueEditor sellerId={SELLER} local={LOCAL} mode="create" />);
    expect(await screen.findByText("Failed To Load Boutique Form."), "no fallback create-form error").toBeInTheDocument();
    expect(logError, "the create load failure was not logged as 'new'").toHaveBeenCalledWith(
      expect.objectContaining({ boutiqueId: "new" }),
    );
  });
});

describe("BoutiqueEditor — edit mode and save", () => {
  it("shows 'View only' without the update permission, in RTL for Arabic", async () => {
    profile.sellerPermissions = ["OTHER"];
    const { container } = await renderWithProviders(
      <BoutiqueEditor sellerId={SELLER} boutiqueId="9" local="sy-ar" />,
      { language: "ar" },
    );
    await screen.findByTestId("availability");
    expect(container.firstElementChild, "Arabic is not right-to-left").toHaveStyle({ direction: "rtl" });
    expect(screen.queryByRole("button", { name: /Edit|تعديل/ }), "an Edit button shows without permission").toBeNull();
  });

  it("enters edit mode, toggles status, and cancel puts the loaded form back", async () => {
    await renderEdit();
    expect(props.disabled, "the sections are editable before Edit").toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(props.disabled, "Edit did not unlock the sections").toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Set Inactive" }));
    expect(screen.getByText("Inactive"), "Set inactive did not change the pill").toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Set Active" }));
    expect(screen.getByText("Active"), "Set active did not change the pill").toBeInTheDocument();

    act(() => props.patchTranslation("en", { name: "Changed" }));
    expect(screen.getByTestId("tr-en"), "the name edit did not reach the form").toHaveTextContent("Changed|");
    await userEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0]);
    expect(screen.getByTestId("tr-en"), "Cancel did not revert the name").toHaveTextContent("Name en|");
    expect(props.disabled, "Cancel did not leave edit mode").toBe(true);
  });

  it("blocks save on a blank field, jumps to that language and names the problem", async () => {
    await renderEdit();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    act(() => props.patchTranslation("ar", { bio: "  " }));
    await userEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    expect(showErrorMessage, "no toast for the blank bio").toHaveBeenCalledWith(
      "Please fix the highlighted fields before saving.",
    );
    expect(props.errors["translations.ar.bio"], "the Arabic bio error is missing").toBe("Bio is required.");
    expect(props.activeLang, "the editor did not jump to the Arabic tab").toBe("ar");
    expect(props.shakeTick, "the fields were not told to shake").toBe(1);
    expect(svc.updateBoutique, "an invalid form reached the core backend").not.toHaveBeenCalled();
  });

  it("does not switch tab when the error key names no known language", async () => {
    // A form whose only translation code is not in the language list keeps the
    // current tab. Built through a boutique with no 'en' translation and 'en' only.
    svc.getLanguages.mockResolvedValue(EN_ONLY);
    svc.getBoutiqueForEdit.mockResolvedValueOnce({ success: true, data: { boutique: { translations: [] } } });
    await renderEdit();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[1]);
    expect(props.activeLang, "the active tab moved").toBe("en");
  });

  it("reports the core backend's detailed errors when the update is refused", async () => {
    svc.updateBoutique.mockResolvedValueOnce({
      success: false,
      detailed_error: [{ message: "Name taken" }, { message: "Icon bad" }],
    });
    await renderEdit();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    await waitFor(() =>
      expect(showErrorMessage, "the detailed update errors were not shown").toHaveBeenCalledWith("Name taken • Icon bad"),
    );
    expect(logError, "the refused update was not logged").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "BoutiqueEditor.save", boutiqueId: "9" }),
    );
  });

  it("uses the backend message, then the fallback, when a refused update has no details", async () => {
    await renderEdit();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    svc.updateBoutique.mockResolvedValueOnce({ success: false, message: "Nope" });
    await userEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    await waitFor(() => expect(showErrorMessage, "the backend message was not shown").toHaveBeenCalledWith("Nope"));
    svc.updateBoutique.mockResolvedValueOnce(null);
    await userEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    await waitFor(() =>
      expect(showErrorMessage, "no fallback update error").toHaveBeenCalledWith("Failed to update boutique."),
    );
  });

  it("saves without a status call when the status did not move", async () => {
    svc.updateBoutique.mockResolvedValueOnce({ success: true });
    await renderEdit();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    await waitFor(() =>
      expect(showSuccessMessage, "no success toast after the update").toHaveBeenCalledWith("Boutique updated successfully."),
    );
    expect(svc.changeBoutiqueStatus, "a status call was sent for an unchanged status").not.toHaveBeenCalled();
    expect(svc.updateBoutique.mock.calls[0][2], "the update body has no per-language custom_data").toHaveProperty("custom_data");
    expect(props.disabled, "the editor stayed in edit mode after a save").toBe(true);
  });

  it("saves the new status the core backend returns", async () => {
    svc.updateBoutique.mockResolvedValueOnce({ success: true });
    svc.changeBoutiqueStatus.mockResolvedValueOnce({ success: true, data: { status: 0 } });
    await renderEdit();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Set Inactive" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    await waitFor(() =>
      expect(svc.changeBoutiqueStatus, "the status change was not sent").toHaveBeenCalledWith(SELLER, "9", 0),
    );
    expect(await screen.findByText("Inactive"), "the saved status is not shown").toBeInTheDocument();
    svc.updateBoutique.mockResolvedValueOnce({ success: true });
    svc.changeBoutiqueStatus.mockResolvedValueOnce({ success: true, data: {} });
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Set Active" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    expect(await screen.findByText("Active"), "a status answer with no status did not keep the chosen one").toBeInTheDocument();
  });

  it("keeps the edits but reverts the status and lists the blockers when the status change is refused", async () => {
    svc.updateBoutique.mockResolvedValue({ success: true });
    svc.changeBoutiqueStatus.mockResolvedValueOnce({
      success: false,
      detailed_error: [{ message: "Needs products" }],
    });
    await renderEdit();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Set Inactive" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    expect(await screen.findByText("• Needs products"), "the status blocker is not listed").toBeInTheDocument();
    expect(showErrorMessage, "no partial-save toast").toHaveBeenCalledWith(
      "Your changes were saved, but the status could not be updated.",
    );
    expect(showSuccessMessage, "a full success was reported for a partial save").not.toHaveBeenCalled();
    expect(screen.getByText("Active"), "the refused status was not reverted").toBeInTheDocument();

    svc.changeBoutiqueStatus.mockResolvedValueOnce({ success: false, message: "Locked" });
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Set Inactive" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    expect(await screen.findByText("• Locked"), "the status message is not listed").toBeInTheDocument();

    svc.changeBoutiqueStatus.mockResolvedValueOnce(null);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Set Inactive" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Save Changes" })[0]);
    expect(await screen.findByText("• Could not change status."), "no fallback status blocker").toBeInTheDocument();
  });
});

describe("BoutiqueEditor — create", () => {
  const fill = () =>
    act(() => {
      props.patchTranslation("en", {
        name: "New one",
        description: "<p>d</p>",
        bio: "b",
        icon: "i.webp",
        banners: [{ banner: "b.webp", previewUrl: "blob:x" }],
      });
      props.patch({ availability: 3 });
    });

  it("shows the create header, and both Cancel buttons go back to the dashboard", async () => {
    svc.getLanguages.mockResolvedValue(EN_ONLY);
    svc.getBoutiqueCreateForm.mockResolvedValueOnce({ success: true, data: { lookups: { countries: [] } } });
    await renderCreate();
    expect(screen.getByRole("heading", { name: "New Boutique" }), "no create heading").toBeInTheDocument();
    expect(screen.getByText("Fill In The Details And Create Your Boutique."), "no create hint").toBeInTheDocument();
    const cancels = screen.getAllByRole("button", { name: "Cancel" });
    await userEvent.click(cancels[0]);
    await userEvent.click(cancels[1]);
    expect(routerSpies.push, "Cancel did not go back to the dashboard").toHaveBeenCalledTimes(2);
    expect(routerSpies.push, "Cancel went somewhere else").toHaveBeenCalledWith(DASH);
  });

  it("creates the boutique and opens its edit page by the returned boutique_id", async () => {
    svc.getLanguages.mockResolvedValue(EN_ONLY);
    svc.addBoutique.mockResolvedValueOnce({ success: true, data: { boutique_id: 42 } });
    await renderCreate();
    fill();
    await userEvent.click(screen.getAllByRole("button", { name: "Create Boutique" })[0]);
    await waitFor(() =>
      expect(routerSpies.replace, "the new boutique page was not opened").toHaveBeenCalledWith(`${DASH}/boutiques/42`),
    );
    expect(showSuccessMessage, "no create toast").toHaveBeenCalledWith("Boutique created successfully.");
    expect(svc.addBoutique.mock.calls[0][1], "the create body lacks boutique_custom_data").toHaveProperty(
      "boutique_custom_data",
    );
  });

  it("goes back to the dashboard when the create answer carries no id", async () => {
    svc.getLanguages.mockResolvedValue(EN_ONLY);
    svc.addBoutique.mockResolvedValueOnce({ success: true, data: {} });
    await renderCreate();
    fill();
    await userEvent.click(screen.getAllByRole("button", { name: "Create Boutique" })[1]);
    await waitFor(() =>
      expect(routerSpies.replace, "no id did not fall back to the dashboard").toHaveBeenCalledWith(DASH),
    );
  });

  it("names the core backend's refusal of a create: details, then message, then fallback", async () => {
    svc.getLanguages.mockResolvedValue(EN_ONLY);
    await renderCreate();
    fill();
    svc.addBoutique.mockResolvedValueOnce({ success: false, detailed_error: [{ message: "Too long" }] });
    await userEvent.click(screen.getAllByRole("button", { name: "Create Boutique" })[0]);
    await waitFor(() => expect(showErrorMessage, "the create detail was not shown").toHaveBeenCalledWith("Too long"));
    expect(logError, "the create failure was not logged").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "BoutiqueEditor.create", boutiqueId: "new" }),
    );
    svc.addBoutique.mockResolvedValueOnce({ success: false, message: "Bad" });
    await userEvent.click(screen.getAllByRole("button", { name: "Create Boutique" })[0]);
    await waitFor(() => expect(showErrorMessage, "the create message was not shown").toHaveBeenCalledWith("Bad"));
    svc.addBoutique.mockResolvedValueOnce(undefined);
    await userEvent.click(screen.getAllByRole("button", { name: "Create Boutique" })[0]);
    await waitFor(() =>
      expect(showErrorMessage, "no fallback create error").toHaveBeenCalledWith("Failed to create boutique."),
    );
  });
});

describe("BoutiqueEditor — handlers the sections call", () => {
  it("copies name, icon and banners from another language into the active one", async () => {
    await renderEdit();
    act(() => props.setActiveLang("ar"));
    act(() => props.patchTranslation("ar", { name: "", icon: "", banners: [] }));
    act(() => props.onCopyField("name", "en"));
    act(() => props.onCopyField("icon", "en"));
    act(() => props.onCopyField("banners", "en"));
    expect(screen.getByTestId("tr-ar"), "the copy from English did not land in Arabic").toHaveTextContent(
      "Name en|icon-en.webp|b1-en.webp,b2-en.webp",
    );
    act(() => props.onCopyField("name", "xx"));
    expect(screen.getByTestId("tr-ar"), "a copy from an unknown language changed the form").toHaveTextContent(
      "Name en|",
    );
  });

  it("uploads an icon and stores only the bare filename", async () => {
    svc.uploadShopImage.mockResolvedValueOnce("https://example.com/boutiques/boutiques/icon/new.webp");
    await renderEdit();
    await act(() => props.onUploadIcon("en", img()));
    expect(svc.uploadShopImage, "the icon was not sent to the media server folder").toHaveBeenCalledWith(
      expect.any(File),
      "boutiques/boutiques/icon",
    );
    expect(screen.getByTestId("tr-en"), "the uploaded icon name is not in the form").toHaveTextContent("|new.webp|");
    expect(props.uploading.icon, "the icon upload never finished").toBe(false);
  });

  it("refuses a non-image icon before any upload", async () => {
    await renderEdit();
    await act(() => props.onUploadIcon("en", img("a.txt", "text/plain")));
    expect(showErrorMessage, "no toast for a non-image icon").toHaveBeenCalledWith("Please choose an image file.");
    expect(svc.uploadShopImage, "a non-image icon was uploaded").not.toHaveBeenCalled();
  });

  it("reports an icon upload with no file name, and a failed upload with no message", async () => {
    await renderEdit();
    svc.uploadShopImage.mockResolvedValueOnce("");
    await act(() => props.onUploadIcon("en", img()));
    expect(showErrorMessage, "an empty upload answer was not reported").toHaveBeenCalledWith("Upload returned no file.");
    svc.uploadShopImage.mockRejectedValueOnce("");
    await act(() => props.onUploadIcon("en", img()));
    expect(showErrorMessage, "no fallback icon upload error").toHaveBeenCalledWith("Image upload failed.");
  });

  it("uploads a good banner and appends it as a new record", async () => {
    checkBannerFile.mockResolvedValue({});
    svc.bulkUploadImages.mockResolvedValueOnce({ files: ["boutiques/boutiques/nb.webp"] });
    await renderEdit();
    await act(() => props.onAddBanners("en", [img()]));
    expect(svc.bulkUploadImages, "the banner was not sent to the banner folder").toHaveBeenCalledWith(
      [expect.any(File)],
      "boutiques/boutiques",
    );
    expect(screen.getByTestId("tr-en"), "the new banner is not last").toHaveTextContent("b1-en.webp,b2-en.webp,nb.webp");
  });

  it("drops a banner the size check refuses and reports failed banner uploads", async () => {
    await renderEdit();
    checkBannerFile.mockResolvedValueOnce({ hardError: "Banner image must be 10 MB or smaller." });
    await act(() => props.onAddBanners("en", [img()]));
    expect(showErrorMessage, "no toast for an oversize banner").toHaveBeenCalledWith(
      "Banner image must be 10 MB or smaller.",
    );
    expect(svc.bulkUploadImages, "an oversize banner was uploaded").not.toHaveBeenCalled();

    checkBannerFile.mockResolvedValue({});
    svc.bulkUploadImages.mockResolvedValueOnce({});
    await act(() => props.onAddBanners("en", [img()]));
    expect(showErrorMessage, "an empty banner answer was not reported").toHaveBeenCalledWith("Upload returned no file.");
    svc.bulkUploadImages.mockRejectedValueOnce("");
    await act(() => props.onAddBanners("en", [img()]));
    expect(showErrorMessage, "no fallback banner upload error").toHaveBeenCalledWith("Image upload failed.");
    expect(logError, "the banner failure was not logged").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "BoutiqueEditor.uploadBanner" }),
    );
  });

  it("pauses on a badly sized banner: Cancel skips it, 'Ignore & Upload' sends it, the queue carries on", async () => {
    await renderEdit();
    svc.bulkUploadImages.mockResolvedValue({ files: ["q.webp"] });
    checkBannerFile.mockResolvedValueOnce({ warning: "300×300" });
    await act(() => props.onAddBanners("en", [img("a.webp")]));
    expect(screen.getByText(/300×300/), "the warning does not show the image size").toBeInTheDocument();

    // Added while the warning is open: queued, not checked yet.
    await act(() => props.onAddBanners("en", [img("b.webp")]));
    expect(checkBannerFile, "a queued file was checked while the warning was open").toHaveBeenCalledTimes(1);

    checkBannerFile.mockResolvedValueOnce({ warning: "400×400" });
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(svc.bulkUploadImages, "the cancelled banner was uploaded").not.toHaveBeenCalled();
    expect(await screen.findByText(/400×400/), "the second file was not checked after Cancel").toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ignore & Upload" }));
    await waitFor(() =>
      expect(svc.bulkUploadImages, "'Ignore & Upload' did not upload the banner").toHaveBeenCalledTimes(1),
    );

    checkBannerFile.mockResolvedValueOnce({ warning: "10×10" });
    await act(() => props.onAddBanners("en", [img("c.webp")]));
    const backdrop = screen.getByText(/10×10/).closest(".fixed")!.firstElementChild as HTMLElement;
    await userEvent.click(backdrop);
    expect(screen.queryByText(/10×10/), "the backdrop did not close the warning").toBeNull();
  });

  it("ignores a second drain while the first is still running", async () => {
    await renderEdit();
    let release!: (v: unknown) => void;
    checkBannerFile.mockImplementationOnce(() => new Promise((r) => (release = r)));
    checkBannerFile.mockResolvedValue({ hardError: "Please choose an image file." });
    let first!: Promise<void>;
    await act(async () => {
      first = props.onAddBanners("en", [img("a.webp")]);
      await props.onAddBanners("en", [img("b.webp")]);
    });
    expect(checkBannerFile, "the second call started its own drain").toHaveBeenCalledTimes(1);
    await act(async () => {
      release({ hardError: "Please choose an image file." });
      await first;
    });
    expect(checkBannerFile, "the running drain did not pick up the queued file").toHaveBeenCalledTimes(2);
  });

  it("removes and reorders banners, and ignores a move past either end", async () => {
    await renderEdit();
    act(() => props.onMoveBanner("en", 0, 1));
    expect(screen.getByTestId("tr-en"), "the banners were not swapped").toHaveTextContent("b2-en.webp,b1-en.webp");
    act(() => props.onMoveBanner("en", 0, -1));
    act(() => props.onMoveBanner("en", 1, 1));
    expect(screen.getByTestId("tr-en"), "a move past the end changed the order").toHaveTextContent(
      "b2-en.webp,b1-en.webp",
    );
    act(() => props.onRemoveBanner("en", 0));
    expect(screen.getByTestId("tr-en"), "the first banner was not removed").toHaveTextContent("|b1-en.webp");
  });
});
