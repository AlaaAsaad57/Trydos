// The video call screen (components/Chat/components/ChatVideoCall.tsx).
//
// Agora is replaced by a fake client that records its event handlers, so a test
// can play "the other side joined / published / left" by calling them. The
// stopwatch is replaced too, so a test can set the call time directly. The chat
// backend calls (`fetchData`, `RefuseCall`) are spies.
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({
  client: null as any,
  media: {} as any,
  sw: { real: false, seconds: 0, minutes: 0, isRunning: false, start: null as any, pause: null as any, reset: null as any },
  fetchData: null as any,
  refuseCall: null as any,
  logError: null as any,
}));

vi.mock("agora-rtc-react", () => ({
  default: { setLogLevel: () => {} },
  AgoraVideoPlayer: (p: any) => <div data-testid={p.id || p.className} className={p.className} onClick={p.onClick} />,
  createClient: () => () => h.client,
  createMicrophoneAndCameraTracks: () => () => h.media,
}));
vi.mock("react-timer-hook", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useStopwatch: (opts: any) => (h.sw.real ? actual.useStopwatch(opts) : { ...h.sw, hours: 0, days: 0 }),
  };
});
vi.mock("utils/fetchData", () => ({ fetchData: (...a: any[]) => h.fetchData(...a) }));
vi.mock("store/chat/callActions", () => ({ RefuseCall: (...a: any[]) => h.refuseCall(...a) }));
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => h.logError(...a),
}));

import ChatVideoCall from "components/Chat/components/ChatVideoCall";

function makeClient() {
  const handlers: Record<string, any> = {};
  return {
    handlers,
    connectionState: "DISCONNECTED",
    on: vi.fn((ev: string, fn: any) => {
      handlers[ev] = fn;
    }),
    join: vi.fn(async () => {}),
    publish: vi.fn(async () => {}),
    subscribe: vi.fn(async () => {}),
    unpublish: vi.fn(async () => {}),
    leave: vi.fn(async () => {}),
    removeAllListeners: vi.fn(),
  };
}

function makeTrack(enabled = true) {
  return { enabled, setEnabled: vi.fn(async () => {}), close: vi.fn(), stop: vi.fn() };
}

const ME = 1;

function storeFor(members: any[] = [{ user_id: ME }, { user_id: 2, user: { name: "Other Person", photo_path: "/p.png" } }]) {
  return {
    userChat: { id: ME },
    activeChat: { id: 7, channel_members: members },
    MessageActiveCall: 70,
    storeDuration: vi.fn(),
    endCall: vi.fn(),
    storeClient: vi.fn(),
    storeTrack: vi.fn(),
  };
}

async function mount(store = storeFor()) {
  const r = await renderWithProviders(<ChatVideoCall token="tok" />, { store });
  return { ...r, spies: store };
}

beforeEach(() => {
  h.client = makeClient();
  h.media = { ready: true, tracks: [makeTrack(), makeTrack()], error: null };
  h.sw = { real: false, seconds: 0, minutes: 0, isRunning: false, start: vi.fn(), pause: vi.fn(), reset: vi.fn() };
  h.fetchData = vi.fn(async () => ({ success: true }));
  h.refuseCall = vi.fn();
  h.logError = vi.fn();
});

