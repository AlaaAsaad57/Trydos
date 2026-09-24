// @vitest-environment node
//
// The mobile seller-reply route: create, edit and delete a reply.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replyToComment = vi.fn();
const editReply = vi.fn();
const deleteReply = vi.fn();
vi.mock("services/elastic/sellerComments", () => ({
  replyToComment: (...a: unknown[]) => replyToComment(...a),
  editReply: (...a: unknown[]) => editReply(...a),
  deleteReply: (...a: unknown[]) => deleteReply(...a),
}));

import { DELETE, OPTIONS, POST, PUT } from "app/api/seller/comments/reply/route";

const request = (method: string, body?: string, headers: Record<string, string> = { authorization: "Bearer tok" }) =>
  new NextRequest("https://trydos.test/api/seller/comments/reply", {
    method,
    headers: { "content-type": "application/json", ...headers },
    ...(body === undefined ? {} : { body }),
  });

const good = JSON.stringify({ seller_id: " 12 ", comment_id: " c1 ", reply_text: "Thanks" });

beforeEach(() => {
  vi.clearAllMocks();
  for (const spy of [replyToComment, editReply, deleteReply]) spy.mockResolvedValue({ success: true, data: { ok: 1 } });
});

describe("the seller-reply route", () => {
  it("answers a preflight with 204", () => {
    expect(OPTIONS().status, "the preflight did not answer 204").toBe(204);
  });

  it.each([
    ["POST", POST],
    ["PUT", PUT],
    ["DELETE", DELETE],
  ] as const)("%s refuses a call with no market token", async (method, handler) => {
    const response = await handler(request(method, good, {}));

    expect(response.status, `${method} without a token was not refused`).toBe(401);
  });

  it("creates a reply and answers 201", async () => {
    const response = await POST(request("POST", good));

    expect(replyToComment, "the reply was not created with the trimmed ids").toHaveBeenCalledWith({
      sellerId: "12",
      commentId: "c1",
      replyText: "Thanks",
      authToken: "tok",
    });
    expect(response.status, "a created reply did not answer 201").toBe(201);
  });

  it("edits a reply", async () => {
    const response = await PUT(request("PUT", good));

    expect(editReply, "the reply was not edited with the given text").toHaveBeenCalledWith({
      sellerId: "12",
      commentId: "c1",
      replyText: "Thanks",
      authToken: "tok",
    });
    expect(response.status, "an edited reply did not answer 200").toBe(200);
  });

  it("deletes a reply", async () => {
    const response = await DELETE(request("DELETE", good));

    expect(deleteReply, "the reply was not deleted for the given comment").toHaveBeenCalledWith({
      sellerId: "12",
      commentId: "c1",
      authToken: "tok",
    });
    expect(response.status, "a deleted reply did not answer 200").toBe(200);
  });

  it.each([
    ["POST", POST, replyToComment],
    ["PUT", PUT, editReply],
    ["DELETE", DELETE, deleteReply],
  ] as const)("%s sends empty values when the body is not JSON", async (method, handler, spy) => {
    await handler(request(method, "not json"));

    expect(spy.mock.calls[0][0], `${method} did not fall back to empty values`).toMatchObject({
      sellerId: "",
      commentId: "",
    });
  });
});
