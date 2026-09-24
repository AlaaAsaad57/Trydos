// The "return this product" screen (components/setting/orders/ReturnOrderItemWrapper.tsx).
//
// It loads the return reasons, lets the shopper pick how many pieces and one
// reason (a reason that costs more than the product cannot be picked), and
// needs at least one photo. With a reason and a photo the button asks for the
// return confirmation; otherwise it reads Close and goes back. The photo
// uploader is stubbed with its callbacks exposed as buttons.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const orderService = vi.hoisted(() => ({
  getReturnReasons: vi.fn(),
  removeImage: vi.fn(),
}));
vi.mock("services/order", () => ({ default: orderService }));

const logError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, LogError: logError };
});

const removeOutcome = vi.hoisted(() => ({ error: null as any }));
vi.mock("components/Orders/UploadImageComponent", () => ({
  default: ({ removeImageAction, setImages, images, setLoading }: any) => (
    <div data-testid="uploader" data-images={images.join(",")}>
      <button onClick={() => setImages([...images, "new.png"])}>add photo</button>
      <button
        onClick={() =>
          removeImageAction("old.png").catch((e: any) => (removeOutcome.error = e))
        }
      >
        remove photo
      </button>
      <button onClick={() => setLoading(true)}>photo busy</button>
    </div>
  ),
}));

import ReturnOrderItemWrapper from "components/setting/orders/ReturnOrderItemWrapper";
import { buildOrderLine } from "../../../fixtures/order";
import { renderWithProviders, screen, userEvent, waitFor } from "../../../render";

const REASONS = [
  { id: 1, reason_ae_en: "Wrong size", is_cost_by_system: 1, cost: 0 },
  { id: 2, reason_ae_en: "Changed mind", is_cost_by_system: 0, cost: 5 },
  { id: 3, reason_ae_en: "Too costly", is_cost_by_system: 0, cost: 1000 },
];

beforeEach(() => {
  orderService.getReturnReasons.mockReset();
  orderService.getReturnReasons.mockResolvedValue({ data: { return_reasons: REASONS } });
  orderService.removeImage.mockReset();
  removeOutcome.error = null;
});
afterEach(() => vi.clearAllMocks());

function existingReturn(overrides: any = {}) {
  return {
    return_requests_data: [
      {
        order_id: 1,
        order_details: [
          {
            detail_id: 1,
            already_return: true,
            img: ["old.png"],
            return_request_product_reason_id: 2,
            return_request_product_quantity: "2",
            return_request_product_id: 77,
            ...overrides,
          },
        ],
      },
    ],
  } as any;
}

async function renderReturn(opts: { returnDetails?: any; qty?: number; isRtl?: boolean } = {}) {
  const props = {
    item: buildOrderLine({ id: 1, qty: opts.qty ?? 3 }),
    returnDetails: opts.returnDetails ?? null,
    order_id: 1,
    isRtl: opts.isRtl ?? false,
    backToMain: vi.fn(),
    setShouldConfirmReturn: vi.fn(),
  };
  await renderWithProviders(<ReturnOrderItemWrapper {...props} />, {
    store: { currency: { symbol: "$", decimal_digits: 2 } },
  });
  await screen.findByText("Wrong size");
  return props;
}

const reason = (text: string) => screen.getByText(text).closest("[style]") as HTMLElement;
const pieces = () => screen.getByText("enter number of pieces you want to return").nextElementSibling!.textContent;
const qtyButtons = () =>
  screen.getByText("enter number of pieces you want to return").parentElement!.parentElement!.querySelectorAll("button");

