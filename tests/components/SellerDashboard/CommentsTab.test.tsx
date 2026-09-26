// The Comments section of the seller dashboard.
//
// It holds two different lists behind one sub-tab control:
//   FAQ       - customer questions the shop can answer, edit and delete
//   Reviewing - customer reviews, display-only (the storefront works the same
//               way, so a review must never grow a Reply button here)
//
// Three permissions gate the FAQ controls, and each removes exactly one:
// REPLY_COMMENT, EDIT_REPLY and DELETE_REPLY. The server actions enforce them
// again, so hiding a control here is convenience — but showing one the seller
// cannot use is a broken promise, which is what these tests guard.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const GetFQAComments = vi.fn();
const GetReviewComments = vi.fn();
const ReplyToFQAComment = vi.fn();
const EditReplyForFqaComment = vi.fn();
const DeleteReplyForFqaComment = vi.fn();

vi.mock("services/sellerDashboard/comments", () => ({
  default: {
    GetFQAComments: (...a: unknown[]) => GetFQAComments(...a),
    GetReviewComments: (...a: unknown[]) => GetReviewComments(...a),
    ReplyToFQAComment: (...a: unknown[]) => ReplyToFQAComment(...a),
    EditReplyForFqaComment: (...a: unknown[]) => EditReplyForFqaComment(...a),
    DeleteReplyForFqaComment: (...a: unknown[]) => DeleteReplyForFqaComment(...a),
  },
}));

import CommentsTab from "components/SellerDashboard/CommentsTab";

import { fireEvent, renderWithProviders, screen, userEvent, waitFor } from "../../render";

const SELLER_ID = "77";

/** Every comment permission on, so a test only turns off the one it is about. */
const ALL_PERMISSIONS = { canReply: true, canEditReply: true, canDelete: true };

const comment = (over: Record<string, unknown> = {}) => ({
  comment_id: "c1",
  product_id: "p1",
  user_id: "u1",
  user_name: "Layla",
  user_avatar: "",
  text: "Does this come in blue?",
  rating: null,
  variant: "",
  created_at: "2026-01-05T10:00:00Z",
  seller_reply: "",
  has_reply: false,
  seller_name: "",
  reply_created_at: null,
  total_likes: 3,
  reply_total_likes: 0,
  ...over,
});

/** What the comments backend answers with. */
const listAnswer = (comments: unknown[], meta?: Record<string, unknown>) => ({
  success: true,
  data: { comments, meta: meta ?? { current_page: 1, last_page: 1 } },
});

async function mount(props: Partial<typeof ALL_PERMISSIONS> = {}) {
  return renderWithProviders(
    <CommentsTab
      sellerId={SELLER_ID}
      language="en"
      isRtl={false}
      {...ALL_PERMISSIONS}
      {...props}
    />,
    { path: `/sellerProfile/sellerDashboard/${SELLER_ID}` },
  );
}

beforeEach(() => {
  for (const spy of [
    GetFQAComments,
    GetReviewComments,
    ReplyToFQAComment,
    EditReplyForFqaComment,
    DeleteReplyForFqaComment,
  ]) {
    spy.mockReset();
  }
  GetFQAComments.mockResolvedValue(listAnswer([comment()]));
  GetReviewComments.mockResolvedValue(listAnswer([]));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Comments section — the two lists", () => {
  it("opens on the questions, not the reviews", async () => {
    await mount();
    await waitFor(() => expect(GetFQAComments).toHaveBeenCalled());
    expect(
      GetFQAComments,
      "the section should open by asking the comments backend for page 1 of the questions",
    ).toHaveBeenCalledWith(SELLER_ID, 1);
    expect(
      GetReviewComments,
      "the reviews are a different list and must not be fetched until asked for",
    ).not.toHaveBeenCalled();
  });

  it("shows the customer's question and who asked it", async () => {
    await mount();
    expect(
      await screen.findByText("Does this come in blue?"),
      "the customer's question should be shown",
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Layla/),
      "the customer's name should be shown with their question",
    ).toBeInTheDocument();
  });

  it("asks for the reviews when the seller switches sub-tab", async () => {
    GetReviewComments.mockResolvedValue(
      listAnswer([
        comment({ comment_id: "r1", text: "Great shoes", rating: 4 }),
      ]),
    );
    await mount();
    await screen.findByText("Does this come in blue?");

    await userEvent.click(screen.getByRole("tab", { name: "Reviewing" }));

    expect(
      await screen.findByText("Great shoes"),
      "switching to Reviewing should load and show the reviews",
    ).toBeInTheDocument();
    expect(
      GetReviewComments,
      "the reviews should be asked for from page 1, not from wherever the questions were",
    ).toHaveBeenCalledWith(SELLER_ID, 1);
  });

  it("says when there is nothing to answer", async () => {
    GetFQAComments.mockResolvedValue(listAnswer([]));
    await mount();
    expect(
      await screen.findByText("No Comments Found."),
      "an empty list should say so rather than show a blank panel",
    ).toBeInTheDocument();
  });

  it("shows an empty list when the comments backend refuses", async () => {
    GetFQAComments.mockResolvedValue({
      success: false,
      message: "The comments backend is down.",
    });
    await mount();
    expect(
      await screen.findByText("No Comments Found."),
      "a refused load must still settle, not leave the skeleton on screen forever",
    ).toBeInTheDocument();
  });
});

