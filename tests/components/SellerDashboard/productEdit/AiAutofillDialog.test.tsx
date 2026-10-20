// The "Add with AI" dialog on the seller dashboard's Products tab.
//
// It takes one photo, uploads it to the media server like any product image,
// asks POST /api/seller/products/ai-autofill for suggestions, then hands them to
// the create form and navigates there. It never creates a product itself.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const svc = vi.hoisted(() => ({ bulkUploadImages: vi.fn(), addProduct: vi.fn() }));
vi.mock("services/sellerDashboard", () => ({ default: svc }));

const logError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (orig) => ({
  ...(await orig<typeof import("utils/functions")>()),
  LogError: (e: unknown) => logError(e),
}));

import AiAutofillDialog from "components/SellerDashboard/productEdit/AiAutofillDialog";
import { translateFunction } from "utils/functions";
import { clearAiPrefill, peekAiPrefill } from "components/SellerDashboard/productEdit/aiPrefill";
import { routerSpies } from "../../../mocks/nextNavigation";
import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../../render";

const SUGGESTION = {
  title: "White Silk Robe",
  description: "A soft robe.",
  similar_words: ["robe"],
  meta_title: "White Silk Robe",
  meta_description: "A soft silk robe.",
  brand_id: 2,
  category_id: 1,
  sub_category_id: 15,
  sub_sub_category_id: 33,
};

// What the seller sees for a message key (English is shown in Title Case).
const shown = (key: string) => translateFunction(key);

const onClose = vi.fn();
const onNavigate = vi.fn();
let fetchMock: ReturnType<typeof vi.fn>;

const photo = (type = "image/jpeg") => new File([new Uint8Array([1, 2, 3])], "robe.jpg", { type });
const fileInput = () => document.querySelector('[data-pw="ai-autofill-file"]') as HTMLInputElement;
const analyzeButton = () => document.querySelector('[data-pw="ai-autofill-analyze"]') as HTMLButtonElement;
const pick = (file: File) => fireEvent.change(fileInput(), { target: { files: [file] } });
const answer = (status: number, body: unknown) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

