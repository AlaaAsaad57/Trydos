// The Excel section of the seller dashboard — bulk product upload.
//
// The seller follows three steps: pick a category, download that category's
// template, then upload the filled sheet. Two backends are involved and they
// fail for different reasons, so the section must say which one refused:
//   - the media server takes the file itself (uploadExcelFile)
//   - the shop backend then processes it (processExcel)
//
// The uploaded-files table below the form is a separate load with its own
// error and its own Refresh, so a broken table must not hide the upload form.
import { beforeEach, describe, expect, it, vi } from "vitest";

const getExcelCategories = vi.fn();
const getExcelFiles = vi.fn();
const downloadExcelTemplate = vi.fn();
const uploadExcelFile = vi.fn();
const processExcel = vi.fn();
const downloadFailedRows = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getExcelCategories: (...a: unknown[]) => getExcelCategories(...a),
    getExcelFiles: (...a: unknown[]) => getExcelFiles(...a),
    downloadExcelTemplate: (...a: unknown[]) => downloadExcelTemplate(...a),
    downloadFailedRows: (...a: unknown[]) => downloadFailedRows(...a),
    uploadExcelFile: (...a: unknown[]) => uploadExcelFile(...a),
    processExcel: (...a: unknown[]) => processExcel(...a),
  },
}));

import ExcelUploadTab from "components/SellerDashboard/ExcelUploadTab";

import {
  fireEvent,
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
  within,
} from "../../render";

const SELLER_ID = "77";

/** One row of GET /shop/excel/getUploadedExcelFiles (a Laravel paginator). */
const excelRow = (over: Record<string, unknown> = {}) => ({
  id: 12,
  original_filename: "shoes.xlsx",
  s3_path: "excel/shoes.xlsx",
  file_size: 2048,
  mime_type: "application/vnd.ms-excel",
  uploaded_by_user_type: 1,
  uploaded_by_user_id: 5,
  upload_status: "completed",
  processing_notes: "",
  created_at: "2026-01-05T10:00:00Z",
  updated_at: "2026-01-05T10:00:00Z",
  ...over,
});

/** A file the drop zone will accept or refuse, by its extension. */
const sheet = (name: string) =>
  new File(["rows"], name, { type: "application/vnd.ms-excel" });

async function mount(sellerId: string = SELLER_ID) {
  return renderWithProviders(
    <ExcelUploadTab sellerId={sellerId} language="en" />,
    { path: `/sellerProfile/sellerDashboard/${sellerId}` },
  );
}

/** GET /shop/excel/categories as the contract shows it: a three-level tree,
 *  each category with how many of the seller's products it holds. */
const tree = [
  { id: 12, name: "Clothes", display_name: "Clothes", level: 0, products_count: 37 },
  { id: 45, name: "Men", display_name: "Clothes -> Men", level: 1, products_count: 12 },
  { id: 78, name: "Shirts", display_name: "Clothes -> Men -> Shirts", level: 2, products_count: 5 },
  { id: 13, name: "Shoes", display_name: "Shoes", level: 0, products_count: 0 },
];
const withTree = (list: Record<string, unknown>[] = tree) =>
  getExcelCategories.mockResolvedValue({ success: true, data: list });

/** The category picker: a closed field (role combobox) that opens a list with
 *  a search box on top. */
const picker = () => screen.getByRole("combobox", { name: /category/i });

/** Wait until the categories have loaded and the picker is drawn. */
const categoriesLoaded = () => screen.findByRole("combobox", { name: /category/i });

/** Open the picker (when it is closed) and return its list. */
async function openPicker() {
  const field = await categoriesLoaded();
  if (field.getAttribute("aria-expanded") !== "true") await userEvent.click(field);
  return screen.getByRole("listbox");
}

/** The id of the picked category, "" when none is picked. */
const pickedId = () => picker().getAttribute("data-value") ?? "";

/** The labels of the categories offered in the open picker. */
const offered = async () =>
  within(await openPicker())
    .queryAllByRole("option")
    .map((o) => o.textContent?.trim());

const pick = async (id: string | number) => {
  const option = within(await openPicker())
    .getAllByRole("option")
    .find((o) => o.getAttribute("data-value") === String(id));
  if (!option) throw new Error(`category ${id} is not offered in the picker`);
  await userEvent.click(option);
};

const addNew = () => screen.getByRole("radio", { name: /^add new products$/i });
const updateMine = () => screen.getByRole("radio", { name: /^update my products$/i });
const onlyMine = () =>
  screen.getByRole("checkbox", { name: /show only categories that have my products/i });
const downloadButton = () => screen.getByRole("button", { name: /^download (empty template|\d+ products)$/i });

const STORAGE_KEY = `bulk-import:shop:${SELLER_ID}`;

/** The hidden file input behind the drop zone. */
const fileInput = () =>
  document.querySelector('input[type="file"]') as HTMLInputElement;

beforeEach(() => {
  for (const spy of [
    getExcelCategories,
    getExcelFiles,
    downloadExcelTemplate,
    uploadExcelFile,
    processExcel,
    downloadFailedRows,
  ]) {
    spy.mockReset();
  }
  // The tab remembers the last choice per seller; one test must not leave it
  // behind for the next one.
  window.localStorage.clear();
  getExcelCategories.mockResolvedValue({
    success: true,
    data: { categories: [{ id: 3, display_name: "Shoes" }] },
  });
  getExcelFiles.mockResolvedValue({ success: true, data: { data: [] } });
});