describe("ChatVideoCall — joining", () => {
  it("joins the channel, publishes camera and mic, and shows the controls", async () => {
    const { spies } = await mount();
    await waitFor(() => expect(h.client.publish, "the camera and mic were not published").toHaveBeenCalled());
    expect(h.client.join, "the call did not join the chat's channel as me").toHaveBeenCalledWith(expect.any(String), "7", "tok", ME);
    expect(spies.storeClient, "the call client was not stored").toHaveBeenCalledWith(h.client);
    expect(h.media.tracks[0].setEnabled, "the mic was not switched on").toHaveBeenCalledWith(true);
    expect(document.querySelector(".toggle-mic"), "the mic toggle did not appear").not.toBeNull();
    expect(screen.getByText("Calling ..."), "the calling line was not shown").toBeInTheDocument();
    expect(screen.getByTestId("local-video-stream"), "my own camera was not shown").toBeInTheDocument();
  });

  it("does not join before the camera is ready", async () => {
    h.media = { ready: false, tracks: null, error: null };
    await mount();
    expect(h.client.join, "the call joined without camera tracks").not.toHaveBeenCalled();
    expect(screen.queryByText("Calling ..."), "the calling line showed before the camera was ready").toBeNull();
  });

  it("logs a failed join", async () => {
    h.client.join = vi.fn(async () => {
      throw new Error("join refused");
    });
    await mount();
    await waitFor(() =>
      expect(h.logError.mock.calls[0]?.[0]?.scenario, "a failed join was not logged").toBe("error in init function web video call - chat widget"),
    );
  });

  it("shows the camera error, with 'None' when it has no message", async () => {
    h.media = { ready: false, tracks: null, error: { message: "camera busy" } };
    const first = await mount();
    expect(document.querySelector(".error")?.textContent, "the camera error was not shown").toContain("camera busy");
    first.unmount();
    h.media = { ready: false, tracks: null, error: {} };
    await mount();
    expect(document.querySelector(".error")?.textContent, "an error with no message did not say None").toContain("None");
  });
});

describe("ChatVideoCall — the other person", () => {
  it("shows their photo, else their initials, else the empty profile picture", async () => {
    const a = await mount();
    expect((document.querySelector(".hgg") as HTMLElement).style.backgroundImage, "the other person's photo was not shown").toContain("/p.png");
    expect(screen.getByText("Other Person"), "the caller name was not shown").toBeInTheDocument();
    a.unmount();
    const b = await mount(storeFor([{ user_id: ME }, { user_id: 2, user: { name: "Other Person" } }]));
    expect(document.querySelector(".text-avatar")?.textContent, "the initials were not shown").toBe("OP");
    b.unmount();
    await mount(storeFor([{ user_id: ME }, { user_id: 2, user: { mobile_phone: "p-0" } }]));
    expect((document.querySelector(".hgg") as HTMLElement).style.backgroundImage, "the empty profile picture was not shown").toContain("profileNo.png");
    expect(screen.getByText("p-0"), "the phone was not shown when there is no name").toBeInTheDocument();
  });

  it("starts the clock when they join and shows their video when they publish it", async () => {
    await mount();
    await waitFor(() => expect(h.client.handlers["user-joined"], "no join handler").toBeDefined());
    await act(async () => {
      await h.client.handlers["user-joined"]({ uid: 5 });
      await h.client.handlers["user-joined"]({ uid: 5 });
    });
    expect(h.sw.start, "the call clock did not start").toHaveBeenCalled();
    expect(document.querySelector(".call-status img"), "the connected status was not shown").not.toBeNull();
    const audioTrack = { play: vi.fn(), stop: vi.fn() };
    await act(async () => {
      await h.client.handlers["user-published"]({ uid: 5, videoTrack: {}, hasVideo: true, audioTrack }, "video");
      await h.client.handlers["user-published"]({ uid: 5, videoTrack: {}, hasVideo: true, audioTrack }, "audio");
    });
    expect(h.client.subscribe, "their tracks were not subscribed").toHaveBeenCalledTimes(2);
    expect(audioTrack.play, "their audio was not played").toHaveBeenCalled();
    expect(screen.getByTestId("remote-stream"), "their video was not shown").toBeInTheDocument();
    await act(async () => {
      h.client.handlers["user-unpublished"]({ uid: 5, audioTrack }, "audio");
      h.client.handlers["user-unpublished"]({ uid: 9 }, "video");
    });
    expect(audioTrack.stop, "their audio was not stopped when they unpublished it").toHaveBeenCalled();
  });

  it("logs audio that cannot play", async () => {
    await mount();
    await waitFor(() => expect(h.client.handlers["user-published"]).toBeDefined());
    await act(async () => {
      await h.client.handlers["user-published"](
        { uid: 5, audioTrack: { play: () => { throw new Error("autoplay"); } } },
        "audio",
      );
    });
    expect(h.logError.mock.calls[0]?.[0]?.scenario, "audio that cannot play was not logged").toBe(
      "failed to play call audio  web video call - chat widget",
    );
  });

  it("shows the running call time before any video", async () => {
    h.sw.seconds = 5;
    h.sw.minutes = 1;
    await mount();
    await waitFor(() => expect(h.client.handlers["user-joined"]).toBeDefined());
    await act(async () => {
      await h.client.handlers["user-joined"]({ uid: 5 });
    });
    expect(screen.getByText(/01:\s*05/), "the call time was not shown as MM:SS").toBeInTheDocument();
  });

  it("swaps the big and small video when either is pressed", async () => {
    await mount();
    await waitFor(() => expect(h.client.handlers["user-published"]).toBeDefined());
    await act(async () => {
      await h.client.handlers["user-published"]({ uid: 5, videoTrack: {}, hasVideo: true }, "video");
    });
    const localBox = screen.getByTestId("local-video-stream").parentElement!;
    fireEvent.click(localBox);
    expect(localBox.className, "pressing my small video did not make it big").toBe("my-screen");
    fireEvent.click(localBox);
    fireEvent.click(screen.getByTestId("remote-stream"));
    expect(localBox.className, "pressing their video did not swap back").toBe("add-caller-icon");
    fireEvent.click(screen.getByTestId("remote-stream"));
  });

  it("ends the call when they leave, and tells the chat backend", async () => {
    const { spies } = await mount();
    await waitFor(() => expect(h.client.handlers["user-left"]).toBeDefined());
    await act(async () => {
      await h.client.handlers["user-left"]({ uid: 5 });
    });
    await waitFor(() => expect(spies.endCall, "the call was not ended in the store").toHaveBeenCalledWith(70));
    expect(h.client.leave, "the channel was not left").toHaveBeenCalled();
    expect(h.fetchData.mock.calls[0]?.[0]?.body, "the chat backend was not told the call ended").toBe(JSON.stringify({ user_id: ME }));
    expect(h.refuseCall, "the call was not closed on the chat backend").toHaveBeenCalledWith(7, 70, 0);
    expect(spies.storeDuration, "the call time was not stored").toHaveBeenCalledWith(70, 0);
  });
});