describe("Comments section — a review is read-only", () => {
  it("offers no reply on a review, even with REPLY_COMMENT", async () => {
    GetReviewComments.mockResolvedValue(
      listAnswer([comment({ comment_id: "r1", text: "Great shoes", rating: 5 })]),
    );
    await mount();
    await screen.findByText("Does this come in blue?");

    await userEvent.click(screen.getByRole("tab", { name: "Reviewing" }));
    await screen.findByText("Great shoes");

    expect(
      screen.queryByRole("button", { name: /Reply/ }),
      "a review cannot be answered on the storefront, so it must not offer Reply here",
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Waiting Seller Reply..."),
      "a review is not waiting for anything",
    ).not.toBeInTheDocument();
  });
});

describe("Comments section — answering a question", () => {
  it("marks an unanswered question as waiting", async () => {
    await mount();
    expect(
      await screen.findByText("Waiting Seller Reply..."),
      "a question with no answer should be marked as waiting",
    ).toBeInTheDocument();
  });

  it("opens an empty reply box for a question with no answer", async () => {
    await mount();
    await screen.findByText("Does this come in blue?");

    await userEvent.click(screen.getByRole("button", { name: /Reply/ }));

    expect(
      await screen.findByText("Reply To FQA Comment"),
      "the box should say it is writing a new answer",
    ).toBeInTheDocument();
    expect(
      (screen.getByRole("textbox") as HTMLTextAreaElement).value,
      "a question with no answer should open with an empty reply box",
    ).toBe("");
  });

  it("sends a new answer to the comments backend", async () => {
    ReplyToFQAComment.mockResolvedValue({ success: true });
    await mount();
    await screen.findByText("Does this come in blue?");

    await userEvent.click(screen.getByRole("button", { name: /Reply/ }));
    await userEvent.type(await screen.findByRole("textbox"), "Yes, in blue too.");
    await userEvent.click(screen.getByRole("button", { name: /Submit Reply/ }));

    await waitFor(() => {
      expect(
        ReplyToFQAComment,
        "a first answer should be created, naming the shop and the comment",
      ).toHaveBeenCalledWith(SELLER_ID, "c1", "Yes, in blue too.");
    });
    expect(
      EditReplyForFqaComment,
      "a question with no answer must not be sent as an edit",
    ).not.toHaveBeenCalled();
  });

  it("shows the new answer on the card straight away", async () => {
    ReplyToFQAComment.mockResolvedValue({ success: true });
    await mount();
    await screen.findByText("Does this come in blue?");

    await userEvent.click(screen.getByRole("button", { name: /Reply/ }));
    await userEvent.type(await screen.findByRole("textbox"), "Yes, in blue too.");
    await userEvent.click(screen.getByRole("button", { name: /Submit Reply/ }));

    expect(
      await screen.findByText("Yes, in blue too."),
      "the answer the seller just wrote should appear under the question",
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Waiting Seller Reply..."),
      "the question is no longer waiting once it is answered",
    ).not.toBeInTheDocument();
  });

  it("keeps the box open when the comments backend refuses the answer", async () => {
    ReplyToFQAComment.mockResolvedValue({ success: false, message: "Rejected" });
    await mount();
    await screen.findByText("Does this come in blue?");

    await userEvent.click(screen.getByRole("button", { name: /Reply/ }));
    await userEvent.type(await screen.findByRole("textbox"), "Yes, in blue too.");
    await userEvent.click(screen.getByRole("button", { name: /Submit Reply/ }));

    await waitFor(() => expect(ReplyToFQAComment).toHaveBeenCalled());
    expect(
      screen.getByRole("textbox"),
      "a refused answer must not be closed away and lost",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Waiting Seller Reply..."),
      "a refused answer must not be shown on the card as if it landed",
    ).toBeInTheDocument();
  });

  it("will not send an empty answer", async () => {
    await mount();
    await screen.findByText("Does this come in blue?");
    await userEvent.click(screen.getByRole("button", { name: /Reply/ }));

    expect(
      await screen.findByRole("button", { name: /Submit Reply/ }),
      "there is nothing to send while the reply box is empty",
    ).toBeDisabled();
  });
});

