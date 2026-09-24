// Voice and video call actions (store/chat/callActions.ts).
//
// Every call goes to the chat backend through `fetchData`, which is replaced
// here. The store is the stand-in from tests/mocks/store.ts, seeded with spies
// for the call actions each function reads.
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchData, logError, showError, showSuccess, permissions, state } = vi.hoisted(() => ({
  fetchData: vi.fn(),
  logError: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  permissions: { granted: true },
  state: { current: {} as any },
}));

vi.mock("utils/fetchData", () => ({ fetchData: (p: any) => fetchData(p) }));
vi.mock("utils/functions", () => ({
  getUserChat: () => ({ id: 10 }),
  LogError: (...a: any[]) => logError(...a),
  translateFunction: (k: string) => k,
}));
vi.mock("@/store/notifications/reducer", () => ({
  showErrorNotification: (...a: any[]) => showError(...a),
  showSuccessNotification: (...a: any[]) => showSuccess(...a),
}));
vi.mock("utils/tinyUtils", () => ({
  requestPermissions: async () => permissions.granted,
}));
vi.mock("store", () => ({ useAppStore: { getState: () => state.current } }));

import {
  Answer,
  AnswerCall,
  InCall,
  makeVideoCall,
  makeVoiceCall,
  RefuseCall,
} from "store/chat/callActions";

function spies() {
  return {
    setCallLoading: vi.fn(),
    setVideoCall: vi.fn(),
    setAudioCall: vi.fn(),
    endCall: vi.fn(),
    editCall: vi.fn(),
    answerCall: vi.fn(),
    language: "en",
  };
}

/** The body of the call sent to `url`, parsed. */
function bodyOf(url: string) {
  const call = fetchData.mock.calls.find((c) => c[0].url === url);
  return call ? JSON.parse(call[0].body) : undefined;
}

beforeEach(() => {
  fetchData.mockReset();
  logError.mockClear();
  showError.mockClear();
  showSuccess.mockClear();
  permissions.granted = true;
  state.current = spies();
  localStorage.clear();
});

describe("makeVideoCall", () => {
  it("stops without permission and tells the shopper", async () => {
    permissions.granted = false;
    await makeVideoCall(1, "n", "p", "m");
    expect(showError, "the shopper was not told to allow camera and mic").toHaveBeenCalledWith(
      "Please enable  permissions (camera,mic) to use calls features",
    );
    expect(fetchData, "a call was placed without permission").not.toHaveBeenCalled();
  });

  it("ends old calls, places the call and stores the token", async () => {
    fetchData.mockResolvedValue({ success: true, data: { token: "tok", message: { id: 5 } } });
    await makeVideoCall(3, "Name", "photo", "phone");
    expect(bodyOf("/api/v1/messages/video_call")?.channel_id, "the call was not placed in the chat").toBe(3);
    expect(bodyOf("/api/v1/messages/video_call")?.payload?.type, "the call was not typed video").toBe("video");
    expect(state.current.setVideoCall, "the call token was not stored").toHaveBeenCalledWith("tok", { id: 5 });
    expect(state.current.editCall, "the call was not added to the call log").toHaveBeenCalledWith({ id: 5 });
    expect(state.current.setCallLoading, "the loading flag was not cleared").toHaveBeenLastCalledWith(null);
  });

  it("calls a person with no chat yet by their user id, or uses the private payload", async () => {
    fetchData.mockResolvedValue({ success: true, data: { token: "t", message: {} } });
    await makeVideoCall("ch-42", "n", "p", "m");
    expect(bodyOf("/api/v1/messages/video_call")?.receiver_user_id, "a new chat call did not name the receiver").toBe(42);
    fetchData.mockClear();
    await makeVideoCall(3, "n", "p", "m", { order_chat_participant_id: 7 } as any);
    expect(bodyOf("/api/v1/messages/video_call")?.order_chat_participant_id, "the private payload was not used").toBe(7);
  });

  it("a refused call says the user is busy and ends the call", async () => {
    fetchData.mockResolvedValue({ success: false, message: "busy" });
    await makeVideoCall(3, "n", "p", "m");
    expect(logError.mock.calls[0]?.[0], "the refusal was not logged").toEqual({ scenario: "Error in makeVideoCall in  callActions", error: "busy" });
    expect(showError, "the shopper was not told the user is busy").toHaveBeenCalledWith("User in Another Call");
    expect(state.current.endCall, "the call was not ended").toHaveBeenCalledWith(-1);
    fetchData.mockRejectedValue("down");
    await makeVideoCall(3, "n", "p", "m");
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a thrown string was not logged").toBe("down");
  });
});