describe("ChatVideoCall — my controls", () => {
  it("mutes and unmutes the mic and the camera", async () => {
    await mount();
    await waitFor(() => expect(document.querySelector(".toggle-mic"), "no mic toggle").not.toBeNull());
    await act(async () => {
      fireEvent.click(document.querySelector(".toggle-mic")!);
    });
    expect(h.media.tracks[0].setEnabled, "the mic was not muted").toHaveBeenLastCalledWith(false);
    expect(document.querySelector(".toggle-mic")!.className, "the mic toggle did not show muted").not.toContain("active-mic-svg");
    await act(async () => {
      fireEvent.click(document.querySelector(".toggle-vid")!);
    });
    expect(h.media.tracks[1].setEnabled, "the camera was not switched off").toHaveBeenLastCalledWith(false);
  });

  it("does not toggle a missing track", async () => {
    await mount();
    await waitFor(() => expect(document.querySelector(".toggle-mic")).not.toBeNull());
    h.media.tracks[0] = null;
    h.media.tracks[1] = null;
    const before = document.querySelector(".toggle-mic")!.className;
    await act(async () => {
      fireEvent.click(document.querySelector(".toggle-mic")!);
      fireEvent.click(document.querySelector(".toggle-vid")!);
    });
    expect(document.querySelector(".toggle-mic")!.className, "a missing mic changed the toggle").toBe(before);
  });

  it("the back arrow ends the call once, cleaning up a connected client", async () => {
    h.client.connectionState = "CONNECTED";
    const { spies } = await mount();
    await waitFor(() => expect(h.client.publish).toHaveBeenCalled());
    await act(async () => {
      fireEvent.click(document.querySelector(".cancel-call-icon")!);
    });
    await act(async () => {
      fireEvent.click(document.querySelector(".cancel-call-icon")!);
    });
    await waitFor(() => expect(spies.endCall, "the call was not ended").toHaveBeenCalled());
    expect(h.client.unpublish, "my tracks were not unpublished").toHaveBeenCalled();
    expect(h.client.leave, "the back arrow left the channel more than once plus cleanup").toHaveBeenCalledTimes(2);
  });

  it("the end button ends the call even when cleanup fails", async () => {
    h.client.connectionState = "CONNECTING";
    h.media.tracks = [makeTrack(false), makeTrack(false)];
    h.fetchData = vi.fn(() => {
      throw new Error("end refused");
    });
    const { spies } = await mount();
    await waitFor(() => expect(h.client.publish).toHaveBeenCalled());
    h.client.unpublish = vi.fn(async () => {
      throw new Error("unpublish failed");
    });
    await act(async () => {
      fireEvent.click(document.querySelector(".end-icon")!);
    });
    await waitFor(() => expect(spies.endCall, "the call was not ended").toHaveBeenCalled());
    expect(h.logError.mock.calls.map((c) => c[0].scenario), "the failed end-call request was not logged").toContain(
      "end call api in web video call - chat widget",
    );
    expect(screen.queryByTestId("local-video-stream"), "a disabled camera was still shown").toBeNull();
  });

  it("still ends the call when the store refuses the first time", async () => {
    const store = storeFor();
    store.endCall = vi.fn().mockImplementationOnce(() => {
      throw new Error("store busy");
    });
    store.MessageActiveCall = null as any;
    await mount(store);
    await waitFor(() => expect(h.client.publish).toHaveBeenCalled());
    await act(async () => {
      fireEvent.click(document.querySelector(".end-icon")!);
    });
    await waitFor(() => expect(store.endCall, "the call end was not retried").toHaveBeenCalledTimes(2));
    expect(h.logError.mock.calls.at(-1)?.[0]?.scenario, "the failure was not logged").toBe("end call function in web video call - chat widget");
    expect(h.refuseCall, "a call with no id was refused on the chat backend").not.toHaveBeenCalled();
  });

  it("swallows an Agora cleanup error and still ends the call", async () => {
    const { spies } = await mount();
    await waitFor(() => expect(h.client.publish).toHaveBeenCalled());
    h.client.connectionState = "CONNECTED";
    // userEndCall clears the listeners first; the second clear, inside the
    // Agora cleanup of endCall, is the one that fails.
    h.client.removeAllListeners = vi
      .fn()
      .mockImplementationOnce(() => {})
      .mockImplementationOnce(() => {
        throw new Error("gone");
      });
    await act(async () => {
      fireEvent.click(document.querySelector(".end-icon")!);
    });
    await waitFor(() => expect(spies.endCall, "the call was not ended after a cleanup error").toHaveBeenCalled());
    expect(h.logError, "a cleanup error that is swallowed on purpose was logged").not.toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "end call function in web video call - chat widget" }),
    );
  });

  it("releases the camera and mic when the screen closes", async () => {
    const r = await mount();
    await waitFor(() => expect(h.client.publish).toHaveBeenCalled());
    h.client.unpublish = vi.fn(async () => {
      throw new Error("x");
    });
    h.client.leave = vi.fn(async () => {
      throw new Error("y");
    });
    const tracks = h.media.tracks;
    r.unmount();
    await waitFor(() => expect(tracks[1].close, "the camera was not released").toHaveBeenCalled());
    expect(tracks[0].stop, "the mic was not stopped").toHaveBeenCalled();
  });
});

describe("ChatVideoCall — the call time limit", () => {
  it("warns five minutes before the end and ends the call at ten", async () => {
    h.sw.minutes = 5;
    const r = await mount();
    expect(document.querySelector(".call-warn")?.textContent, "the five-minute warning was not shown").toContain("5");
    h.sw.minutes = 10;
    r.rerender(<ChatVideoCall token="tok" />);
    await waitFor(() => expect(r.spies.endCall, "the call did not end at the time limit").toHaveBeenCalled());
  });

  it("BUG-chat-5: a video call nobody answers ends by itself after 60 seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      h.sw.real = true;
      const { spies } = await mount();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(65_000);
      });
      expect(spies.endCall, "an unanswered call was still ringing after 65 seconds").toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
