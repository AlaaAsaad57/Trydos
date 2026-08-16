// Turning a fault into something that can be written to the error log.
//
// This sits under every error report the app sends, from the website and from
// the phone app. Written out plainly, a fault turns into an empty pair of
// brackets and the report says nothing at all — so the whole point of this file
// is that the report still carries the message, and that it never hangs on a
// fault that points back at itself.

import { describe, expect, it } from "vitest";

import {
  extractPrimaryErrorMessage,
  serializeUnknownForErrorLog,
} from "utils/errorSerialization";

describe("preparing a fault for the error log (serializeUnknownForErrorLog)", () => {
  it("keeps the name, the message and where it happened", () => {
    const result: any = serializeUnknownForErrorLog(new Error("boom"));
    expect(result.name).toBe("Error");
    expect(result.message).toBe("boom");
    expect(result.stack).toContain("boom");
  });

  it("marks it so the log knows it was a fault and not an ordinary record", () => {
    expect((serializeUnknownForErrorLog(new Error("boom")) as any).__serializedError).toBe(
      true,
    );
  });

  it("keeps the fault that caused it", () => {
    const result: any = serializeUnknownForErrorLog(
      new Error("outer", { cause: new Error("inner") }),
    );
    expect(result.cause.message).toBe("inner");
  });

  it("keeps every fault when several happened at once", () => {
    const result: any = serializeUnknownForErrorLog(
      new AggregateError([new Error("a"), new Error("b")], "both failed"),
    );
    expect(result.errors.map((e: any) => e.message)).toEqual(["a", "b"]);
  });

  it("finds a fault buried inside an ordinary record", () => {
    const result: any = serializeUnknownForErrorLog({
      step: "checkout",
      failure: new Error("declined"),
    });
    expect(result.step).toBe("checkout");
    expect(result.failure.message).toBe("declined");
  });

  it("finds a fault inside a list", () => {
    const result: any = serializeUnknownForErrorLog([new Error("first")]);
    expect(result[0].message).toBe("first");
  });

  it("writes a date out in a form the log can read", () => {
    expect(serializeUnknownForErrorLog(new Date("2026-08-16T10:00:00Z"))).toBe(
      "2026-08-16T10:00:00.000Z",
    );
  });

  it("passes ordinary values through untouched", () => {
    expect(serializeUnknownForErrorLog("text")).toBe("text");
    expect(serializeUnknownForErrorLog(42)).toBe(42);
    expect(serializeUnknownForErrorLog(true)).toBe(true);
    expect(serializeUnknownForErrorLog(null)).toBeNull();
    expect(serializeUnknownForErrorLog(undefined)).toBeUndefined();
  });

  it("writes out the values a log cannot hold as text instead", () => {
    // `BigInt(10)` rather than the `10n` literal: the build targets a version
    // that has no literal form for it, and `tsc --noEmit` — which the pull
    // request gate runs — refuses the literal even though the runner accepts it.
    expect(serializeUnknownForErrorLog(BigInt(10))).toBe("10");
    expect(serializeUnknownForErrorLog(() => null)).toBe("[Function]");
    expect(serializeUnknownForErrorLog(Symbol("tag"))).toBe("Symbol(tag)");
  });

  it("leaves out the parts of a record that were never filled in", () => {
    expect(serializeUnknownForErrorLog({ a: 1, b: undefined })).toEqual({ a: 1 });
  });

  it("does not hang on a record that points back at itself", () => {
    const looping: any = { name: "loop" };
    looping.self = looping;
    expect(serializeUnknownForErrorLog(looping)).toEqual({
      name: "loop",
      self: "[Circular]",
    });
  });

  it("does not hang on a list that points back at itself", () => {
    const looping: any = [];
    looping.push(looping);
    expect(serializeUnknownForErrorLog(looping)).toEqual(["[Circular]"]);
  });

  it("stops going deeper once a record is buried too far down", () => {
    let deep: any = "bottom";
    for (let i = 0; i < 12; i++) deep = { next: deep };
    expect(JSON.stringify(serializeUnknownForErrorLog(deep))).toContain("[Max depth]");
  });
});

describe("choosing the line the error log is filed under (extractPrimaryErrorMessage)", () => {
  it("uses the message when there is one", () => {
    expect(extractPrimaryErrorMessage({ message: "payment declined" })).toBe(
      "payment declined",
    );
  });

  it("uses a message written one level in", () => {
    expect(extractPrimaryErrorMessage({ message: { message: "declined" } })).toBe(
      "declined",
    );
  });

  it("falls back to the message on the fault itself", () => {
    expect(extractPrimaryErrorMessage({ error: { message: "timed out" } })).toBe(
      "timed out",
    );
    expect(extractPrimaryErrorMessage({ err: "timed out" })).toBe("timed out");
  });

  it("writes the whole fault out when it carries no message", () => {
    expect(extractPrimaryErrorMessage({ error: { code: 500 } })).toBe('{"code":500}');
  });

  it("takes plain text as the line itself", () => {
    expect(extractPrimaryErrorMessage("something broke")).toBe("something broke");
  });

  it("writes a value that is not text out as text", () => {
    expect(extractPrimaryErrorMessage(404)).toBe("404");
  });

  it("says the fault is unknown when there is nothing to go on", () => {
    expect(extractPrimaryErrorMessage(null)).toBe("Unknown error");
    expect(extractPrimaryErrorMessage(undefined)).toBe("Unknown error");
    expect(extractPrimaryErrorMessage({})).toBe("Unknown error");
  });

  it("says the fault is unknown rather than filing everything under an empty line", () => {
    expect(extractPrimaryErrorMessage({ message: "" })).toBe("Unknown error");
  });

  it("still files a fault that points back at itself", () => {
    const looping: any = { code: 500 };
    looping.self = looping;
    expect(extractPrimaryErrorMessage({ error: looping })).toBe("[object Object]");
  });
});
