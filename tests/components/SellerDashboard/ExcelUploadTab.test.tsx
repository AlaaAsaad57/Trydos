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

vi.mock("services/sellerDashboard", () => ({
  default: {
    getExcelCategories: (...a: unknown[]) => getExcelCategories(...a),
    getExcelFiles: (...a: unknown[]) => getExcelFiles(...a),
    downloadExcelTemplate: (...a: unknown[]) => downloadExcelTemplate(...a),
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

async function mount() {
  return renderWithProviders(
    <ExcelUploadTab sellerId={SELLER_ID} language="en" />,
    { path: `/sellerProfile/sellerDashboard/${SELLER_ID}` },
  );
}

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
  ]) {
    spy.mockReset();
  }
  getExcelCategories.mockResolvedValue({
    success: true,
    data: { categories: [{ id: 3, display_name: "Shoes" }] },
  });
  getExcelFiles.mockResolvedValue({ success: true, data: { data: [] } });
});

describe("Excel section — picking a category", () => {
  it("lists the categories the shop backend offers", async () => {
    await mount();
    expect(
      await screen.findByRole("option", { name: "Shoes" }),
      "the categories from the shop backend should fill the select",
    ).toBeInTheDocument();
  });

  it("falls back to the id when a category has no name", async () => {
    getExcelCategories.mockResolvedValue({
      success: true,
      data: { categories: [{ id: 9 }] },
    });
    await mount();
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
      await screen.findByRole("button", { name: /Download Template/ }),
      "there is no template until the seller says which category it is for",
    ).toBeDisabled();
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
    await screen.findByRole("option", { name: "Shoes" });
    await userEvent.selectOptions(screen.getAllByRole("combobox")[0], "3");
    await userEvent.click(
      screen.getByRole("button", { name: /Download Template/ }),
    );

    expect(
      downloadExcelTemplate,
      "the template request should name the shop and the picked category",
    ).toHaveBeenCalledWith(SELLER_ID, "3");

    vi.unstubAllGlobals();
  });

  it("says why the template could not be prepared", async () => {
    downloadExcelTemplate.mockRejectedValue(
      new Error("The template service is down."),
    );
    await mount();
    await screen.findByRole("option", { name: "Shoes" });
    await userEvent.selectOptions(screen.getAllByRole("combobox")[0], "3");
    await userEvent.click(
      screen.getByRole("button", { name: /Download Template/ }),
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
    await screen.findByRole("option", { name: "Shoes" });

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
    await screen.findByRole("option", { name: "Shoes" });

    const dropZone = screen
      .getByText(/Drag & drop Excel file here/)
      .closest("[class*='border-dashed']")!;
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [sheet("photo.png")] },
    });

    expect(
      await screen.findByText(
        "Please upload a valid Excel file (.xlsx, .xls, .xlsm, .xlsb)",
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
    await screen.findByRole("option", { name: "Shoes" });
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
    await screen.findByRole("option", { name: "Shoes" });
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
    ).toHaveBeenCalledWith(SELLER_ID, "excel/products.xlsx");
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
    await screen.findByRole("option", { name: "Shoes" });
    const dropZone = screen
      .getByText(/Drag & drop Excel file here/)
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
      screen.queryByText("Please upload a valid Excel file (.xlsx, .xls, .xlsm, .xlsb)"),
      "a drop that carries no file must not be refused as a wrong file",
    ).not.toBeInTheDocument();
  });

  it("does nothing when the picker is closed without a file", async () => {
    await mount();
    await screen.findByRole("option", { name: "Shoes" });
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