describe("makeVoiceCall", () => {
  it("throws without permission and tells the shopper", async () => {
    permissions.granted = false;
    await expect(makeVoiceCall(1, "n", "p", "m"), "a voice call without permission did not stop").rejects.toThrow(
      "Permissions not granted for calls",
    );
    expect(showError, "the shopper was not told to allow the mic").toHaveBeenCalled();
  });

  it("places the call and stores the token", async () => {
    fetchData.mockResolvedValue({ success: true, data: { token: "tok", message: { id: 6 } } });
    await makeVoiceCall("ch-9", "n", "p", "m");
    expect(bodyOf("/api/v1/messages/voice_call")?.receiver_user_id, "a new chat voice call did not name the receiver").toBe(9);
    expect(state.current.setAudioCall, "the voice call token was not stored").toHaveBeenCalledWith("tok", { id: 6 });
    fetchData.mockClear();
    await makeVoiceCall(4, "n", "p", "m", { order_chat_participant_id: 2 } as any);
    expect(bodyOf("/api/v1/messages/voice_call")?.order_chat_participant_id, "the private payload was not used").toBe(2);
    fetchData.mockClear();
    await makeVoiceCall(4, "n", "p", "m");
    expect(bodyOf("/api/v1/messages/voice_call")?.channel_id, "the voice call was not placed in the chat").toBe(4);
  });

  it("a refused voice call says the user is busy", async () => {
    fetchData.mockResolvedValue({ success: false, message: "busy" });
    await makeVoiceCall(4, "n", "p", "m");
    expect(logError.mock.calls[0]?.[0]?.scenario, "the refusal was not logged").toBe("Error in makeVoiceCall in  callActions");
    expect(showError, "the shopper was not told the user is busy").toHaveBeenCalledWith("User in Another Call");
    fetchData.mockRejectedValue("x");
    await makeVoiceCall(4, "n", "p", "m");
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a thrown string was not logged").toBe("x");
  });
});

describe("AnswerCall", () => {
  it("answers when this account is not already in the call", async () => {
    fetchData
      .mockResolvedValueOnce({ success: true, data: [{ user: { id: 10 }, status: "ringing" }] })
      .mockResolvedValueOnce({ success: true, data: "agora" })
      .mockResolvedValueOnce({ success: true });
    await AnswerCall(3, 50);
    expect(showSuccess, "the shopper was not told the call is starting").toHaveBeenCalledWith("Initialize Call please wait..");
    expect(state.current.answerCall, "the call was not answered with the token").toHaveBeenCalledWith("agora");
    expect(fetchData.mock.calls.some((c) => c[0].url === "/api/v1/messages/answer_call/50"), "the chat backend was not told the call was answered").toBe(true);
  });

  it("ends the call when another device already answered", async () => {
    fetchData.mockResolvedValueOnce({ success: true, data: [{ user: { id: 10 }, status: "active" }] });
    await AnswerCall(3, 50);
    expect(showError, "the shopper was not told another device answered").toHaveBeenCalledWith("Call Answered from another account");
    expect(state.current.endCall, "the call was not ended here").toHaveBeenCalledWith(50);
  });

  it("logs a refused users list or token", async () => {
    fetchData.mockResolvedValueOnce({ success: false, message: "no users" });
    await AnswerCall(3, 50);
    expect(logError.mock.calls.at(-1)?.[0], "a refused users list was not logged").toEqual({ scenario: "Error in AnswerCall in  callActions", error: "no users" });
    fetchData
      .mockResolvedValueOnce({ success: true, data: [{ user: { id: 10 }, status: "x" }] })
      .mockResolvedValueOnce({ success: false, message: "no token" });
    await AnswerCall(3, 50);
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a refused token was not logged").toBe("no token");
    fetchData.mockRejectedValueOnce("t");
    await AnswerCall(3, 50);
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a thrown string was not logged").toBe("t");
  });
});

