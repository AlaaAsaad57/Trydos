// @vitest-environment node
//
// The voice-search route: upload the audio to the transcription service, ask
// for a transcript, then poll until it is ready.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

const BASE = "https://speech.invalid/v2";

/** The route reads its settings when it loads, so it is loaded after they are set. */
const loadRoute = async (key: string | undefined = "speech-key") => {
  vi.resetModules();
  vi.stubEnv("ASSEMBLYAI_API_KEY", key as string);
  vi.stubEnv("ASSEMBLYAI_BASE_URL", BASE);
  return import("app/api/speech-recognition/route");
};

const request = (fields: { audio?: File; language?: string } = {}) => {
  const form = new FormData();
  if (fields.audio) form.append("audio", fields.audio);
  if (fields.language) form.append("language", fields.language);
  return new NextRequest("https://trydos.test/api/speech-recognition", { method: "POST", body: form });
};

const audio = () => new File([new Uint8Array([1, 2])], "a.webm", { type: "audio/webm" });

type Reply = { ok?: boolean; status?: number; body?: unknown; text?: string };
const reply = ({ ok = true, status = 200, body = {}, text = "" }: Reply) => ({
  ok,
  status,
  statusText: ok ? "OK" : "Bad",
  json: async () => body,
  text: async () => text,
});

/** A fake transcription service. `polls` are the poll answers, in order. */
const service = (opts: { upload?: Reply; transcript?: Reply; polls?: Reply[] }) => {
  const polls = [...(opts.polls ?? [])];
  const fetch = vi.fn(async (url: string, _init?: RequestInit) => {
    if (url === `${BASE}/upload`) return reply(opts.upload ?? { body: { upload_url: "https://up/1" } });
    if (url === `${BASE}/transcript`) return reply(opts.transcript ?? { body: { id: "t1" } });
    return reply(polls.length > 1 ? polls.shift()! : polls[0]);
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("the voice-search route", () => {
  it("answers 500 when no transcription key is configured", async () => {
    const { POST } = await loadRoute("");

    const response = await POST(request({ audio: audio() }));

    expect(response.status, "a missing key did not become 500").toBe(500);
    expect(LogServerError, "the missing key was not reported").toHaveBeenCalled();
  });

  it("refuses a request with no audio", async () => {
    const { POST } = await loadRoute();

    const response = await POST(request());

    await expect(response.json(), "a request with no audio was not refused").resolves.toEqual({
      error: "No audio file provided",
    });
  });

  it("refuses an empty audio file", async () => {
    const { POST } = await loadRoute();

    const response = await POST(request({ audio: new File([], "a.webm") }));

    await expect(response.json(), "an empty audio file was not refused").resolves.toEqual({
      error: "Audio file is empty",
    });
  });

  it("uploads, asks for a transcript, polls until done and returns the detected language", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const fetch = service({
      polls: [{ body: { status: "processing" } }, { body: { status: "completed", text: "red shoes", confidence: 0.9, language_code: "ar" } }],
    });
    const { POST } = await loadRoute();

    const pending = POST(request({ audio: audio(), language: "en" }));
    await vi.advanceTimersByTimeAsync(1000);
    const response = await pending;

    expect(fetch.mock.calls[1][1], "the transcript was not asked for the uploaded audio with detection on").toMatchObject({
      body: expect.stringContaining('"audio_url":"https://up/1"'),
    });
    expect(fetch.mock.calls[2][0], "the poll did not ask for the created transcript").toBe(`${BASE}/transcript/t1`);
    await expect(response.json(), "the transcript was not returned with the detected language").resolves.toEqual({
      success: true,
      transcription: "red shoes",
      confidence: 0.9,
      language: "ar",
    });
  });

  it("falls back to the app language and an empty text when the service omits them", async () => {
    service({ polls: [{ body: { status: "completed" } }] });
    const { POST } = await loadRoute();

    const response = await POST(request({ audio: audio() }));

    await expect(response.json(), "the fallbacks were not applied").resolves.toMatchObject({
      transcription: "",
      language: "en",
    });
  });

  it.each([
    ["the upload is refused", { upload: { ok: false, status: 413, text: "too big" } }, "Upload failed: 413 Bad - too big"],
    ["the transcript request is refused", { transcript: { ok: false, status: 401, text: "bad key" } }, "Transcription request failed: 401 Bad - bad key"],
    ["a poll is refused", { polls: [{ ok: false, status: 500, text: "oops" }] }, "Polling failed: 500 Bad - oops"],
    ["the transcription fails", { polls: [{ body: { status: "error", error: "no speech" } }] }, "Transcription failed: no speech"],
  ])("answers 500 when %s", async (_label, opts, details) => {
    service(opts as any);
    const { POST } = await loadRoute();

    const response = await POST(request({ audio: audio() }));

    expect(response.status, `the route did not answer 500 when ${_label}`).toBe(500);
    await expect(response.json(), `the 500 did not say why when ${_label}`).resolves.toEqual({
      error: "Failed to process audio",
      details,
    });
  });

  it("gives up after 60 polls that never finish", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const fetch = service({ polls: [{ body: { status: "processing" } }] });
    const { POST } = await loadRoute();

    const pending = POST(request({ audio: audio() }));
    await vi.advanceTimersByTimeAsync(61_000);
    const response = await pending;

    await expect(response.json(), "an unfinished transcript did not time out").resolves.toMatchObject({
      details: "Transcription timeout",
    });
    expect(
      fetch.mock.calls.filter(([url]) => url === `${BASE}/transcript/t1`).length,
      "the route did not poll exactly 60 times before giving up",
    ).toBe(60);
  });
});