describe("Excel section — picking a category", () => {
  it("lists the categories the shop backend offers", async () => {
    await mount();
    await openPicker();
    expect(
      await screen.findByRole("option", { name: "Shoes" }),
      "the categories from the shop backend should fill the picker",
    ).toBeInTheDocument();
  });

  it("falls back to the id when a category has no name", async () => {
    getExcelCategories.mockResolvedValue({
      success: true,
      data: { categories: [{ id: 9 }] },
    });
    await mount();
    await openPicker();
    expect(
      await screen.findByRole("option", { name: "#9" }),
      "a nameless category should still be pickable, shown by its id",
    ).toBeInTheDocument();
  });

  it("shows why the category list did not load, and offers to try again", async () => {
    getExcelCategories.mockResolvedValue({
      success: false,
      message: "Categories are unavailable.",
    });
    await mount();

    expect(
      await screen.findByText("Categories are unavailable."),
      "the seller should read what the shop backend said about the categories",
    ).toBeInTheDocument();

    getExcelCategories.mockResolvedValue({
      success: true,
      data: { categories: [{ id: 3, display_name: "Shoes" }] },
    });
    await userEvent.click(screen.getAllByRole("button", { name: "Retry" })[0]);
    await openPicker();

    expect(
      await screen.findByRole("option", { name: "Shoes" }),
      "Retry should load the categories again",
    ).toBeInTheDocument();
  });
});

describe("Excel section — the template", () => {
  it("cannot be downloaded before a category is picked", async () => {
    await mount();
    expect(
      await screen.findByRole("button", { name: /Download Empty Template/i }),
      "there is no template until the seller says which category it is for",
    ).toBeDisabled();
  });

  it('the button says "Download empty template" or "Download N products"', async () => {
    withTree();
    await mount();
    await categoriesLoaded();
    await pick(78);
    expect(
      downloadButton().textContent,
      'with "Add new products" the button must offer the empty template',
    ).toMatch(/download empty template/i);
    await userEvent.click(updateMine());
    expect(
      downloadButton().textContent,
      'with "Update my products" the button must say how many products come',
    ).toMatch(/download 5 products/i);
  });

  it("asks the backend for the template of the picked category", async () => {
    downloadExcelTemplate.mockResolvedValue({
      blob: new Blob(["x"]),
      filename: "shoes-template.xlsx",
    });
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: () => "blob:template",
      revokeObjectURL: () => {},
    });

    await mount();
    await pick(3);
    await userEvent.click(
      screen.getByRole("button", { name: /Download Empty Template/i }),
    );

    expect(
      downloadExcelTemplate,
      "the template request should name the shop, the picked category, the mode and a file name",
    ).toHaveBeenCalledWith(SELLER_ID, "3", "template", "Shoes_template.xlsx");

    vi.unstubAllGlobals();
  });

  it("says why the template could not be prepared", async () => {
    downloadExcelTemplate.mockRejectedValue(
      new Error("The template service is down."),
    );
    await mount();
    await pick(3);
    await userEvent.click(
      screen.getByRole("button", { name: /Download Empty Template/i }),
    );

    expect(
      await screen.findByText("The template service is down."),
      "a refused template should be reported with the backend's own words",
    ).toBeInTheDocument();
  });
});

describe("Excel section — choosing the file", () => {
  it("accepts a .xlsx sheet and shows its name", async () => {
    await mount();
    await categoriesLoaded();

    await userEvent.upload(fileInput(), sheet("products.xlsx"));

    expect(
      await screen.findByText("products.xlsx"),
      "an accepted sheet should be named back to the seller before upload",
    ).toBeInTheDocument();
  });

  // Dropped, not picked. The file input carries `accept=".xlsx,.xls,…"`, and
  // both the browser's picker and `userEvent.upload` honour it — a .png never
  // reaches the handler that way. Drag and drop does not honour `accept`, which
  // is the whole reason the component checks the extension itself.
  it("refuses a dropped file that is not a spreadsheet", async () => {
    await mount();
    await categoriesLoaded();

    const dropZone = screen
      .getByText(/Drag & Drop Excel File Here/)
      .closest("[class*='border-dashed']")!;
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [sheet("photo.png")] },
    });

    expect(
      await screen.findByText(
        "Please Upload A Valid Excel File (.xlsx, .xls, .xlsm, .xlsb)",
      ),
      "a .png is not a sheet and the seller should be told so",
    ).toBeInTheDocument();
    expect(
      screen.queryByText("photo.png"),
      "a refused file must not be held ready to upload",
    ).not.toBeInTheDocument();
  });

  it("keeps Upload blocked until a file is chosen", async () => {
    await mount();
    expect(
      await screen.findByRole("button", { name: /Upload Excel/ }),
      "there is nothing to upload before a file is chosen",
    ).toBeDisabled();
  });

  it("lets the seller drop the chosen file again", async () => {
    await mount();
    await categoriesLoaded();
    await userEvent.upload(fileInput(), sheet("products.xlsx"));
    await screen.findByText("products.xlsx");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByText("products.xlsx"),
      "cancelling should clear the chosen file",
    ).not.toBeInTheDocument();
  });
});

