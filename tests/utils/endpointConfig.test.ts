// utils/endpointConfig.tsx — the comments backend addresses that take an id.
import { describe, expect, it } from "vitest";

import { DELETE_COMMENT_URL, TRANSLATE_COMMENT_URL, UPDATE_COMMENT_URL } from "utils/endpointConfig";

describe("comment addresses", () => {
  it("put the comment id into the update, delete and translate addresses", () => {
    expect(
      [UPDATE_COMMENT_URL("c1"), DELETE_COMMENT_URL("c1"), TRANSLATE_COMMENT_URL("c1")],
      "a comment address is wrong",
    ).toEqual([
      "/public_comment/comments/c1/update",
      "/public_comment/comments/c1/delete",
      "/public_comment/comments/c1/translate",
    ]);
  });
});
