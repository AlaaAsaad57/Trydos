import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getMediaImageBaseUrl,
  getMediaServerBaseUrl,
  getMediaVideoBaseUrl,
} from "utils/mediaUrl";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("mediaUrl helpers derive all media bases from NEXT_PUBLIC_MEDIA_SERVER_BASE_URL", () => {
  it("builds image and video upload bases from the bare media server origin", () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_SERVER_BASE_URL", "https://media_server.ramaaz.dev");

    expect(
      getMediaServerBaseUrl(),
      "getMediaServerBaseUrl should return the bare media server origin",
    ).toBe("https://media_server.ramaaz.dev");
    expect(
      getMediaImageBaseUrl(),
      "getMediaImageBaseUrl should append /image/upload",
    ).toBe("https://media_server.ramaaz.dev/image/upload");
    expect(
      getMediaVideoBaseUrl(),
      "getMediaVideoBaseUrl should append /video/upload",
    ).toBe("https://media_server.ramaaz.dev/video/upload");
  });

  it("strips trailing slashes without producing double slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_SERVER_BASE_URL", "https://media.example.com///");

    expect(
      getMediaServerBaseUrl(),
      "trailing slashes must be stripped from the base URL",
    ).toBe("https://media.example.com");
    expect(
      getMediaImageBaseUrl(),
      "image base URL must not contain a double slash",
    ).toBe("https://media.example.com/image/upload");
    expect(
      getMediaVideoBaseUrl(),
      "video base URL must not contain a double slash",
    ).toBe("https://media.example.com/video/upload");
  });

  it("returns empty string instead of 'undefined/image/upload' when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_SERVER_BASE_URL", "");

    expect(
      getMediaServerBaseUrl(),
      "empty env should yield empty base URL",
    ).toBe("");
    expect(
      getMediaImageBaseUrl(),
      "empty env should yield empty image base URL",
    ).toBe("");
    expect(
      getMediaVideoBaseUrl(),
      "empty env should yield empty video base URL",
    ).toBe("");
  });
});
