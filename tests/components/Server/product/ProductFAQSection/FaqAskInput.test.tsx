// The "ask the seller" box under a product's FAQ. It posts the question to the
// comments backend and shows it at once, in this widget and in every other.
import { beforeEach, describe, expect, it, vi } from "vitest";

const LogError = vi.fn();
const showErrorNotification = vi.fn();

vi.mock("utils/fetchData", async () => {
  const { makeFetchDataMock } = await import("../../../../mocks/fetchData");
  return makeFetchDataMock();
});
vi.mock("services/auth", () => ({
  default: {
    UserID: vi.fn(() => 5),
    User: vi.fn(() => ({ name: "Lina", image: "l.png" })),
  },
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  LogError: (...a: any[]) => LogError(...a),
}));
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  showErrorNotification: (...a: any[]) => showErrorNotification(...a),
}));

import { fetchData } from "utils/fetchData";
import { AskInput } from "components/Server/product/ProductFAQSection/FaqAskInput";

import { fireEvent, renderWithProviders, screen, userEvent, waitFor } from "../../../../render";

const signedIn = { user: { id: 5, phone: "0999" }, userProfile: { id: 5 } };

const renderInput = async (props: Record<string, any> = {}, store: Record<string, any> = signedIn) => {
  const spies = {
    setCommentsData: vi.fn(),
    appendFaqComment: vi.fn(),
    setShouldUpdateCommentsCount: vi.fn(),
  };
  await renderWithProviders(
    <AskInput
      language="en"
      setCommentsData={spies.setCommentsData}
      color="red"
      size="M"
      owner_id={7}
      owner_type="shop"
      productId={9}
      {...props}
    />,
    { store: { ...store, appendFaqComment: spies.appendFaqComment, setShouldUpdateCommentsCount: spies.setShouldUpdateCommentsCount } },
  );
  return spies;
};

const input = () => document.querySelector('[data-pw="faq-ask-input"]') as HTMLInputElement;
const type = (text: string) => fireEvent.change(input(), { target: { value: text } });
const send = () => userEvent.click(document.querySelector('[data-pw="faq-ask-send"]') as HTMLElement);

describe("asking the seller a question", () => {
  beforeEach(() => {
    (fetchData as any).mockReset();
    LogError.mockReset();
    showErrorNotification.mockReset();
  });

  it("posts the question with the variant and shows it everywhere", async () => {
    (fetchData as any).mockResolvedValue({ success: true, data: { comment_id: 77 } });
    const spies = await renderInput();
    type("is it warm?");
    await send();
    await waitFor(() => expect(spies.setCommentsData, "the new question should be shown here").toHaveBeenCalled());
    const body = JSON.parse((fetchData as any).mock.calls[0][0].body);
    expect(body, "the question must be posted for this product, owner and variant").toEqual(
      expect.objectContaining({
        text: "is it warm?",
        product_id: "9",
        user_id: "5",
        owner_id: "7",
        owner_type: "shop",
        variant: "red-M",
        user_type: "customer",
      }),
    );
    expect(spies.setCommentsData.mock.calls[0][0], "the shown question should carry the new id").toEqual(
      expect.objectContaining({ id: 77, comment: "is it warm?", isOwner: true, has_reply: false }),
    );
    expect(spies.appendFaqComment, "every other FAQ widget should get it too").toHaveBeenCalledWith(
      9,
      expect.objectContaining({ id: 77 }),
    );
    expect(spies.setShouldUpdateCommentsCount, "the question count should refresh").toHaveBeenCalledWith(true);
    expect(input().value, "the box should be emptied").toBe("");
  });

  it("sends on Enter, and not with an empty box", async () => {
    (fetchData as any).mockResolvedValue({ success: true, data: { comment_id: 78 } });
    await renderInput({ color: null, size: null, language: "ar" });
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(fetchData, "an empty box must not send").not.toHaveBeenCalled();
    type("hi");
    fireEvent.keyDown(input(), { key: "a" });
    fireEvent.keyDown(input(), { key: "Enter" });
    await waitFor(() => expect(fetchData, "Enter should send the question").toHaveBeenCalledTimes(1));
    expect(JSON.parse((fetchData as any).mock.calls[0][0].body).variant, "no colour or size means an empty variant").toBe("");
  });

  it("does not send a second time while the first is posting", async () => {
    (fetchData as any).mockReturnValue(new Promise(() => {}));
    await renderInput();
    type("hi");
    await send();
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(fetchData, "Enter during a post must not post again").toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-pw="faq-ask-send"]'), "the send button hides while posting").toBeNull();
  });

  it("asks a shopper with an unverified phone to verify first", async () => {
    await renderInput({}, { ...signedIn, userProfile: { need_auth: true } });
    type("hi");
    await send();
    expect(showErrorNotification, "the shopper should be asked to verify").toHaveBeenCalledWith(
      "Please Verify Your Phone Number",
    );
    expect(fetchData, "nothing should be posted").not.toHaveBeenCalled();
  });

  it("reports a refused post and keeps the text", async () => {
    (fetchData as any).mockResolvedValue({ success: false, message: "refused" });
    const spies = await renderInput();
    type("hi");
    await send();
    await waitFor(() =>
      expect(LogError, "a refused post should be reported").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "Error In addComment in FaqAskInput" }),
      ),
    );
    expect(spies.setCommentsData, "a refused question must not be shown").not.toHaveBeenCalled();
    expect(input().value, "the shopper's text should stay").toBe("hi");
  });

  it("treats an answer with no id as refused", async () => {
    (fetchData as any).mockResolvedValue({ success: true, data: {} });
    await renderInput();
    type("hi");
    await send();
    await waitFor(() => expect(LogError, "an answer without an id is a failure").toHaveBeenCalled());
    expect(LogError.mock.calls[0][0].error.message, "the default reason should be used").toBe("Failed to create comment");
  });

  it("tells a guest to sign in, and keeps the box read-only", async () => {
    await renderInput({}, { user: null });
    fireEvent.mouseDown(input());
    expect(showErrorNotification, "a guest should be told to sign in").toHaveBeenCalledWith("Please log in first");
    expect(input().readOnly, "a guest cannot type").toBe(true);
  });

  it("lets a signed-in shopper type without a warning", async () => {
    await renderInput();
    fireEvent.mouseDown(input());
    expect(showErrorNotification, "a signed-in shopper needs no warning").not.toHaveBeenCalled();
  });
});