describe("Comments section — an answer that already exists", () => {
  const answered = comment({
    has_reply: true,
    seller_reply: "Yes, in blue too.",
    seller_name: "Damascus Fine Goods",
    reply_created_at: "2026-01-06T10:00:00Z",
  });

  beforeEach(() => {
    GetFQAComments.mockResolvedValue(listAnswer([answered]));
  });

  it("shows the answer under the question, attributed to the shop", async () => {
    await mount();
    expect(
      await screen.findByText("Yes, in blue too."),
      "the existing answer should be shown under the question",
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Damascus Fine Goods/),
      "the answer belongs to the shop, so the shop's name should carry it",
    ).toBeInTheDocument();
  });

  it("opens the edit box with the current answer in it", async () => {
    await mount();
    await userEvent.click(await screen.findByRole("button", { name: /Edit Reply/ }));

    expect(
      await screen.findByRole("heading", { name: "Edit Reply" }),
      "the box should say it is changing an existing answer",
    ).toBeInTheDocument();
    expect(
      (screen.getByRole("textbox") as HTMLTextAreaElement).value,
      "the box should start from the answer that is already published",
    ).toBe("Yes, in blue too.");
  });

  it("sends a change as an edit, not as a new answer", async () => {
    EditReplyForFqaComment.mockResolvedValue({ success: true });
    await mount();
    await userEvent.click(await screen.findByRole("button", { name: /Edit Reply/ }));

    const box = await screen.findByRole("textbox");
    await userEvent.clear(box);
    await userEvent.type(box, "Blue is back in stock.");
    await userEvent.click(screen.getByRole("button", { name: /Submit Reply/ }));

    await waitFor(() => {
      expect(
        EditReplyForFqaComment,
        "an answer that already exists should be edited, never created again",
      ).toHaveBeenCalledWith(SELLER_ID, "c1", "Blue is back in stock.");
    });
    expect(
      ReplyToFQAComment,
      "creating a second answer for the same question would duplicate it",
    ).not.toHaveBeenCalled();
  });

  it("asks before deleting an answer, and does nothing if the seller says no", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    await mount();

    await userEvent.click(await screen.findByRole("button", { name: /Delete Reply/ }));

    expect(
      DeleteReplyForFqaComment,
      "a delete the seller cancelled must never reach the comments backend",
    ).not.toHaveBeenCalled();
    expect(
      screen.getByText("Yes, in blue too."),
      "the answer should still be on the card after a cancelled delete",
    ).toBeInTheDocument();
  });

  it("deletes the answer and puts the question back to waiting", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    DeleteReplyForFqaComment.mockResolvedValue({ success: true });
    await mount();

    await userEvent.click(await screen.findByRole("button", { name: /Delete Reply/ }));

    await waitFor(() => {
      expect(
        DeleteReplyForFqaComment,
        "the delete should name the shop and the comment it belongs to",
      ).toHaveBeenCalledWith(SELLER_ID, "c1");
    });
    expect(
      await screen.findByText("Waiting Seller Reply..."),
      "with the answer gone the question is waiting again",
    ).toBeInTheDocument();
  });

  it("keeps the answer on the card when the delete is refused", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    DeleteReplyForFqaComment.mockResolvedValue({
      success: false,
      message: "Refused",
    });
    await mount();

    await userEvent.click(await screen.findByRole("button", { name: /Delete Reply/ }));

    await waitFor(() => expect(DeleteReplyForFqaComment).toHaveBeenCalled());
    expect(
      screen.getByText("Yes, in blue too."),
      "a refused delete must not remove the answer from the card",
    ).toBeInTheDocument();
  });
});

describe("Comments section — the permission gates", () => {
  it("hides Reply without REPLY_COMMENT", async () => {
    await mount({ canReply: false });
    await screen.findByText("Waiting Seller Reply...");
    expect(
      screen.queryByRole("button", { name: /Reply/ }),
      "without REPLY_COMMENT the seller must not be offered a reply they cannot send",
    ).not.toBeInTheDocument();
  });

  it("hides Edit Reply without EDIT_REPLY", async () => {
    GetFQAComments.mockResolvedValue(
      listAnswer([comment({ has_reply: true, seller_reply: "Yes." })]),
    );
    await mount({ canEditReply: false });
    await screen.findByText("Yes.");
    expect(
      screen.queryByRole("button", { name: /Edit Reply/ }),
      "without EDIT_REPLY there must be no Edit Reply button",
    ).not.toBeInTheDocument();
  });

  it("hides Delete Reply without DELETE_REPLY", async () => {
    GetFQAComments.mockResolvedValue(
      listAnswer([comment({ has_reply: true, seller_reply: "Yes." })]),
    );
    await mount({ canDelete: false });
    await screen.findByText("Yes.");
    expect(
      screen.queryByRole("button", { name: /Delete Reply/ }),
      "without DELETE_REPLY there must be no Delete Reply button",
    ).not.toBeInTheDocument();
  });
});

