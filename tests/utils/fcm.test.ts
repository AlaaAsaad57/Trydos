// @vitest-environment node
//
// The push-notification client, after `firebase-admin` was dropped.
//
// WHY THIS FILE EXISTS
// `utils/fcm.ts` replaced a vendor SDK with hand-written HTTPS calls, so every
// detail the SDK used to get right is now ours to get wrong: the shape of the
// service-account assertion, which endpoint each operation hits, the header the
// IID API demands, and the fact that a topic unsubscribe is a *batch* call. None
// of that is visible from a route handler, and all of it fails at runtime rather
// than at build time.
//
// The signing is exercised for real. The test generates an RSA key, exports it
// as PKCS#8 PEM and lets the module sign with WebCrypto — the same path a Worker
// takes. A stubbed signature would prove nothing, because "can this runtime sign
// an RS256 assertion at all" is precisely the question the migration raised.
//
// Only the network is faked.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  jsonReply,
  makeMockFetch,
  type RecordedCall,
} from "../mocks/mockFetch";

const PROJECT_ID = "trydos-test";
const CLIENT_EMAIL = "pusher@trydos-test.iam.gserviceaccount.com";

/** A throwaway RSA key in the PEM form the environment variable carries. */
async function generatePrivateKeyPem(): Promise<string> {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  const body = Buffer.from(pkcs8).toString("base64").replace(/(.{64})/g, "$1\n");
  // Real credentials arrive with the newlines escaped; keep that shape so the
  // module's unescaping is covered too.
  return `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`.replace(
    /\n/g,
    "\\n",
  );
}

