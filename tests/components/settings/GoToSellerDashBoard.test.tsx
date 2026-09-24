// The seller entry on the settings page (components/settings/GoToSellerDashBoard.tsx).
//
// A guest sees nothing. A signed-in shopper sees a spinner while the shop
// permissions load, then either the "Sales" card (has a shop), the "Become a
// seller" button (no shop), or an error with a retry. The permissions call
// and the modal behind the button are replaced.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getShopes = vi.hoisted(() => vi.fn());
vi.mock("services/sellerDashboard", () => ({ default: { getShopes } }));

const logError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, LogError: logError };
});

vi.mock("components/settings/BecomeSellerModal", () => ({
  default: ({ onClose }: any) => (
    <div data-testid="become-seller-modal">
      <button onClick={onClose}>close modal</button>
    </div>
  ),
}));

import GoToSellerDashBoard from "components/settings/GoToSellerDashBoard";
import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

const sel = (pw: string) =>
  document.querySelector(`[data-pw="${pw}"]`) as HTMLElement | null;

beforeEach(() => {
  getShopes.mockReset();
  logError.mockReset();
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("who sees the seller entry", () => {
  it.each([null, undefined, 0, "0", "null", "undefined", "12"])(
    "a guest whose phone is %j sees nothing",
    async (phone) => {
      const { container } = await renderWithProviders(
        <GoToSellerDashBoard language="en" />,
        { store: { userProfile: { phone } } },
      );
      expect(container.innerHTML, "a guest was shown a seller entry").toBe("");
      expect(
        getShopes,
        "a guest's shop permissions were requested",
      ).not.toHaveBeenCalled();
    },
  );

  it("a profile with a real phone loads the permissions and shows the Sales card", async () => {
    getShopes.mockResolvedValue({ success: true, data: [{ id: 1 }] });
    await renderWithProviders(<GoToSellerDashBoard language="en" />, {
      store: { userProfile: { phone: "+10000000000" } },
    });
    await waitFor(() =>
      expect(
        sel("seller-sales"),
        "a shop owner did not see the Sales card",
      ).not.toBeNull(),
    );
    expect(
      getShopes,
      "the permissions were not asked for quietly",
    ).toHaveBeenCalledWith(true);
  });
});

describe("a signed-in shopper (server cookie)", () => {
  it("shows a spinner while the permissions load", async () => {
    getShopes.mockReturnValue(new Promise(() => {}));
    await renderWithProviders(<GoToSellerDashBoard language="en" isAuthed />);
    expect(
      sel("seller-sales"),
      "the Sales card showed before the permissions came back",
    ).toBeNull();
    expect(
      sel("become-seller-btn"),
      "the seller button showed before the permissions came back",
    ).toBeNull();
  });

  it("shows the Sales card for a nested shop list, and tapping it opens the seller profile", async () => {
    const location = { href: "", pathname: "/gb-ar/settings" };
    getShopes.mockResolvedValue({ success: true, data: { data: [{ id: 1 }] } });
    await renderWithProviders(<GoToSellerDashBoard language="ar" isAuthed />, {
      language: "ar",
    });
    await waitFor(() => expect(sel("seller-sales")).not.toBeNull());
    vi.stubGlobal("location", location);
    expect(
      sel("seller-sales")!.className,
      "the Sales card is not right-aligned in Arabic",
    ).toContain("items-end");
    await userEvent.setup().click(sel("seller-sales")!);
    expect(
      location.href,
      "tapping the Sales card did not open the seller profile",
    ).toBe("/gb-ar/sellerProfile");
  });

  it.each([
    ["a 204", { httpStatus: 204 }],
    ["an empty list", { success: true, data: [] }],
    ["an answer with no list", { success: true, data: {} }],
  ])(
    "offers to become a seller after %s, and the button opens and closes the modal",
    async (_, reply) => {
      getShopes.mockResolvedValue(reply);
      await renderWithProviders(<GoToSellerDashBoard language="en" isAuthed />);
      await waitFor(() =>
        expect(
          sel("become-seller-btn"),
          "a shopper with no shop was not offered to become a seller",
        ).not.toBeNull(),
      );

      const user = userEvent.setup();
      await user.click(sel("become-seller-btn")!);
      expect(
        screen.getByTestId("become-seller-modal"),
        "the seller button did not open the modal",
      ).toBeInTheDocument();
      await user.click(screen.getByText("close modal"));
      expect(
        screen.queryByTestId("become-seller-modal"),
        "closing the modal left it open",
      ).not.toBeInTheDocument();
    },
  );

  it("shows an error with a retry when the permissions fail, and retry loads them again", async () => {
    getShopes
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValueOnce({ success: true, data: [{ id: 1 }] });
    await renderWithProviders(<GoToSellerDashBoard language="ku" isAuthed />, {
      language: "ku",
    });
    await waitFor(() =>
      expect(
        sel("seller-permissions-error"),
        "a failed permissions call did not show the error",
      ).not.toBeNull(),
    );
    expect(
      sel("seller-permissions-error")!.className,
      "the error row is not reversed for Kurdish",
    ).toContain("flex-row-reverse");

    await userEvent.setup().click(sel("retry-permissions-btn")!);
    await waitFor(() =>
      expect(
        sel("seller-sales"),
        "retry did not load the permissions again",
      ).not.toBeNull(),
    );
  });

  it.each([
    [new Error("down"), "down"],
    ["plain failure", "plain failure"],
  ])(
    "logs a permissions call that throws (%s) and shows the error",
    async (thrown, logged) => {
      getShopes.mockRejectedValue(thrown);
      await renderWithProviders(<GoToSellerDashBoard language="en" isAuthed />);
      await waitFor(() => expect(sel("seller-permissions-error")).not.toBeNull());
      expect(
        logError,
        "the thrown permissions call was not logged with its message",
      ).toHaveBeenCalledWith({
        scenario: "GoToSellerDashBoard.getPermission",
        error: logged,
      });
    },
  );
});
