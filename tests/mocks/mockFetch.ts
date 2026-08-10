// A fake network. It hands back replies you queued up, in order, and writes
// down every call it was asked to make.
//
// Use it when a test has to prove what went over the network — how many calls,
// to which address, with which method and body. (When a test only needs the
// helper to return something, replace the helper itself with
// tests/mocks/fetchData.ts; that is cheaper.)
//
//   const net = makeMockFetch([
//     jsonReply({ success: true }),
//     failureReply("Network down"),
//   ]);
//   vi.stubGlobal("fetch", net.fetch);
//   ...
//   expect(net.calls).toHaveLength(2);
//   expect(net.calls[0].url).toBe("/auth/register-guest");
//
// It is hand-written and imports nothing, so it never reaches a real network.

/** One recorded call. */
export type RecordedCall = {
  url: string;
  method: string;
  /** The request body, parsed from JSON when it was JSON. */
  body: any;
  /** The headers the caller sent, lower-cased by name. */
  headers: Record<string, string>;
};

/** One queued reply: either a response to give back, or a failure to throw. */
export type QueuedReply =
  | { kind: "response"; status: number; body: any; headers: Record<string, string> }
  | { kind: "failure"; error: Error };

/** A reply that succeeds and carries JSON. */
export function jsonReply(body: any, status = 200): QueuedReply {
  return {
    kind: "response",
    status,
    body,
    headers: { "content-type": "application/json" },
  };
}

/** A reply that fails the way a dropped connection does. */
export function failureReply(message = "Failed to fetch"): QueuedReply {
  return { kind: "failure", error: new Error(message) };
}

/**
 * Build a fake network from a list of replies.
 *
 * The replies come back in the order you gave them. When the list runs out and
 * something asks for another one, the fake network **raises a clear error
 * naming the address that was asked for**. It never returns an empty result and
 * it never hangs — a test that makes one call too many should fail loudly and
 * say which call it was.
 */
export function makeMockFetch(replies: QueuedReply[] = []) {
  const queue = [...replies];
  const calls: RecordedCall[] = [];

  const parseBody = (raw: any) => {
    if (raw == null) return null;
    if (typeof raw !== "string") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };

  const readHeaders = (raw: any): Record<string, string> => {
    const out: Record<string, string> = {};
    if (!raw) return out;
    if (typeof raw.forEach === "function") {
      raw.forEach((value: string, key: string) => {
        out[String(key).toLowerCase()] = value;
      });
      return out;
    }
    Object.entries(raw).forEach(([key, value]) => {
      out[key.toLowerCase()] = String(value);
    });
    return out;
  };

  const fetch = vi.fn(async (input: any, init: any = {}) => {
    const url = typeof input === "string" ? input : String(input?.url ?? input);
    const method = String(init?.method ?? "GET").toUpperCase();

    calls.push({
      url,
      method,
      body: parseBody(init?.body),
      headers: readHeaders(init?.headers),
    });

    const next = queue.shift();
    if (!next) {
      throw new Error(
        `makeMockFetch: no reply left for ${method} ${url}. ` +
          `${calls.length} call(s) were made but only ${replies.length} reply/replies were queued. ` +
          `Queue another reply, or check why the code under test called again.`,
      );
    }

    if (next.kind === "failure") {
      throw next.error;
    }

    return {
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      headers: {
        get: (name: string) => next.headers[String(name).toLowerCase()] ?? null,
      },
      json: async () => next.body,
      text: async () =>
        typeof next.body === "string" ? next.body : JSON.stringify(next.body),
    };
  });

  return {
    /** Pass this to `vi.stubGlobal("fetch", ...)`. */
    fetch,
    /** Every call, in the order it was made. */
    calls,
    /** How many calls were made. */
    get callCount() {
      return calls.length;
    },
    /** How many queued replies are still unused. */
    get repliesLeft() {
      return queue.length;
    },
    /** Add another reply while a test is running. */
    queueReply(reply: QueuedReply) {
      queue.push(reply);
    },
  };
}