describe("Comments section — more pages", () => {
  it("offers no Load More when the backend says this is the last page", async () => {
    await mount();
    await screen.findByText("Does this come in blue?");
    expect(
      screen.queryByRole("button", { name: "Load More" }),
      "one page of comments needs no Load More",
    ).not.toBeInTheDocument();
  });

  it("adds the next page to the list instead of replacing it", async () => {
    GetFQAComments.mockResolvedValueOnce(
      listAnswer([comment()], { current_page: 1, last_page: 2 }),
    );
    GetFQAComments.mockResolvedValueOnce(
      listAnswer(
        [comment({ comment_id: "c2", text: "Is it waterproof?" })],
        { current_page: 2, last_page: 2 },
      ),
    );
    await mount();
    await screen.findByText("Does this come in blue?");

    await userEvent.click(screen.getByRole("button", { name: "Load More" }));

    expect(
      await screen.findByText("Is it waterproof?"),
      "Load More should bring the next page of questions in",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Does this come in blue?"),
      "the first page must still be on screen after loading the second",
    ).toBeInTheDocument();
    expect(
      GetFQAComments.mock.calls.at(-1),
      "Load More should ask the comments backend for page 2",
    ).toEqual([SELLER_ID, 2]);
  });
});

describe("Comments section — edges of the list and the reply box", () => {
  it("guesses there are more pages when a full page comes back with no page info", async () => {
    const tenComments = Array.from({ length: 10 }, (_, i) =>
      comment({ comment_id: `c${i}`, text: `Question ${i}` }),
    );
    GetFQAComments.mockResolvedValue({ success: true, data: tenComments });
    await mount();
    await screen.findByText("Question 0");
    expect(
      screen.getByRole("button", { name: "Load More" }),
      "a full page of 10 with no meta should still offer Load More",
    ).toBeInTheDocument();
  });

  it("closes the reply box from the close button and from Cancel", async () => {
    await mount();
    await screen.findByText("Does this come in blue?");

    await userEvent.click(screen.getByRole("button", { name: /Reply/ }));
    await screen.findByText("Reply To FQA Comment");
    const dialogClose = screen
      .getAllByRole("button", { name: "Cancel" })
      .find((b) => b.getAttribute("aria-label") === "Cancel");
    await userEvent.click(dialogClose as HTMLElement);
    expect(
      screen.queryByText("Reply To FQA Comment"),
      "the close button should close the reply box",
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Reply/ }));
    await screen.findByText("Reply To FQA Comment");
    const cancel = screen
      .getAllByRole("button", { name: "Cancel" })
      .find((b) => !b.getAttribute("aria-label"));
    await userEvent.click(cancel as HTMLElement);
    expect(
      screen.queryByText("Reply To FQA Comment"),
      "Cancel should close the reply box",
    ).not.toBeInTheDocument();
  });

  it("will not send an answer made only of spaces", async () => {
    await mount();
    await screen.findByText("Does this come in blue?");
    await userEvent.click(screen.getByRole("button", { name: /Reply/ }));
    const box = (await screen.findByRole("textbox")) as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: "   " } });
    fireEvent.submit(box.closest("form") as HTMLFormElement);
    expect(
      ReplyToFQAComment,
      "an answer of only spaces must not reach the comments backend",
    ).not.toHaveBeenCalled();
  });

  it("sends no second delete while another answer is being deleted", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    let finish: (v: unknown) => void = () => {};
    DeleteReplyForFqaComment.mockReturnValue(new Promise((r) => (finish = r)));
    GetFQAComments.mockResolvedValue(
      listAnswer([
        comment({ has_reply: true, seller_reply: "First answer" }),
        comment({ comment_id: "c2", text: "Second?", has_reply: true, seller_reply: "Second answer" }),
      ]),
    );
    await mount();
    await screen.findByText("Second answer");
    const [first, second] = screen.getAllByRole("button", { name: /Delete Reply/ });
    await userEvent.click(first);
    await userEvent.click(second);
    expect(
      DeleteReplyForFqaComment.mock.calls.map((c) => c[1]),
      "only the first answer's delete should be sent while it is still running",
    ).toEqual(["c1"]);
    finish({ success: true });
    await waitFor(() => expect(screen.queryByText("First answer")).not.toBeInTheDocument());
  });
});