/** Decode one base64url segment of a JWT. */
function decodeSegment(segment: string): any {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

const TOKEN_REPLY = jsonReply({
  access_token: "ya29.test-access-token",
  expires_in: 3600,
});

let net: ReturnType<typeof makeMockFetch>;
let fcm: typeof import("utils/fcm");

async function loadModule() {
  vi.resetModules();
  fcm = await import("utils/fcm");
  fcm.__resetTokenCache();
}

beforeEach(async () => {
  process.env.FIREBASE_PROJECT_ID = PROJECT_ID;
  process.env.FIREBASE_CLIENT_EMAIL = CLIENT_EMAIL;
  process.env.FIREBASE_PRIVATE_KEY = await generatePrivateKeyPem();
  await loadModule();
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_CLIENT_EMAIL;
  delete process.env.FIREBASE_PRIVATE_KEY;
});

function useNetwork(replies: Parameters<typeof makeMockFetch>[0]) {
  net = makeMockFetch(replies);
  vi.stubGlobal("fetch", net.fetch);
  return net;
}

/** The call the module made to Google's OAuth endpoint. */
function tokenCall(): RecordedCall {
  const call = net.calls.find((c) => c.url.includes("oauth2.googleapis.com"));
  expect(
    call,
    "the client never called the Google OAuth token endpoint, so no push can be authorised",
  ).toBeTruthy();
  return call!;
}

describe("minting the Google access token", () => {
  it("signs an RS256 assertion this runtime can actually produce", async () => {
    useNetwork([TOKEN_REPLY]);

    const token = await fcm.getAccessToken();

    expect(
      token,
      "the Google OAuth token endpoint answered but no access token was read from it",
    ).toBe("ya29.test-access-token");

    const body = tokenCall().body as URLSearchParams | string;
    const params = new URLSearchParams(String(body));
    const assertion = params.get("assertion") ?? "";

    expect(
      assertion.split(".").length,
      "the assertion sent to the Google OAuth token endpoint is not a three-part JWT",
    ).toBe(3);

    const header = decodeSegment(assertion.split(".")[0]);
    expect(
      header.alg,
      `the assertion was signed with ${header.alg}, but Google only accepts RS256 for a service account`,
    ).toBe("RS256");
  });

  it("asks for the messaging scope, from the right service account", async () => {
    useNetwork([TOKEN_REPLY]);
    await fcm.getAccessToken();

    const params = new URLSearchParams(String(tokenCall().body));
    const claims = decodeSegment((params.get("assertion") ?? "").split(".")[1]);

    expect(
      claims.iss,
      "the assertion names the wrong service account, so Google will refuse it",
    ).toBe(CLIENT_EMAIL);
    expect(
      claims.scope,
      "the assertion does not request the firebase.messaging scope, so the token cannot send a push",
    ).toBe("https://www.googleapis.com/auth/firebase.messaging");
    expect(
      params.get("grant_type"),
      "the token request did not use the JWT-bearer grant that a service account requires",
    ).toBe("urn:ietf:params:oauth:grant-type:jwt-bearer");
  });

  it("reuses a live token instead of re-signing on every push", async () => {
    useNetwork([TOKEN_REPLY]);

    await fcm.getAccessToken();
    await fcm.getAccessToken();

    const tokenCalls = net.calls.filter((c) =>
      c.url.includes("oauth2.googleapis.com"),
    );
    expect(
      tokenCalls.length,
      "the cached access token was ignored and the Google OAuth endpoint was called twice for one token lifetime",
    ).toBe(1);
  });

  it("says it was the Google OAuth endpoint that refused, and why", async () => {
    useNetwork([
      jsonReply({ error_description: "Invalid JWT Signature." }, 400),
    ]);

    await expect(
      fcm.getAccessToken(),
      "a refused service account did not raise an error",
    ).rejects.toThrow(/Google OAuth token endpoint refused.*400.*Invalid JWT/);
  });

  it("refuses to sign when the service-account key is absent", async () => {
    delete process.env.FIREBASE_PRIVATE_KEY;
    await loadModule();
    useNetwork([TOKEN_REPLY]);

    await expect(
      fcm.getAccessToken(),
      "a missing FIREBASE_PRIVATE_KEY was not reported by name",
    ).rejects.toThrow(/FIREBASE_PRIVATE_KEY/);
  });
});

describe("sending a message", () => {
  it("posts to the project's v1 send endpoint with the message wrapped", async () => {
    useNetwork([
      TOKEN_REPLY,
      jsonReply({ name: `projects/${PROJECT_ID}/messages/0:1234567890` }),
    ]);

    const id = await fcm.sendMessage({
      topic: "all",
      notification: { title: "Sale", body: "Half price" },
    });

    const send = net.calls.find((c) => c.url.includes("fcm.googleapis.com"))!;
    expect(
      send,
      "the FCM send endpoint was never called, so no notification left the app",
    ).toBeTruthy();
    expect(
      send.url,
      `the message went to ${send.url}, not the v1 send endpoint for project ${PROJECT_ID}`,
    ).toBe(
      `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
    );
    expect(
      send.body?.message?.topic,
      "the message body was not wrapped in the `message` envelope the FCM v1 API requires",
    ).toBe("all");
    expect(
      send.headers.authorization,
      "the FCM send call carried no bearer token, so FCM will reject it as unauthenticated",
    ).toBe("Bearer ya29.test-access-token");
    expect(
      id,
      "the FCM send endpoint returned a message name but no id was extracted from it",
    ).toBe("0:1234567890");
  });

  it("quotes what FCM said when it rejects the message", async () => {
    useNetwork([
      TOKEN_REPLY,
      jsonReply({ error: { message: "Requested entity was not found." } }, 404),
    ]);

    await expect(
      fcm.sendMessage({ topic: "ghost" }),
      "a rejected push did not raise an error",
    ).rejects.toThrow(/FCM send endpoint rejected.*404.*not found/);
  });
});

describe("topic membership", () => {
  it("subscribes through the IID relationship endpoint", async () => {
    useNetwork([TOKEN_REPLY, jsonReply({})]);

    await fcm.subscribeToTopic("device-token-abc", "offers");

    const call = net.calls.find((c) => c.url.includes("iid.googleapis.com"))!;
    expect(
      call,
      "the IID backend was never called, so the device was not subscribed",
    ).toBeTruthy();
    expect(
      call.url,
      `the subscribe call went to ${call.url}, not the IID rel/topics endpoint`,
    ).toBe(
      "https://iid.googleapis.com/iid/v1/device-token-abc/rel/topics/offers",
    );
    expect(
      call.headers.access_token_auth,
      "the IID backend was called without access_token_auth, which it requires when a bearer token is used instead of a legacy server key",
    ).toBe("true");
  });

  it("unsubscribes through the batchRemove endpoint, not the single-token URL", async () => {
    useNetwork([TOKEN_REPLY, jsonReply({})]);

    await fcm.unsubscribeFromTopic("device-token-abc", "offers");

    const call = net.calls.find((c) => c.url.includes("iid.googleapis.com"))!;
    expect(
      call.url,
      `the unsubscribe went to ${call.url}; the IID backend has no single-token remove verb, only v1:batchRemove`,
    ).toBe("https://iid.googleapis.com/iid/v1:batchRemove");
    expect(
      call.body?.to,
      "the unsubscribe named the wrong topic path, so the wrong topic would be edited",
    ).toBe("/topics/offers");
    expect(
      call.body?.registration_tokens,
      "the unsubscribe carried no registration_tokens array, so the IID backend has nothing to remove",
    ).toEqual(["device-token-abc"]);
  });

  it("names the IID backend when a subscribe is refused", async () => {
    useNetwork([TOKEN_REPLY, jsonReply({ error: "InvalidToken" }, 400)]);

    await expect(
      fcm.subscribeToTopic("stale-token", "offers"),
      "a refused subscription did not raise an error",
    ).rejects.toThrow(/topic-subscription endpoint refused.*400/);
  });
});