describe("Excel section — uploading", () => {
  async function chooseFileAndUpload() {
    await mount();
    await categoriesLoaded();
    await userEvent.upload(fileInput(), sheet("products.xlsx"));
    await screen.findByText("products.xlsx");
    await userEvent.click(screen.getByRole("button", { name: /Upload Excel/ }));
  }

  it("sends the file to the media server, then its key to the shop backend", async () => {
    uploadExcelFile.mockResolvedValue({ key: "excel/products.xlsx" });
    processExcel.mockResolvedValue({ success: true });

    await chooseFileAndUpload();

    await waitFor(() => {
      expect(
        uploadExcelFile,
        "the media server should be handed the sheet itself",
      ).toHaveBeenCalledTimes(1);
    });
    expect(
      processExcel,
      "the shop backend should then be handed the key the media server returned",
    ).toHaveBeenCalledWith(SELLER_ID, "excel/products.xlsx", {});
  });

  it("confirms a finished upload and clears the chosen file", async () => {
    uploadExcelFile.mockResolvedValue({ key: "excel/products.xlsx" });
    processExcel.mockResolvedValue({ success: true });

    await chooseFileAndUpload();

    expect(
      await screen.findByText("File Uploaded And Processed Successfully!"),
      "a finished upload should be confirmed on screen",
    ).toBeInTheDocument();
    expect(
      screen.queryByText("products.xlsx"),
      "the sheet is done, so it must not still sit in the form",
    ).not.toBeInTheDocument();
  });

  it("reloads the uploaded-files table after a finished upload", async () => {
    uploadExcelFile.mockResolvedValue({ key: "excel/products.xlsx" });
    processExcel.mockResolvedValue({ success: true });
    const loadsBefore = getExcelFiles.mock.calls.length;

    await chooseFileAndUpload();

    await waitFor(() => {
      expect(
        getExcelFiles.mock.calls.length,
        "the new sheet should appear in the table without a manual refresh",
      ).toBeGreaterThan(loadsBefore + 1);
    });
  });

  // L-9 (seller catalog readiness): the tab said "processed successfully" even
  // when the shop backend still listed the sheet as processing, and the table
  // did not refresh by itself.
  it("says the sheet is still being processed when the shop backend lists it so", async () => {
    uploadExcelFile.mockResolvedValue({ key: "excel/products.xlsx" });
    processExcel.mockResolvedValue({ success: true });
    getExcelFiles.mockResolvedValue({
      success: true,
      data: { data: [excelRow({ upload_status: "processing" })] },
    });

    await chooseFileAndUpload();

    expect(
      await screen.findByText(/still being processed/i),
      "the shop backend still lists the sheet as processing, but the tab did not say so",
    ).toBeInTheDocument();
    expect(
      screen.queryByText("File Uploaded And Processed Successfully!"),
      "the tab said the sheet was processed while the shop backend still lists it as processing",
    ).not.toBeInTheDocument();
  });

  it("reloads the table by itself until the shop backend has processed the sheet", async () => {
    uploadExcelFile.mockResolvedValue({ key: "excel/products.xlsx" });
    processExcel.mockResolvedValue({ success: true });
    getExcelFiles.mockResolvedValue({
      success: true,
      data: { data: [excelRow({ upload_status: "processing" })] },
    });

    await chooseFileAndUpload();
    await screen.findByText(/still being processed/i);
    getExcelFiles.mockResolvedValue({
      success: true,
      data: { data: [excelRow({ upload_status: "completed" })] },
    });

    expect(
      await screen.findByText("completed", {}, { timeout: 6000 }),
      "the table never read the shop backend again while the sheet was processing",
    ).toBeInTheDocument();
  }, 10000);

  it("names the media server when it is the one that refused", async () => {
    uploadExcelFile.mockRejectedValue(
      new Error("The media server rejected the file."),
    );

    await chooseFileAndUpload();

    expect(
      await screen.findByText("The media server rejected the file."),
      "a media-server failure should be reported in its own words",
    ).toBeInTheDocument();
    expect(
      processExcel,
      "the shop backend must not be asked to process a file that was never stored",
    ).not.toHaveBeenCalled();
  });

  it("names the shop backend when the sheet was stored but not processed", async () => {
    uploadExcelFile.mockResolvedValue({ key: "excel/products.xlsx" });
    processExcel.mockResolvedValue({
      success: false,
      message: "Row 4 has no price.",
    });

    await chooseFileAndUpload();

    expect(
      await screen.findByText("Row 4 has no price."),
      "the shop backend's reason for refusing the sheet should be shown",
    ).toBeInTheDocument();
  });
});

