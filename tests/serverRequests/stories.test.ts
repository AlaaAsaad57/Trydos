// @vitest-environment node
//
// The stories row read (serverRequests/stories.ts — fetchStoriesForUser).
//
// It reads the stories backend with the STORIES-TOKEN cookie (or a token the
// caller passes when the cookie is missing), drops people with no stories left,
// and answers an empty row on any failure. The fetch, the cookie reader and the
// error reporter are replaced; the QA story filter is the real one.
import { beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({
  fetchServerData: vi.fn(),
  cookies: {} as Record<string, unknown>,
  logServerError: vi.fn(),
}));

vi.mock("serverRequests/ServerFetch", () => ({ fetchServerData: io.fetchServerData }));
vi.mock("utils/cookies/server-cookie-manager", () => ({
  getCookieServer: vi.fn(async (name: string) => io.cookies[name]),
}));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: io.logServerError }));

import { fetchStoriesForUser } from "serverRequests/stories";

const EMPTY = { data: [], next_page_url: undefined };

beforeEach(() => {
  vi.clearAllMocks();
  io.fetchServerData.mockReset();
  io.cookies = {};
});

describe("the stories row (fetchStoriesForUser)", () => {
  it("reads the page with the stories cookie and keeps only people with stories", async () => {
    io.cookies["STORIES-TOKEN"] = "stories-session";
    io.cookies["User-Data"] = { phone: "x" };
    io.fetchServerData.mockResolvedValue({
      data: {
        data: {
          data: [
            { id: 1, name: "Sam", stories: [{ id: 10, is_seen: false, created_at: "2026-01-01" }] },
            { id: 2, name: "Empty", stories: [] },
          ],
          next_page_url: "page-3",
        },
      },
    });

    const result = await fetchStoriesForUser("ar", "sy", 2, "caller-token");

    const request = io.fetchServerData.mock.calls[0][0];
    expect(request.url, "the asked page was not read").toMatch(/\/api\/v1\/stories\/users_stories\?page=2$/);
    expect(request.headers.Authorization, "the stories cookie was not preferred over the caller's token").toBe(
      "Bearer stories-session",
    );
    expect(request.local, "the page's locale was not sent").toBe("sy-ar");
    expect(result.data.map((s) => s.id), "a person with no stories was kept").toEqual([1]);
    expect(result.next_page_url, "the next page link was lost").toBe("page-3");
  });

  it("uses the caller's token when there is no cookie, and none when there is neither", async () => {
    io.fetchServerData.mockResolvedValue({ data: {} });

    await fetchStoriesForUser("en", "sy", undefined, "caller-token");
    await fetchStoriesForUser("en", "sy");

    expect(io.fetchServerData.mock.calls[0][0].headers.Authorization, "the caller's token was not used").toBe(
      "Bearer caller-token",
    );
    expect(io.fetchServerData.mock.calls[0][0].url, "the default page is not 1").toMatch(/page=1$/);
    expect(
      "Authorization" in io.fetchServerData.mock.calls[1][0].headers,
      "an empty token was sent",
    ).toBe(false);
  });

  it("answers an empty row, and reports it, when the stories backend refuses", async () => {
    io.fetchServerData.mockResolvedValue({ isError: true, status: 500 });

    expect(await fetchStoriesForUser("en", "sy"), "a refused read did not give an empty row").toEqual(EMPTY);
    expect(io.logServerError.mock.calls[0]?.[0], "the refusal was not reported with its status").toMatchObject({
      source: "stories",
      status: 500,
    });
  });

  it("answers an empty row, and reports it, when the read throws", async () => {
    io.fetchServerData.mockRejectedValue(new Error("network"));

    expect(await fetchStoriesForUser("en", "sy"), "a failed read did not give an empty row").toEqual(EMPTY);
    expect(io.logServerError.mock.calls[0]?.[0]?.scenario, "the failed read was not reported").toBe(
      "Error In fetchStoriesForUser in serverRequest/stories",
    );
  });
});
