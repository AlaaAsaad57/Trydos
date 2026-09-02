import { describe, expect, it, vi } from "vitest";

// The label is the only part this helper translates, so a pass-through keeps
// the assertions about the shape of the line, not about a translation file.
vi.mock("utils/functions", () => ({
  translateFunction: vi.fn((key: string) => key),
}));

const { parseFieldErrors, formatFieldErrors } = await import("utils/fieldErrors");

describe("reading a field-by-field refusal", () => {
  it("unpacks the JSON object the backend puts inside `message`", () => {
    const parsed = parseFieldErrors('{"email":["email already exists"]}');

    expect(parsed, "the refusal was not recognised as a field refusal").not.toBeNull();
    expect(parsed![0].field, "the refused field name was lost").toBe("email");
    expect(
      parsed![0].messages,
      "the backend's own sentence was lost",
    ).toEqual(["email already exists"]);
  });

  it("keeps every refused field, not only the first", () => {
    const parsed = parseFieldErrors(
      '{"email":["email already exists"],"phone":["phone already exists"]}',
    );

    expect(
      parsed!.map((e) => e.field),
      "a save refused on two fields told the shopper about one of them",
    ).toEqual(["email", "phone"]);
  });

  it("keeps every sentence a single field carries", () => {
    const parsed = parseFieldErrors(
      '{"name":["name is too short","name has invalid characters"]}',
    );

    expect(
      parsed![0].messages,
      "the second reason a field was refused was dropped",
    ).toEqual(["name is too short", "name has invalid characters"]);
  });

  it("accepts a plain string value as well as a list", () => {
    const parsed = parseFieldErrors('{"gender":"gender is required"}');

    expect(
      parsed![0].messages,
      "a refusal written as a single string was read as nothing",
    ).toEqual(["gender is required"]);
  });

  it("leaves an ordinary error message alone", () => {
    expect(
      parseFieldErrors("Server down"),
      "a normal error message was mistaken for a field refusal",
    ).toBeNull();
  });

  it("leaves text that only looks like JSON alone", () => {
    expect(
      parseFieldErrors("{not json"),
      "unparseable text was mistaken for a field refusal",
    ).toBeNull();
  });

  it("ignores a JSON array, which carries no field names", () => {
    expect(
      parseFieldErrors('["email already exists"]'),
      "a list with no field names was read as a field refusal",
    ).toBeNull();
  });

  it("ignores an object whose values hold no text", () => {
    expect(
      parseFieldErrors('{"email":[],"phone":[""]}'),
      "an empty refusal would have shown the shopper a blank line",
    ).toBeNull();
  });

  it("ignores a value that is not a string at all", () => {
    expect(
      parseFieldErrors(undefined),
      "a missing message was read as a field refusal",
    ).toBeNull();
  });
});

describe("writing the line the shopper reads", () => {
  it("puts the field label in front of the backend's own sentence", () => {
    expect(
      formatFieldErrors('{"email":["email already exists"]}'),
      "the shopper was not told which field the backend refused",
    ).toBe("Email: email already exists");
  });

  it("gives every profile field its own known label", () => {
    expect(
      formatFieldErrors(
        '{"name":["a"],"phone":["b"],"alternative_phone":["c"],"gender":["d"],"weight":["e"],"tall":["f"]}',
      ),
      "a profile field was shown with no label, or with its raw backend key",
    ).toBe(
      [
        "Full Name: a",
        "Phone Number: b",
        "Alternative Phone: c",
        "Gender: d",
        "Weight: e",
        "Height: f",
      ].join("\n"),
    );
  });

  it("writes one line per refused field", () => {
    expect(
      formatFieldErrors('{"email":["taken"],"name":["too short"]}'),
      "two refused fields were not shown as two lines",
    ).toBe("Email: taken\nFull Name: too short");
  });

  it("shows the sentence with no label when the field is not one it knows", () => {
    expect(
      formatFieldErrors('{"some_new_key":["is not allowed"]}'),
      "a raw backend field name reached the screen",
    ).toBe("is not allowed");
  });

  it("answers null for an ordinary error, so the caller keeps its own message", () => {
    expect(
      formatFieldErrors("Server down"),
      "a normal error message would have been replaced",
    ).toBeNull();
  });
});
