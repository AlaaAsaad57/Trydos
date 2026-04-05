const MAX_DEPTH = 10;

export type SerializedErrorShape = {
  __serializedError: true;
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
  errors?: unknown[];
};

/**
 * Deep-clone a value for JSON / mobile error logs: Error instances become plain
 * objects (name, message, stack, cause, AggregateError.errors). Handles cycles.
 * Without this, JSON.stringify turns nested Error values into {}.
 */
export const serializeUnknownForErrorLog = (value: unknown): unknown => {
  const seen = new WeakSet<object>();

  const walk = (v: unknown, depth: number): unknown => {
    if (depth > MAX_DEPTH) {
      return "[Max depth]";
    }

    if (v === undefined) {
      return undefined;
    }
    if (v === null) {
      return null;
    }

    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean") {
      return v;
    }
    if (t === "bigint") {
      return v.toString();
    }
    if (t === "function") {
      return "[Function]";
    }
    if (t === "symbol") {
      return v.toString();
    }

    if (v instanceof Error) {
      const out: SerializedErrorShape = {
        __serializedError: true,
        name: v.name,
        message: v.message,
        stack: v.stack,
      };
      const withCause = v as Error & { cause?: unknown };
      if (withCause.cause !== undefined) {
        out.cause = walk(withCause.cause, depth + 1);
      }
      if (typeof AggregateError !== "undefined" && v instanceof AggregateError) {
        out.errors = v.errors.map((e) => walk(e, depth + 1));
      }
      return out;
    }

    if (v instanceof Date) {
      return v.toISOString();
    }

    if (Array.isArray(v)) {
      if (seen.has(v)) {
        return "[Circular]";
      }
      seen.add(v);
      return v.map((item) => walk(item, depth + 1));
    }

    if (typeof v === "object") {
      if (seen.has(v)) {
        return "[Circular]";
      }
      seen.add(v);
      const o = v as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(o)) {
        try {
          const next = walk(o[key], depth + 1);
          if (next !== undefined) {
            out[key] = next;
          }
        } catch {
          out[key] = "[Unserializable]";
        }
      }
      return out;
    }

    return String(v);
  };

  return walk(value, 0);
};

const readStringMessage = (val: unknown): string | undefined => {
  if (val === undefined || val === null) {
    return undefined;
  }
  if (typeof val === "string") {
    return val;
  }
  if (typeof val === "object" && "message" in val) {
    const m = (val as { message: unknown }).message;
    if (typeof m === "string" && m.length > 0) {
      return m;
    }
  }
  return undefined;
};

/**
 * Best-effort primary message for Sentry grouping after optional serialization.
 */
export const extractPrimaryErrorMessage = (payload: unknown): string => {
  if (payload === null || payload === undefined) {
    return "Unknown error";
  }
  if (typeof payload !== "object") {
    return typeof payload === "string" ? payload : String(payload);
  }

  const p = payload as Record<string, unknown>;

  const top = readStringMessage(p.message);
  if (top) {
    return top;
  }

  const fromErr = readStringMessage(p.error) ?? readStringMessage(p.err);
  if (fromErr) {
    return fromErr;
  }

  if (p.error !== undefined) {
    try {
      return JSON.stringify(p.error);
    } catch {
      return String(p.error);
    }
  }

  return "Unknown error";
};