describe("Excel section — the uploaded files table", () => {
  it("says when nothing has been uploaded yet", async () => {
    await mount();
    expect(
      await screen.findByText("No Files Uploaded Yet."),
      "an empty table should say so rather than show empty rows",
    ).toBeInTheDocument();
  });

  it("reads the rows out of the paginator's inner data list", async () => {
    getExcelFiles.mockResolvedValue({
      success: true,
      data: { data: [excelRow()] },
    });
    await mount();
    expect(
      await screen.findByText("shoes.xlsx"),
      "the rows live under data.data in the paginator answer",
    ).toBeInTheDocument();
  });

  it("shows each sheet's processing status", async () => {
    getExcelFiles.mockResolvedValue({
      success: true,
      data: { data: [excelRow({ upload_status: "failed" })] },
    });
    await mount();
    expect(
      await screen.findByText("failed"),
      "the seller must be able to see that a sheet failed to process",
    ).toBeInTheDocument();
  });

  it("offers Notes only for a sheet that has notes", async () => {
    getExcelFiles.mockResolvedValue({
      success: true,
      data: {
        data: [
          excelRow({ id: 1, original_filename: "quiet.xlsx" }),
          excelRow({
            id: 2,
            original_filename: "noisy.xlsx",
            processing_notes: "Row 4 has no price.",
          }),
        ],
      },
    });
    await mount();
    await screen.findByText("noisy.xlsx");

    const notesButtons = screen.getAllByRole("button", { name: "Notes" });
    expect(
      notesButtons[0],
      "a sheet with no notes has nothing to open",
    ).toBeDisabled();
    expect(
      notesButtons[1],
      "a sheet with notes should let the seller read them",
    ).toBeEnabled();
  });

  it("shows the backend's notes for the sheet that was clicked", async () => {
    getExcelFiles.mockResolvedValue({
      success: true,
      data: {
        data: [excelRow({ processing_notes: "Row 4 has no price." })],
      },
    });
    await mount();
    await screen.findByText("shoes.xlsx");

    await userEvent.click(screen.getByRole("button", { name: "Notes" }));

    expect(
      await screen.findByText("Row 4 has no price."),
      "the notes the backend wrote about this sheet should be readable",
    ).toBeInTheDocument();
  });

  it("shows why the table did not load without hiding the upload form", async () => {
    getExcelFiles.mockResolvedValue({
      success: false,
      message: "The file list is unavailable.",
    });
    await mount();

    expect(
      await screen.findByText("The file list is unavailable."),
      "a broken table should say what went wrong",
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Upload Excel/ }),
      "a broken table must not take the upload form away",
    ).toBeInTheDocument();
  });

  it("loads the table again on Refresh", async () => {
    getExcelFiles.mockResolvedValue({ success: true, data: { data: [] } });
    await mount();
    await screen.findByText("No Files Uploaded Yet.");

    getExcelFiles.mockResolvedValue({
      success: true,
      data: { data: [excelRow()] },
    });
    await userEvent.click(screen.getByRole("button", { name: /Refresh/ }));

    expect(
      await screen.findByText("shoes.xlsx"),
      "Refresh should pick up a sheet that finished processing since the load",
    ).toBeInTheDocument();
  });
});

describe("Excel section — dragging a file over the drop zone", () => {
  it("highlights the zone while a file is over it, and not after it leaves", async () => {
    await mount();
    await categoriesLoaded();
    const dropZone = screen
      .getByText(/Drag & Drop Excel File Here/)
      .closest("[class*='border-dashed']") as HTMLElement;

    fireEvent.dragEnter(dropZone);
    expect(
      dropZone.className,
      "a file dragged over the zone should turn it blue",
    ).toContain("border-[#388CFF]");

    fireEvent.dragOver(dropZone);
    fireEvent.dragLeave(dropZone);
    expect(
      dropZone.className,
      "the zone should go back to grey once the file leaves",
    ).not.toContain("border-[#388CFF]");

    fireEvent.drop(dropZone, { dataTransfer: { files: [] } });
    expect(
      screen.queryByText("Please Upload A Valid Excel File (.xlsx, .xls, .xlsm, .xlsb)"),
      "a drop that carries no file must not be refused as a wrong file",
    ).not.toBeInTheDocument();
  });

  it("does nothing when the picker is closed without a file", async () => {
    await mount();
    await categoriesLoaded();
    fireEvent.change(fileInput(), { target: { files: [] } });
    expect(
      screen.getByRole("button", { name: /Upload Excel/ }),
      "no file was chosen, so Upload must stay blocked",
    ).toBeDisabled();
  });
});

describe("Excel section — rows with odd data", () => {
  it("colours each processing status and shows a dash for a missing value", async () => {
    getExcelFiles.mockResolvedValue({
      success: true,
      data: {
        data: [
          excelRow({ id: 1, upload_status: "failed" }),
          excelRow({ id: 2, upload_status: "processing" }),
          excelRow({ id: 3, upload_status: "uploaded" }),
          excelRow({ id: 4, upload_status: "weird" }),
          excelRow({ id: 5, upload_status: "", original_filename: "", created_at: "" }),
          excelRow({ id: 6, created_at: "not a date" }),
        ],
      },
    });
    await mount();
    const failed = await screen.findByText("failed");
    expect(failed.className, "a failed sheet should be red").toContain("text-[#f85555]");
    expect(screen.getByText("processing").className, "a sheet in progress should be amber").toContain("text-[#b8860b]");
    expect(screen.getByText("uploaded").className, "an uploaded sheet should be blue").toContain("text-[#388CFF]");
    expect(screen.getByText("weird").className, "an unknown status should be grey").toContain("text-[#8e8e8e]");
    expect(
      screen.getByText("not a date"),
      "a date the browser cannot read should be shown as the backend sent it",
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("—").length,
      "a row with no name, no status and no date should show dashes, not blanks",
    ).toBeGreaterThanOrEqual(3);
  });

  it("offers no download link for a sheet with no file name", async () => {
    getExcelFiles.mockResolvedValue({
      success: true,
      data: { data: [excelRow({ original_filename: "" })] },
    });
    await mount();
    await screen.findByText("completed");
    expect(
      screen.queryByRole("link", { name: "Download" }),
      "without a file name there is no address to download from",
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Download"),
      "the Download label should still be shown, greyed out",
    ).toBeInTheDocument();
  });
});

