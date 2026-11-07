import { beforeEach, describe, expect, it, vi } from "vitest";

// One kind of a chat's media, read from the chat backend. "Media & Files"
// shows the answer, so the read says what it found, and null when it failed.

const net = vi.hoisted(() => ({ fetchData: vi.fn() }));
vi.mock("utils/fetchData", () => ({ default: net.fetchData, fetchData: net.fetchData }));

import { getMedia } from "store/chat/actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getMedia", () => {
  it("answers with what the chat backend sent", async () => {
    const photos = [{ id: "70" }];
    net.fetchData.mockResolvedValue({ success: true, data: photos });
    expect(await getMedia("12", "ImageMessage"), "the chat backend's photos did not come back").toBe(photos);
  });

  const sent = () => JSON.parse(net.fetchData.mock.calls[0][0].body);

  it("asks for the newest page first, with no cursor", async () => {
    net.fetchData.mockResolvedValue({ success: true, data: [] });
    await getMedia("12", "VideoMessage");
    expect(sent().message_type, "the kind did not go in the body").toBe("VideoMessage");
    expect(sent().message_id, "the first page went out with a cursor").toBeUndefined();
  });

  it("sends the cursor in the body, the only place the chat backend reads it", async () => {
    net.fetchData.mockResolvedValue({ success: true, data: [] });
    await getMedia("12", "ImageMessage", "70");
    expect(sent().message_id, "the older page was not asked for before message 70").toBe("70");
    expect(sent().message_type, "the older page lost its kind").toBe("ImageMessage");
  });

  it("answers null when the chat backend refuses", async () => {
    net.fetchData.mockResolvedValue({ success: false, message: "no" });
    expect(await getMedia("12", "ImageMessage"), "a refused read looks like an empty chat").toBeNull();
  });

  it("answers an empty list for a new chat, which has nothing on the chat backend yet", async () => {
    expect(await getMedia("ch-9", "ImageMessage"), "a new chat looks like a failed read").toEqual([]);
    expect(net.fetchData, "the chat backend was asked about a chat it does not have").not.toHaveBeenCalled();
  });
});
