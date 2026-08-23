import "server-only";

/**
 * Firebase Cloud Messaging over its public REST API.
 *
 * This replaces the `firebase-admin` SDK, which could not run on a non-Node
 * runtime (it needs gRPC and Node's crypto to sign the service-account
 * assertion). The whole of what this app asked that SDK to do was:
 *
 *   - mint a Google OAuth access token from the service account
 *   - send one message              (messaging.send)
 *   - subscribe a device to a topic (messaging.subscribeToTopic)
 *   - unsubscribe it                (messaging.unsubscribeFromTopic)
 *
 * All four are plain HTTPS calls. `app/api/info/route.ts` already called the
 * IID API with `fetch` and only borrowed the SDK for the access token, which is
 * what made this swap small.
 *
 * The assertion is signed with WebCrypto (RSASSA-PKCS1-v1_5 + SHA-256, which is
 * what RS256 means), available on both Node and Workers.
 */

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const IID_BASE = "https://iid.googleapis.com/iid";
const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

/**
 * Cached access token.
 *
 * Safe to hold at module scope even on Workers: this is a STRING, not an open
 * connection. The Workers restriction ("Cannot perform I/O on behalf of a
 * different request") applies to I/O objects - sockets, streams - not to plain
 * values. Reusing the token avoids a round-trip to Google on every push.
 */
let cachedToken: { value: string; expiresAt: number } | null = null;

/** Reset the cached access token. Exported for tests only. */
export function __resetTokenCache() {
  cachedToken = null;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing Firebase env var: ${name}`);
  }
  return value;
}

function base64UrlFromBytes(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlFromObject(value: object): string {
  return base64UrlFromBytes(new TextEncoder().encode(JSON.stringify(value)));
}

/**
 * Decode a PKCS#8 PEM private key into the raw bytes WebCrypto wants.
 *
 * The key arrives from the environment with literal "\n" sequences (that is how
 * it survives being pasted into a dashboard), which is why it is unescaped
 * before the header/footer are stripped.
 */
function pemToBytes(pem: string): ArrayBuffer {
  const body = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s/g, "");
  const binary = atob(body);
  // Allocate the ArrayBuffer directly rather than reaching through a
  // Uint8Array: `.buffer` is typed ArrayBufferLike (it might be a
  // SharedArrayBuffer), which crypto.subtle.importKey refuses.
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

/**
 * Exchange the service-account key for a short-lived Google access token.
 *
 * Never log or return the private key or the signed assertion - only the
 * resulting bearer token, and only to callers inside this module.
 */
export async function getAccessToken(): Promise<string> {
  // Refresh a minute early so a token cannot expire mid-flight.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const clientEmail = requireEnv("FIREBASE_CLIENT_EMAIL");
  const privateKey = requireEnv("FIREBASE_PRIVATE_KEY");

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: FCM_SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: issuedAt,
    exp: issuedAt + 3600,
  };

  const signingInput = `${base64UrlFromObject(header)}.${base64UrlFromObject(
    claims,
  )}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBytes(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );

  const assertion = `${signingInput}.${base64UrlFromBytes(signature)}`;

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const payload = (await response.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  } | null;

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      `the Google OAuth token endpoint refused the service account (${
        response.status
      }${payload?.error_description ? `: ${payload.error_description}` : ""})`,
    );
  }

  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

/**
 * The message shape accepted by FCM's HTTP v1 `messages:send`.
 *
 * Hand-written because it used to be inferred from the SDK's `send()` type.
 * Only the fields this app actually sends are modelled; add a field here when
 * a caller starts sending it, so a typo stays a type error.
 */
export type FcmMessage = {
  topic?: string;
  token?: string;
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
  webpush?: { fcm_options?: { link?: string } };
  apns?: { payload?: { aps?: { badge?: number } } };
};

async function authorizedHeaders(): Promise<Record<string, string>> {
  return {
    Authorization: `Bearer ${await getAccessToken()}`,
    "Content-Type": "application/json",
  };
}

/**
 * Send one message. Returns the FCM message id.
 *
 * Replaces `messaging.send(message)`.
 */
export async function sendMessage(message: FcmMessage): Promise<string> {
  const projectId = requireEnv("FIREBASE_PROJECT_ID");
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: await authorizedHeaders(),
      body: JSON.stringify({ message }),
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    name?: string;
    error?: { message?: string };
  } | null;

  if (!response.ok || !payload?.name) {
    throw new Error(
      `the FCM send endpoint rejected the message (${response.status}${
        payload?.error?.message ? `: ${payload.error.message}` : ""
      })`,
    );
  }

  // `name` is "projects/<project>/messages/<id>"; the id is the last segment.
  return payload.name.split("/").pop() ?? payload.name;
}

/**
 * Subscribe one device token to a topic.
 *
 * Replaces `messaging.subscribeToTopic(token, topic)`. The IID API needs the
 * `access_token_auth` header when authenticating with an OAuth bearer token
 * rather than a legacy server key - same as `app/api/info/route.ts` already did.
 */
export async function subscribeToTopic(
  token: string,
  topic: string,
): Promise<void> {
  const response = await fetch(
    `${IID_BASE}/v1/${encodeURIComponent(token)}/rel/topics/${encodeURIComponent(
      topic,
    )}`,
    {
      method: "POST",
      headers: { ...(await authorizedHeaders()), access_token_auth: "true" },
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `the FCM topic-subscription endpoint refused the token (${
        response.status
      }${detail ? `: ${detail.slice(0, 200)}` : ""})`,
    );
  }
}

/**
 * Unsubscribe one device token from a topic.
 *
 * Replaces `messaging.unsubscribeFromTopic(token, topic)`. The IID API has no
 * single-token remove verb, so this uses the batch endpoint with one token.
 */
export async function unsubscribeFromTopic(
  token: string,
  topic: string,
): Promise<void> {
  const response = await fetch(`${IID_BASE}/v1:batchRemove`, {
    method: "POST",
    headers: { ...(await authorizedHeaders()), access_token_auth: "true" },
    body: JSON.stringify({
      to: `/topics/${topic}`,
      registration_tokens: [token],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `the FCM topic-unsubscription endpoint refused the token (${
        response.status
      }${detail ? `: ${detail.slice(0, 200)}` : ""})`,
    );
  }
}