describe("Excel section — the notes window", () => {
  const withNotes = (over: Record<string, unknown> = {}) =>
    getExcelFiles.mockResolvedValue({
      success: true,
      data: { data: [excelRow({ processing_notes: "Row 4 has no price.", ...over })] },
    });

  it("stays open on a click inside and closes on the Close button", async () => {
    withNotes();
    await mount();
    await userEvent.click(await screen.findByRole("button", { name: "Notes" }));
    await userEvent.click(screen.getByText("Row 4 has no price."));
    expect(
      screen.getByText("Row 4 has no price."),
      "a click inside the notes window must not close it",
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(
      screen.queryByText("Row 4 has no price."),
      "Close should take the notes window away",
    ).not.toBeInTheDocument();
  });

  it("closes on a click on the dark backdrop, and leaves the name out when there is none", async () => {
    withNotes({ original_filename: "" });
    await mount();
    await userEvent.click(await screen.findByRole("button", { name: "Notes" }));
    const heading = screen.getByRole("heading", { name: "Notes" });
    expect(heading.textContent, "a sheet with no name should show a plain Notes title").toBe("Notes");
    await userEvent.click(heading.closest("[class*='bg-black']") as HTMLElement);
    expect(
      screen.queryByText("Row 4 has no price."),
      "a click on the backdrop should close the notes window",
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Template mode, counts, failed rows and the category question
// (docs/shop-excel-template-mode.md, ticket shop-excel-import-template-mode).
// ---------------------------------------------------------------------------

/** Stub the browser download: capture the name the <a download> was given. */
function captureDownloads() {
  const names: string[] = [];
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: () => "blob:file",
    revokeObjectURL: () => {},
  });
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      names.push(this.download);
    });
  return {
    names,
    restore: () => {
      click.mockRestore();
      vi.unstubAllGlobals();
    },
  };
}

describe("Excel section — counts, search and the products-only box", () => {
  it('shows "(N Products)" after a category the seller has products in, and nothing for an empty one', async () => {
    withTree();
    await mount();
    await categoriesLoaded();
    expect(
      await offered(),
      "each category should read as its full path, with the count only when the seller has products there",
    ).toEqual([
      "Clothes (37 Products)",
      "Clothes -> Men (12 Products)",
      "Clothes -> Men -> Shirts (5 Products)",
      "Shoes",
    ]);
  });

  it("indents sub categories one step and sub-sub categories two steps", async () => {
    withTree();
    await mount();
    const list = await openPicker();
    const indent = (id: number) => {
      const option = within(list)
        .getAllByRole("option")
        .find((o) => o.getAttribute("data-value") === String(id));
      return parseFloat(option?.style.paddingInlineStart ?? "0");
    };
    expect(indent(45), "a sub category should be indented more than its parent").toBeGreaterThan(indent(12));
    expect(
      indent(78),
      "a sub-sub category should be indented more than a sub category",
    ).toBeGreaterThan(indent(45));
  });

  it("the search box keeps only categories whose path matches, in any letter case", async () => {
    withTree();
    await mount();
    // The products-only box appears once the categories have loaded.
    await screen.findByRole("checkbox", { name: /show only categories that have my products/i });
    expect(
      screen.queryByRole("searchbox"),
      "the search box belongs inside the category picker, not as a separate field above it",
    ).toBeNull();
    const list = await openPicker();
    const search = screen.getByRole("searchbox", { name: /search categories/i });
    expect(
      list.parentElement?.contains(search),
      "the search box should sit in the opened picker, together with the category list",
    ).toBe(true);

    await userEvent.type(search, "MEN");
    expect(
      await offered(),
      'typing "MEN" should keep only the categories whose path contains "men"',
    ).toEqual(["Clothes -> Men (12 Products)", "Clothes -> Men -> Shirts (5 Products)"]);

    await userEvent.clear(search);
    expect((await offered()).length, "clearing the search should bring every category back").toBe(tree.length);

    await userEvent.type(search, "zzz");
    expect(
      screen.getByText(/no categories match/i),
      "a search that matches nothing should say so",
    ).toBeInTheDocument();
  });

  it("the picker works by keyboard: open, search, move and pick", async () => {
    withTree();
    await mount();
    const field = await categoriesLoaded();
    field.focus();
    await userEvent.keyboard("{ArrowDown}");
    const search = screen.getByRole("searchbox", { name: /search categories/i });
    expect(search, "opening the picker should put the cursor in its search box").toHaveFocus();
    await userEvent.type(search, "men");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(pickedId(), 'Down then Enter should pick the second match, "Clothes -> Men -> Shirts"').toBe("78");
    expect(screen.queryByRole("listbox"), "picking should close the picker").toBeNull();
    expect(field, "after a pick the focus should go back to the picker").toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox"), "Escape should close the picker").toBeNull();
    expect(pickedId(), "Escape must not change the pick").toBe("78");
  });

  it('"only categories that have my products" hides the empty ones and says how many are left', async () => {
    withTree();
    await mount();
    await categoriesLoaded();
    expect(
      onlyMine().closest("label")?.textContent,
      "the number of categories with products should show next to the box",
    ).toContain("3");

    await userEvent.click(onlyMine());
    expect(
      await offered(),
      "ticking the box should leave out Shoes, which has no products",
    ).not.toContain("Shoes");
    expect((await offered()).length, "the three categories with products should stay").toBe(3);

    await userEvent.click(onlyMine());
    expect(await offered(), "unticking the box should bring Shoes back").toContain("Shoes");
  });

  it("the products-only box cannot be ticked when the seller has no products anywhere", async () => {
    withTree(tree.map((c) => ({ ...c, products_count: 0 })));
    await mount();
    await categoriesLoaded();
    expect(onlyMine(), "with no products anywhere there is nothing to filter to").toBeDisabled();
  });

  it("ticking the products-only box clears a picked category that has no products", async () => {
    withTree();
    await mount();
    await categoriesLoaded();
    await pick(13);
    await userEvent.click(onlyMine());
    expect(pickedId(), "the hidden category must not stay picked").toBe("");
    expect(downloadButton(), "with no category the download must be off again").toBeDisabled();
  });
});

describe("Excel section — what to download", () => {
  it('offers "Add new products" and "Update my products", with "Add new products" chosen first', async () => {
    withTree();
    await mount();
    await categoriesLoaded();
    expect(addNew(), '"Add new products" should be chosen when nothing is remembered').toBeChecked();
    expect(updateMine(), '"Update my products" should be offered, not chosen').not.toBeChecked();
    expect(
      screen.getByText(/download an empty template: column headers and lists only/i),
      '"Add new products" should explain what the file holds',
    ).toBeInTheDocument();
    expect(
      screen.getByText(/download your products of this category with their current values/i),
      '"Update my products" should explain what the file holds',
    ).toBeInTheDocument();
  });

  it('"Add new products" asks for the empty template, even for a category with products', async () => {
    withTree();
    downloadExcelTemplate.mockResolvedValue({ blob: new Blob(["x"]), filename: "a.xlsx" });
    const downloads = captureDownloads();
    await mount();
    await categoriesLoaded();
    await pick(78);
    await userEvent.click(downloadButton());
    expect(
      downloadExcelTemplate,
      'a category with 5 products must still get the empty template under "Add new products"',
    ).toHaveBeenCalledWith(SELLER_ID, "78", "template", "Shirts_template.xlsx");
    downloads.restore();
  });

  it(`"Update my products" asks for the seller's products of the category`, async () => {
    withTree();
    downloadExcelTemplate.mockResolvedValue({ blob: new Blob(["x"]), filename: "a.xlsx" });
    const downloads = captureDownloads();
    await mount();
    await categoriesLoaded();
    await pick(78);
    await userEvent.click(updateMine());
    await userEvent.click(downloadButton());
    expect(
      downloadExcelTemplate,
      '"Update my products" must ask for the products, not the template',
    ).toHaveBeenCalledWith(SELLER_ID, "78", "products", "Shirts_products.xlsx");
    downloads.restore();
  });

  it('"Update my products" is off with no category, and off with a hint for a category with no products', async () => {
    withTree();
    await mount();
    await categoriesLoaded();
    expect(updateMine(), "with no category there are no products to update").toBeDisabled();
    expect(
      screen.queryByText(/you have no products in this category yet/i),
      "the hint is for an empty category, not for no category",
    ).not.toBeInTheDocument();

    await pick(13);
    expect(updateMine(), "Shoes has no products, so there is nothing to update").toBeDisabled();
    expect(
      screen.getByText(/you have no products in this category yet\. use add new products\./i),
      "an empty category should say why updating is off",
    ).toBeInTheDocument();
  });

  it('picking a category with no products moves the choice back to "Add new products"', async () => {
    withTree();
    await mount();
    await categoriesLoaded();
    await pick(78);
    await userEvent.click(updateMine());
    expect(updateMine(), "the seller chose to update Shirts").toBeChecked();
    await pick(13);
    expect(addNew(), 'Shoes has no products, so the choice must go back to "Add new products"').toBeChecked();
  });

  it("saves the downloaded file under an .xlsx name", async () => {
    withTree();
    downloadExcelTemplate.mockImplementation(
      async (_seller: string, _category: string, _mode: string, fallbackName: string) => ({
        blob: new Blob(["x"]),
        filename: fallbackName,
      }),
    );
    const downloads = captureDownloads();
    await mount();
    await categoriesLoaded();
    await pick(78);
    await userEvent.click(downloadButton());
    await waitFor(() => {
      expect(downloads.names.length, "no file was handed to the browser").toBe(1);
    });
    expect(downloads.names[0], "the saved file must be an Excel file named after the category").toBe(
      "Shirts_template.xlsx",
    );
    downloads.restore();
  });
});

describe("Excel section — remembering the last choice", () => {
  it("remembers category, box and choice for this seller, and not for another seller", async () => {
    withTree();
    const first = await mount();
    await categoriesLoaded();
    await pick(78);
    await userEvent.click(onlyMine());
    await userEvent.click(updateMine());
    first.unmount();

    const second = await mount();
    await categoriesLoaded();
    await waitFor(() => {
      expect(pickedId(), "the next visit should pick Shirts again").toBe("78");
    });
    expect(onlyMine(), "the next visit should tick the products-only box again").toBeChecked();
    expect(updateMine(), 'the next visit should choose "Update my products" again').toBeChecked();
    second.unmount();

    await mount("88");
    await categoriesLoaded();
    expect(pickedId(), "another seller must not get this seller's category").toBe("");
  });

  it("restores a choice that was stored before the tab opened", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ categoryId: "45", onlyWithProducts: false, mode: "products" }),
    );
    withTree();
    await mount();
    await categoriesLoaded();
    await waitFor(() => {
      expect(pickedId(), "the stored category should be picked on open").toBe("45");
    });
    expect(updateMine(), "the stored choice should survive the first render").toBeChecked();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}").mode,
      "opening the tab must not overwrite the stored choice with the defaults",
    ).toBe("products");
  });

  it('does not restore a category that is gone, nor "Update my products" for a category now empty', async () => {
    withTree();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ categoryId: "999", onlyWithProducts: false, mode: "products" }),
    );
    const gone = await mount();
    await categoriesLoaded();
    expect(pickedId(), "a category that is no longer offered must not be picked").toBe("");
    expect(addNew(), 'with no category the choice must be "Add new products"').toBeChecked();
    gone.unmount();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ categoryId: "13", onlyWithProducts: false, mode: "products" }),
    );
    const empty = await mount();
    await categoriesLoaded();
    await waitFor(() => {
      expect(pickedId(), "Shoes still exists, so it should be picked").toBe("13");
    });
    expect(addNew(), 'Shoes has no products now, so the choice must be "Add new products"').toBeChecked();
    empty.unmount();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ categoryId: "78", onlyWithProducts: false, mode: "anything&else=1" }),
    );
    await mount();
    await categoriesLoaded();
    await waitFor(() => {
      expect(pickedId(), "Shirts should be picked").toBe("78");
    });
    expect(addNew(), 'an unknown stored mode must fall back to "Add new products"').toBeChecked();
  });

  it("still works when the browser refuses to store or read the remembered choice", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage is off");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage is off");
    });
    withTree();
    await mount();
    expect(
      await categoriesLoaded(),
      "the categories should still load when storage throws",
    ).toBeInTheDocument();
    await pick(78);
    await userEvent.click(updateMine());
    expect(updateMine(), "the choice should still work when storage throws").toBeChecked();
    getItem.mockRestore();
    setItem.mockRestore();
  });
});