describe("InCall", () => {
  it("reports the busy signal only with a message id", async () => {
    await InCall(1, null);
    expect(fetchData, "a busy signal with no call was sent").not.toHaveBeenCalled();
    fetchData.mockResolvedValue({ success: true });
    await InCall(7, 20);
    expect(bodyOf("/api/v1/messages/in_another_call/20"), "the caller was not named").toEqual({ receiver_user_id: 7 });
    fetchData.mockClear();
    await InCall(null, 21);
    expect(bodyOf("/api/v1/messages/in_another_call/21"), "an empty body was not sent").toEqual({});
  });

  it("logs a refused busy signal", async () => {
    fetchData.mockResolvedValue({ success: false, message: "no" });
    await InCall(1, 2);
    expect(logError.mock.calls[0]?.[0], "a refused busy signal was not logged").toEqual({ scenario: "Error in InCall in  callActions", error: "no" });
    fetchData.mockRejectedValue("z");
    await InCall(1, 2);
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a thrown string was not logged").toBe("z");
  });
});

describe("RefuseCall", () => {
  it("ends my call state and refuses the call with its duration", async () => {
    fetchData.mockResolvedValue({ success: true });
    await RefuseCall(3, 50, 12);
    expect(bodyOf("/api/v1/messages/refuse_call/50"), "the duration was not sent").toEqual({ duration_in_seconds: 12, payload: { target: "web" } });
    expect(state.current.endCall, "the call was not ended").toHaveBeenCalledWith(50);
    fetchData.mockClear();
    await RefuseCall(3, 51, 0);
    expect(bodyOf("/api/v1/messages/refuse_call/51")?.duration_in_seconds, "a zero duration was not sent").toBe(0);
    fetchData.mockClear();
    await RefuseCall(3, 52, undefined);
    expect(bodyOf("/api/v1/messages/refuse_call/52"), "no duration still sent one").toEqual({ payload: { target: "web" } });
    fetchData.mockClear();
    await RefuseCall(3, null, 1);
    expect(fetchData.mock.calls.length, "a refuse with no call id went past ending my call state").toBe(1);
  });

  it("logs a refusal of either step", async () => {
    fetchData.mockResolvedValueOnce({ success: false, message: "end refused" });
    await RefuseCall(3, 50, 1);
    expect(logError.mock.calls.at(-1)?.[0], "a refused end-call was not logged").toEqual({ scenario: "Error in RefuseCall in  callActions", error: "end refused" });
    fetchData.mockResolvedValueOnce({ success: true }).mockResolvedValueOnce({ success: false, message: "refuse refused" });
    await RefuseCall(3, 50, 1);
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a refused refuse-call was not logged").toBe("refuse refused");
    fetchData.mockRejectedValueOnce("r");
    await RefuseCall(3, 50, 1);
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a thrown string was not logged").toBe("r");
  });
});

describe("Answer", () => {
  it("sends the push token when this device has one", async () => {
    fetchData.mockResolvedValue({ success: true });
    await Answer(3, 60);
    expect(bodyOf("/api/v1/messages/answer_call/60"), "a device with no push token sent one").toEqual({});
    localStorage.setItem("FB-DEVICE-TOKEN", "device-push");
    fetchData.mockClear();
    await Answer(3, 61);
    expect(bodyOf("/api/v1/messages/answer_call/61")?.fcm_token, "the device push token was not sent").toBe("device-push");
  });

  it("logs a refused answer", async () => {
    fetchData.mockResolvedValue({ success: false, message: "nope" });
    await Answer(3, 60);
    expect(logError.mock.calls[0]?.[0], "a refused answer was not logged").toEqual({ scenario: "Error in Answer in  callActions", error: "nope" });
    fetchData.mockRejectedValue("a");
    await Answer(3, 60);
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a thrown string was not logged").toBe("a");
  });
});
