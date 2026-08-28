import { describe, expect, it, beforeEach } from "vitest";
import { useAppStore } from "store";

describe("Comments store reducer actions", () => {
  beforeEach(() => {
    useAppStore.setState({
      commentEntities: {},
      deletedCommentIds: {},
      appendedFaqIds: {},
    });
  });

  it("upsertComments merges new comment list into commentEntities map", () => {
    const list = [
      { id: "c1", text: "Great shirt!" },
      { id: "c2", text: "Nice fit" },
    ];

    useAppStore.getState().upsertComments(list);

    const entities = useAppStore.getState().commentEntities;
    expect(entities["c1"], "comment c1 should be stored").toEqual({ id: "c1", text: "Great shirt!" });
    expect(entities["c2"], "comment c2 should be stored").toEqual({ id: "c2", text: "Nice fit" });
  });

  it("patchCommentEntity updates specific fields of a comment entity", () => {
    useAppStore.setState({
      commentEntities: {
        c1: { id: "c1", text: "Great shirt!", likes: 5 },
      },
    });

    useAppStore.getState().patchCommentEntity("c1", { likes: 6 });

    const entity = useAppStore.getState().commentEntities["c1"];
    expect(entity.likes, "likes count should be updated to 6").toBe(6);
    expect(entity.text, "text should remain unchanged").toBe("Great shirt!");
  });

  it("removeCommentEntity marks comment ID as deleted in deletedCommentIds map", () => {
    useAppStore.getState().removeCommentEntity("c1");
    expect(useAppStore.getState().deletedCommentIds["c1"], "c1 should be marked true in deletedCommentIds").toBe(true);
  });

  it("appendFaqComment prepends new FAQ question ID to appendedFaqIds map", () => {
    const faqItem = { id: "faq-1", question: "Is size XL available?" };
    useAppStore.getState().appendFaqComment("prod-100", faqItem);

    const state = useAppStore.getState();
    expect(state.commentEntities["faq-1"], "faq entity should be stored").toEqual(faqItem);
    expect(state.appendedFaqIds["prod-100"], "faq-1 ID should be appended under prod-100").toEqual(["faq-1"]);
  });
});