describe("Excel section — failed rows", () => {
  const withFiles = (rows: Record<string, unknown>[]) =>
    getExcelFiles.mockResolvedValue({ success: true, data: { data: rows } });

  it('offers "Download N failed rows" only for a sheet with failed rows', async () => {
    withFiles([
      excelRow({ id: 931, original_filename: "shirts.xlsx", upload_status: "completed_with_errors", failed_rows_count: 2 }),
      excelRow({ id: 932, original_filename: "clean.xlsx", failed_rows_count: 0 }),
      excelRow({ id: 933, original_filename: "old.xlsx" }),
    ]);
    await mount();
    const button = await screen.findByRole("button", { name: /download 2 failed rows/i });
    expect(
      button.getAttribute("title"),
      "the failed-rows button should say what to do with the file",
    ).toMatch(/fix these rows and upload the file again/i);
    expect(
      screen.getAllByRole("button", { name: /failed rows/i }).length,
      "a sheet with no failed rows, or no count at all, must not offer the button",
    ).toBe(1);
  });

  it("downloads the failed rows of the sheet that was clicked", async () => {
    withFiles([
      excelRow({ id: 931, original_filename: "shirts.xlsx", failed_rows_count: 2 }),
      excelRow({ id: 934, original_filename: "bags.xlsx", failed_rows_count: 1 }),
    ]);
    downloadFailedRows.mockImplementation(
      async (_seller: string, _id: number, fallbackName: string) => ({
        blob: new Blob(["x"]),
        filename: fallbackName,
      }),
    );
    const downloads = captureDownloads();
    await mount();
    await userEvent.click(await screen.findByRole("button", { name: /download 2 failed rows/i }));
    expect(
      downloadFailedRows,
      "the failed rows of shirts.xlsx (id 931) should be asked for, under a name built from it",
    ).toHaveBeenCalledWith(SELLER_ID, 931, "shirts_failed_rows.xlsx");
    await waitFor(() => {
      expect(downloads.names, "the failed rows file was not handed to the browser").toEqual([
        "shirts_failed_rows.xlsx",
      ]);
    });
    downloads.restore();
  });

  it("after the failed rows download, reminds the seller how to upload the file again", async () => {
    withFiles([excelRow({ id: 931, original_filename: "shirts.xlsx", failed_rows_count: 2 })]);
    downloadFailedRows.mockResolvedValue({ blob: new Blob(["x"]), filename: "shirts_failed_rows.xlsx" });
    const downloads = captureDownloads();
    await mount();
    await userEvent.click(await screen.findByRole("button", { name: /download 2 failed rows/i }));
    expect(
      await screen.findByText(
        /fix the rows, keep the id column, and upload this file again\. the reason column is ignored\./i,
      ),
      "after the download the seller should be told how to send the file back",
    ).toBeInTheDocument();
    downloads.restore();
  });

  it("shows the backend's words when the failed rows cannot be downloaded", async () => {
    withFiles([excelRow({ id: 931, original_filename: "shirts.xlsx", failed_rows_count: 2 })]);
    downloadFailedRows.mockRejectedValue(new Error("This file has no failed rows."));
    const downloads = captureDownloads();
    await mount();
    await userEvent.click(await screen.findByRole("button", { name: /download 2 failed rows/i }));
    expect(
      await screen.findByText("This file has no failed rows."),
      "a refused failed-rows download should be reported in the core backend's own words",
    ).toBeInTheDocument();
    expect(downloads.names, "no file may be saved when the download was refused").toEqual([]);
    downloads.restore();
  });

  it('shows "Completed with errors" in its own colour', async () => {
    withFiles([
      excelRow({ id: 1, upload_status: "completed_with_errors" }),
      excelRow({ id: 2, upload_status: "completed" }),
      excelRow({ id: 3, upload_status: "failed" }),
    ]);
    await mount();
    const badge = await screen.findByText(/^completed with errors$/i);
    const done = screen.getByText("completed").className;
    const failed = screen.getByText("failed").className;
    expect(badge.className, "the new status must not look like a finished sheet").not.toBe(done);
    expect(badge.className, "the new status must not look like a failed sheet").not.toBe(failed);
    expect(
      badge.className,
      "the new status must have a colour of its own, not the grey of an unknown status",
    ).not.toContain("text-[#8e8e8e]");
  });
});