describe("a new return", () => {
  it("starts at the full quantity, can go down to 1 and back up", async () => {
    await renderReturn({ isRtl: true });
    expect(screen.getByText("Return This Product"), "a new return is not titled as a return").toBeInTheDocument();
    expect(pieces(), "the pieces do not start at the line quantity").toBe("3");
    const user = userEvent.setup();
    await user.click(qtyButtons()[0]);
    await user.click(qtyButtons()[0]);
    expect(pieces(), "the pieces did not go down to 1").toBe("1");
    await user.click(qtyButtons()[0]);
    expect(pieces(), "the pieces went up when the add button was expected").toBe("2");
  });

  it("goes back with Close when no reason or photo is chosen", async () => {
    const props = await renderReturn();
    await userEvent.setup().click(screen.getByText("Close"));
    expect(props.backToMain, "Close did not go back").toHaveBeenCalled();
    expect(props.setShouldConfirmReturn, "an incomplete return asked for confirmation").not.toHaveBeenCalled();
  });

  it("does not let a reason that costs more than the product be picked, and toggles a reason", async () => {
    await renderReturn();
    const user = userEvent.setup();
    expect(reason("Too costly").className, "the too-costly reason is not faded").toContain("opacity-65");
    await user.click(reason("Too costly"));
    expect(screen.queryByTestId("uploader"), "a too-costly reason could be picked").not.toBeInTheDocument();
    await user.click(reason("Wrong size"));
    expect(screen.getByTestId("uploader"), "picking a reason did not ask for photos").toBeInTheDocument();
    await user.click(reason("Wrong size"));
    expect(screen.queryByTestId("uploader"), "a second tap did not unpick the reason").not.toBeInTheDocument();
  });

  it("asks for confirmation with the reason, the photo and the pieces", async () => {
    const props = await renderReturn();
    const user = userEvent.setup();
    await user.click(reason("Changed mind"));
    await user.click(screen.getByText("add photo"));
    await user.click(screen.getByText("Return Request"));
    expect(props.setShouldConfirmReturn, "the confirmation did not get the return details").toHaveBeenCalledWith(
      expect.objectContaining({
        images: ["new.png"],
        reasons: REASONS[1],
        additon_cost: true,
        qty: 3,
        update: undefined,
      }),
    );
  });

  it("ignores the button while a photo uploads, and removing a photo with no saved return sends nothing", async () => {
    const props = await renderReturn();
    const user = userEvent.setup();
    await user.click(reason("Wrong size"));
    await user.click(screen.getByText("remove photo"));
    expect(orderService.removeImage, "a photo was removed on the server for an unsaved return").not.toHaveBeenCalled();
    await user.click(screen.getByText("photo busy"));
    await user.click(screen.getByTestId("uploader").nextElementSibling!.firstElementChild as HTMLElement);
    expect(props.backToMain, "the button worked while a photo uploads").not.toHaveBeenCalled();
  });
});

describe("updating a saved return", () => {
  it("starts from the saved reason, photos and pieces", async () => {
    await renderReturn({ returnDetails: existingReturn() });
    expect(
      screen.getByText("Update Return Request For This Product"),
      "a saved return is not titled as an update",
    ).toBeInTheDocument();
    expect(pieces(), "the saved pieces were not used").toBe("2");
    expect(screen.getByTestId("uploader").dataset.images, "the saved photos were not loaded").toBe("old.png");
  });

  it("removes a saved photo on the server", async () => {
    orderService.removeImage.mockResolvedValue(undefined);
    await renderReturn({ returnDetails: existingReturn() });
    await userEvent.setup().click(screen.getByText("remove photo"));
    await waitFor(() =>
      expect(orderService.removeImage, "the saved photo was not removed on the server").toHaveBeenCalledWith({
        return_request_product_id: 77,
        img: "old.png",
      }),
    );
  });

  it("logs a refused photo removal and passes the error on", async () => {
    orderService.removeImage.mockImplementation(() => {
      throw new Error("refused");
    });
    await renderReturn({ returnDetails: existingReturn() });
    await userEvent.setup().click(screen.getByText("remove photo"));
    await waitFor(() =>
      expect(removeOutcome.error?.message, "the refused removal was not passed on to the uploader").toBe("refused"),
    );
    expect(logError.mock.calls[0]?.[0]?.scenario, "the refused removal was not logged").toBe(
      "Error In removeImageAction in ReturnOrderItemWrapper",
    );
  });

  it("keeps no reason picked when the saved reason is not offered, and uses the line qty when none was saved", async () => {
    await renderReturn({
      returnDetails: existingReturn({ return_request_product_reason_id: 99, return_request_product_quantity: undefined, img: undefined }),
    });
    expect(screen.queryByTestId("uploader"), "an unknown saved reason was picked").not.toBeInTheDocument();
    expect(pieces(), "a return with no saved pieces did not start at the line quantity").toBe("3");
  });
});

describe("loading the reasons", () => {
  it("logs a failed load and shows no reasons", async () => {
    orderService.getReturnReasons.mockResolvedValue(null);
    await renderWithProviders(
      <ReturnOrderItemWrapper
        item={buildOrderLine({ qty: 1 })}
        returnDetails={null as any}
        order_id={1}
        isRtl={false}
        backToMain={vi.fn()}
        setShouldConfirmReturn={vi.fn()}
      />,
    );
    await waitFor(() =>
      expect(logError.mock.calls[0]?.[0]?.scenario, "a failed reasons load was not logged").toBe(
        "Error In getReasons in ReturnOrderItemWrapper",
      ),
    );
    expect(screen.queryByText("Wrong size"), "reasons showed after a failed load").not.toBeInTheDocument();
  });
});