async function open(local = "sy-en") {
  await renderWithProviders(
    <AiAutofillDialog sellerId="12" local={local} onClose={onClose} onNavigate={onNavigate} />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:preview"), revokeObjectURL: vi.fn() }));
  svc.bulkUploadImages.mockResolvedValue({ urls: ["https://media.test/product/a1b2c3.jpg"] });
  fetchMock = vi.fn().mockResolvedValue(answer(200, { success: true, data: SUGGESTION }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  clearAiPrefill("12");
  vi.unstubAllGlobals();
});

describe("AiAutofillDialog", () => {
  it("renders through a portal on document.body at the same layer as the other dashboard modals", async () => {
    await open();
    const dialog = document.querySelector('[data-pw="ai-autofill-dialog"]') as HTMLElement;
    expect(dialog, "the dialog did not render").not.toBeNull();
    // Rendered inline, the dialog sits inside the scaled dashboard tree, so
    // `fixed inset-0` covers only that box and the backdrop stops short of the
    // page edges (as the carts / orders / stories modals once did).
    expect(
      dialog.parentElement,
      "the dialog is rendered inline instead of through a portal on document.body",
    ).toBe(document.body);
    expect(
      dialog.className,
      "the dialog backdrop does not use the dashboard modal z-index (z-[999999999])",
    ).toContain("z-[999999999]");
  });

  it("keeps Analyze disabled until a JPEG/PNG/WebP photo is picked, refuses other types, and closing changes nothing (AC-2)", async () => {
    await open();
    expect(analyzeButton().disabled, "Analyze was enabled with no photo").toBe(true);

    pick(photo("image/gif"));
    expect(await screen.findByRole("alert"), "a GIF was not refused with a message").toHaveTextContent(
      shown("Please choose a JPEG, PNG or WebP photo."),
    );
    expect(analyzeButton().disabled, "Analyze was enabled for a refused file type").toBe(true);

    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      pick(photo(type));
      await waitFor(() => expect(analyzeButton().disabled, `Analyze stayed disabled for ${type}`).toBe(false));
    }

    fireEvent.click(screen.getByRole("button", { name: shown("Cancel") }));
    expect(onClose, "Cancel did not close the dialog").toHaveBeenCalledTimes(1);
    expect(svc.bulkUploadImages, "closing uploaded the photo").not.toHaveBeenCalled();
    expect(fetchMock, "closing called the AI route").not.toHaveBeenCalled();
    expect(peekAiPrefill("12"), "closing left a hand-off behind").toBeNull();
  });

  it("uploads the photo, then asks the AI route, showing a disabled loading state until each answer (AC-3)", async () => {
    let finishUpload!: (v: unknown) => void;
    svc.bulkUploadImages.mockReturnValue(new Promise((r) => (finishUpload = r)));
    let finishAi!: (v: Response) => void;
    fetchMock.mockReturnValue(new Promise((r) => (finishAi = r)));
    await open();
    pick(photo());
    await waitFor(() => expect(analyzeButton().disabled).toBe(false));

    fireEvent.click(analyzeButton());
    expect(await screen.findByText(shown("Analyzing photo...")), "no loading state while uploading").toBeInTheDocument();
    expect(analyzeButton().disabled, "Analyze stayed clickable while uploading").toBe(true);
    expect(svc.bulkUploadImages, "the photo was not uploaded to the product folder").toHaveBeenCalledWith(
      [expect.any(File)],
      "product",
    );
    expect(fetchMock, "the AI route was asked before the upload finished").not.toHaveBeenCalled();

    await act(async () => finishUpload({ urls: ["https://media.test/product/a1b2c3.jpg"] }));
    await waitFor(() => expect(fetchMock, "the AI route was not asked after the upload").toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url, "the dialog called the wrong route").toBe("/api/seller/products/ai-autofill");
    expect(JSON.parse(init.body), "the route did not get the shop, the bare file name and the page language").toEqual({
      sellerId: "12",
      image: "a1b2c3.jpg",
      language: "en",
    });
    expect(analyzeButton().disabled, "Analyze became clickable while the AI ran").toBe(true);

    await act(async () => finishAi(answer(200, { success: true, data: SUGGESTION })));
    await waitFor(() =>
      expect(routerSpies.push, "the create form was not opened").toHaveBeenCalledWith(
        "/sy-en/sellerProfile/sellerDashboard/12/products/new",
      ),
    );
    expect(onNavigate, "the dashboard's navigation bookkeeping was skipped").toHaveBeenCalledTimes(1);
    expect(peekAiPrefill("12"), "the suggestion was not handed to the form").toEqual({
      suggestion: SUGGESTION,
      image: { name: "a1b2c3.jpg", url: "blob:preview", isNew: true },
      language: "en",
    });
  });

  it("sends the seller's page language to the route and hands it to the form, so the text is written in it", async () => {
    await open("sy-ar");
    pick(photo());
    await waitFor(() => expect(analyzeButton().disabled).toBe(false));
    fireEvent.click(analyzeButton());
    await waitFor(() => expect(routerSpies.push).toHaveBeenCalled());

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).language, "the route was not told the page is Arabic").toBe("ar");
    expect(peekAiPrefill("12")?.language, "the form was not told the text is Arabic").toBe("ar");
    expect(routerSpies.push, "the create form was not opened under the Arabic locale").toHaveBeenCalledWith(
      "/sy-ar/sellerProfile/sellerDashboard/12/products/new",
    );
  });

  it("enables Analyze again after a failure", async () => {
    fetchMock.mockResolvedValue(answer(500, { success: false, message: "AI analysis failed" }));
    await open();
    pick(photo());
    await waitFor(() => expect(analyzeButton().disabled).toBe(false));

    fireEvent.click(analyzeButton());
    await screen.findByRole("alert");
    expect(analyzeButton().disabled, "Analyze stayed disabled after a failure").toBe(false);
  });

  it.each([
    [401, { success: false, message: "You do not have permission for this action." }, "You do not have permission for this action."],
    [403, { success: false, message: "You do not have permission for this action." }, "You do not have permission for this action."],
    [422, { success: false, message: "The image must be uploaded to the media server" }, "The image must be uploaded to the media server"],
    [429, { success: false, message: "Too many requests. Please try again in a moment." }, "Too many requests. Please try again in a moment."],
    [503, { success: false, message: "The AI service is busy right now. Please try again in a moment." }, "The AI service is busy right now. Please try again in a moment."],
    [500, { success: false, message: "AI analysis failed" }, "AI analysis failed"],
    [504, "<html>gateway timeout</html>", "AI analysis failed"],
  ])("keeps the dialog open with the translated message for a %i (AC-13)", async (status, body, message) => {
    fetchMock.mockResolvedValue(answer(status, body));
    await open();
    pick(photo());
    await waitFor(() => expect(analyzeButton().disabled).toBe(false));

    fireEvent.click(analyzeButton());

    expect(await screen.findByRole("alert"), `a ${status} did not show its message`).toHaveTextContent(shown(message));
    expect(screen.getByRole("dialog"), `the dialog closed on a ${status}`).toBeInTheDocument();
    expect(routerSpies.push, `a ${status} opened the form`).not.toHaveBeenCalled();
    expect(peekAiPrefill("12"), `a ${status} left a hand-off`).toBeNull();

    fetchMock.mockResolvedValue(answer(200, { success: true, data: SUGGESTION }));
    fireEvent.click(analyzeButton());
    await waitFor(() => expect(routerSpies.push, `retry after a ${status} did not work`).toHaveBeenCalled());
  });

  it("shows the upload failure and never calls the AI when the photo upload fails (AC-13)", async () => {
    svc.bulkUploadImages.mockRejectedValue(new Error("Bulk upload failed"));
    await open();
    pick(photo());
    await waitFor(() => expect(analyzeButton().disabled).toBe(false));

    fireEvent.click(analyzeButton());

    expect(await screen.findByRole("alert"), "the upload failure was not shown").toHaveTextContent(shown("Image upload failed"));
    expect(fetchMock, "the AI route was called without an uploaded photo").not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: shown("Close") }));
    expect(onClose, "the seller could not close after a failure").toHaveBeenCalled();
  });

  it("ignores an answer that arrives after the dialog was closed", async () => {
    let finishAi!: (v: Response) => void;
    fetchMock.mockReturnValue(new Promise((r) => (finishAi = r)));
    await open();
    pick(photo());
    await waitFor(() => expect(analyzeButton().disabled).toBe(false));
    fireEvent.click(analyzeButton());
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: shown("Cancel") }));
    await act(async () => finishAi(answer(200, { success: true, data: SUGGESTION })));

    expect(routerSpies.push, "a late answer opened the form").not.toHaveBeenCalled();
    expect(peekAiPrefill("12"), "a late answer left a hand-off").toBeNull();
  });

  it("never creates a product (AC-17)", async () => {
    await open();
    pick(photo());
    await waitFor(() => expect(analyzeButton().disabled).toBe(false));
    fireEvent.click(analyzeButton());
    await waitFor(() => expect(routerSpies.push).toHaveBeenCalled());

    expect(svc.addProduct, "the dialog created a product").not.toHaveBeenCalled();
    expect(
      fetchMock.mock.calls.map(([u]) => u),
      "the dialog called something besides the AI route",
    ).toEqual(["/api/seller/products/ai-autofill"]);
  });
});