describe("Excel section — the category question on upload", () => {
  const mismatch = {
    success: false,
    httpStatus: 409,
    message: "This file is for another category than the one selected.",
    data: {
      category_mismatch: true,
      file_category: { id: 78, name: "Shirts" },
      chosen_category: { id: 13, name: "Shoes" },
    },
  };

  async function uploadWith(categoryId?: number) {
    withTree();
    uploadExcelFile.mockResolvedValue({ key: "excel/products.xlsx" });
    await mount();
    await categoriesLoaded();
    if (categoryId) await pick(categoryId);
    await userEvent.upload(fileInput(), sheet("products.xlsx"));
    await screen.findByText("products.xlsx");
    await userEvent.click(screen.getByRole("button", { name: /Upload Excel/ }));
  }

  it("sends the picked category with the upload", async () => {
    processExcel.mockResolvedValue({ success: true });
    await uploadWith(13);
    await waitFor(() => {
      expect(
        processExcel,
        "with Shoes picked, the core backend should be told which category the seller expects",
      ).toHaveBeenCalledWith(SELLER_ID, "excel/products.xlsx", { expectedCategoryId: 13 });
    });
  });

  it("sends no expected category when no category is picked", async () => {
    processExcel.mockResolvedValue({ success: true });
    await uploadWith();
    await waitFor(() => {
      expect(
        processExcel,
        "with no category picked there is nothing to check, so none may be sent",
      ).toHaveBeenCalledWith(SELLER_ID, "excel/products.xlsx", {});
    });
  });

  it("asks before importing a file made for another category, without showing an error", async () => {
    processExcel.mockResolvedValue(mismatch);
    await uploadWith(13);
    const dialog = await screen.findByRole("dialog");
    expect(
      dialog.textContent,
      "the question should name the file's own category and the picked one",
    ).toMatch(/Shirts.*Shoes.*Shirts/);
    expect(
      screen.queryByText(mismatch.message),
      "the category question must not be shown as an error",
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-pw="seller-excel-status"]'),
      "no red error box may appear for the category question",
    ).toBeNull();
  });

  it('"Yes" imports the file into its own category without uploading it again', async () => {
    processExcel.mockResolvedValueOnce(mismatch).mockResolvedValueOnce({ success: true });
    const loadsBefore = getExcelFiles.mock.calls.length;
    await uploadWith(13);
    await userEvent.click(await screen.findByRole("button", { name: /^yes$/i }));
    await waitFor(() => {
      expect(
        processExcel,
        "Yes should send the same file again, with the confirmation",
      ).toHaveBeenLastCalledWith(SELLER_ID, "excel/products.xlsx", {
        expectedCategoryId: 13,
        confirmCategory: true,
      });
    });
    expect(uploadExcelFile, "the media server must not get the file a second time").toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText("File Uploaded And Processed Successfully!"),
      "a confirmed import should end like any finished upload",
    ).toBeInTheDocument();
    expect(
      getExcelFiles.mock.calls.length,
      "the files table should reload after the confirmed import",
    ).toBeGreaterThan(loadsBefore + 1);
  });

  it('"No" cancels the import and sends nothing more', async () => {
    processExcel.mockResolvedValue(mismatch);
    await uploadWith(13);
    await userEvent.click(await screen.findByRole("button", { name: /^no$/i }));
    expect(
      await screen.findByText(/upload cancelled\. nothing was imported\./i),
      "No should tell the seller that nothing was imported",
    ).toBeInTheDocument();
    expect(processExcel, "No must not send the file to the core backend again").toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog"), "the question should close after No").not.toBeInTheDocument();
  });

  it("a 409 that is not about the category is shown as an error, as before", async () => {
    processExcel.mockResolvedValue({ success: false, httpStatus: 409, message: "Already imported." });
    await uploadWith(13);
    expect(
      await screen.findByText("Already imported."),
      "any other refusal of the core backend should still be shown in its own words",
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog"), "only the category answer may ask a question").not.toBeInTheDocument();
  });
});
