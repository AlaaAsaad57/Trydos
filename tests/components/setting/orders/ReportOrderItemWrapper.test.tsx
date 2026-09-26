// The "report this product" sheet (components/setting/orders/ReportOrderItemWrapper.tsx).
//
// The shopper ticks report points and/or writes a note, may add one photo
// (JPEG/PNG/WebP, 4 MB or less), and submits. Submit is idle until a point is
// ticked or a note is written. The sheet (BottomSheet) is stubbed.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const reportOrderItem = vi.hoisted(() => vi.fn());
vi.mock("services/order", () => ({ default: { ReportOrderItem: reportOrderItem } }));

const notifications = vi.hoisted(() => ({
  showErrorNotification: vi.fn(),
  showSuccessNotification: vi.fn(),
}));
vi.mock("store/notifications/reducer", () => notifications);

const logError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, LogError: logError };
});

vi.mock("components/global/BottomSheet", () => ({
  default: ({ children, onClose }: any) => (
    <div data-testid="sheet">
      <button onClick={onClose}>sheet close</button>
      {children}
    </div>
  ),
}));

import ReportOrderItemWrapper from "components/setting/orders/ReportOrderItemWrapper";
import { buildOrder, buildOrderLine } from "../../../fixtures/order";
import { fireEvent, renderWithProviders, screen, userEvent, waitFor } from "../../../render";

beforeEach(() => {
  reportOrderItem.mockReset();
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:report-photo"),
    revokeObjectURL: vi.fn(),
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function renderSheet(isRtl = false) {
  const props = {
    item: buildOrderLine({ id: 11, product_id: 22 }),
    parentOrder: buildOrder({ id: 3, order_group_id: "g-3" }),
    isRtl,
    backToMain: vi.fn(),
    close: vi.fn(),
    update: vi.fn(async () => {}),
  };
  await renderWithProviders(<ReportOrderItemWrapper {...props} />);
  return props;
}

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;
const pick = (file?: File) => fireEvent.change(fileInput(), { target: { files: file ? [file] : [] } });
const option = (label: string) => screen.getByText(label).parentElement as HTMLElement;

describe("filling in the report", () => {
  it("does nothing on Submit with nothing ticked or written", async () => {
    await renderSheet(true);
    await userEvent.setup().click(screen.getByText("Submit Report"));
    expect(reportOrderItem, "an empty report was sent").not.toHaveBeenCalled();
  });

  it("ticks and unticks a point", async () => {
    await renderSheet();
    const user = userEvent.setup();
    await user.click(option("Damaged"));
    expect(option("Damaged").getAttribute("style"), "a ticked point is not marked").toContain("1px solid");
    await user.click(option("Damaged"));
    expect(option("Damaged").getAttribute("style"), "an unticked point is still marked").not.toContain("1px solid");
  });

  it("refuses a photo of the wrong type or over 4 MB, and ignores an empty pick", async () => {
    await renderSheet();
    pick();
    pick(new File(["x"], "a.gif", { type: "image/gif" }));
    expect(notifications.showErrorNotification, "a GIF was not refused").toHaveBeenCalledWith(
      "Please choose a JPEG, PNG or WebP image",
    );
    const big = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: 4097 * 1024 });
    pick(big);
    expect(notifications.showErrorNotification, "a photo over 4 MB was not refused").toHaveBeenCalledWith(
      "The photo must be 4 MB or less",
    );
    expect(screen.queryByAltText("Report Photo"), "a refused photo was attached").not.toBeInTheDocument();
  });

  it("attaches a photo, previews it, and can remove it; Add Photo opens the picker", async () => {
    await renderSheet();
    const click = vi.spyOn(fileInput(), "click");
    await userEvent.setup().click(screen.getByText("Add Photo"));
    expect(click, "Add Photo did not open the file picker").toHaveBeenCalled();

    pick(new File(["x"], "p.png", { type: "image/png" }));
    expect(
      (await screen.findByAltText("Report Photo")).getAttribute("src"),
      "the attached photo is not previewed",
    ).toBe("blob:report-photo");
    await userEvent.setup().click(screen.getByText("X"));
    expect(screen.queryByAltText("Report Photo"), "removing the photo left it attached").not.toBeInTheDocument();
    expect(URL.revokeObjectURL, "the preview address was not released").toHaveBeenCalledWith("blob:report-photo");
  });
});

describe("submitting", () => {
  it("sends only the ticked points, the trimmed note and the photo, then refreshes and closes", async () => {
    reportOrderItem.mockResolvedValue(undefined);
    const props = await renderSheet();
    const user = userEvent.setup();
    await user.click(option("Damaged"));
    await user.type(screen.getByPlaceholderText("Write More Details Here"), "  torn box  ");
    const photo = new File(["x"], "p.webp", { type: "image/webp" });
    pick(photo);
    await user.click(screen.getByText("Submit Report"));

    await waitFor(() => expect(props.close, "a sent report did not close the sheet").toHaveBeenCalled());
    expect(reportOrderItem, "the report did not carry the right points, note and photo").toHaveBeenCalledWith({
      order_id: 3,
      order_detail_id: 11,
      product_id: 22,
      order_group_id: "g-3",
      points: [{ point: "product_quality", values: ["damaged"] }],
      note: "torn box",
      image: photo,
    });
    expect(notifications.showSuccessNotification, "the sent report was not confirmed").toHaveBeenCalledWith(
      "We received your report. Thanks for your thoughts",
    );
    expect(props.update, "the order was not refreshed after the report").toHaveBeenCalled();
  });

  it("ignores a second Submit while sending", async () => {
    reportOrderItem.mockReturnValue(new Promise(() => {}));
    await renderSheet();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Write More Details Here"), "late");
    const submitButton = screen.getByText("Submit Report");
    await user.click(submitButton);
    await user.click(submitButton);
    expect(reportOrderItem, "a second Submit sent the report twice").toHaveBeenCalledTimes(1);
  });

  it("reports a refused report and stays open", async () => {
    reportOrderItem.mockImplementation(() => {
      throw new Error("refused");
    });
    const props = await renderSheet();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Write More Details Here"), "late");
    await user.click(screen.getByText("Submit Report"));
    await waitFor(() =>
      expect(notifications.showErrorNotification, "a refused report was not reported").toHaveBeenCalledWith(
        "Could not submit your report. Please try again",
      ),
    );
    expect(logError.mock.calls[0]?.[0]?.scenario, "a refused report was not logged").toBe(
      "Error In submit in ReportOrderItemWrapper",
    );
    expect(props.close, "a refused report closed the sheet").not.toHaveBeenCalled();
  });

  it("Cancel goes back, and the sheet close closes", async () => {
    const props = await renderSheet();
    const user = userEvent.setup();
    await user.click(screen.getByText("Cancel"));
    expect(props.backToMain, "Cancel did not go back to the options").toHaveBeenCalled();
    await user.click(screen.getByText("sheet close"));
    expect(props.close, "the sheet close did not close").toHaveBeenCalled();
  });
});
