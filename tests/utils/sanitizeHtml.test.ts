import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "utils/sanitizeHtml";

describe("sanitizeHtml security utility", () => {
  it("returns empty string for null, undefined, or empty input", () => {
    expect(sanitizeHtml(null), "should return empty string for null").toBe("");
    expect(sanitizeHtml(undefined), "should return empty string for undefined").toBe("");
    expect(sanitizeHtml(""), "should return empty string for empty string").toBe("");
  });

  it("preserves safe HTML markup such as bold, italics, paragraphs, and lists", () => {
    const safeInput = "<p>Hello <strong>World</strong> <em>seller</em></p><ul><li>Item 1</li></ul>";
    expect(sanitizeHtml(safeInput), "should preserve safe HTML tags").toBe(safeInput);
  });

  it("strips script tags and inline event handlers like onerror and onload", () => {
    const maliciousInput = `<p>Test</p><script>alert('xss')</script><img src="x" onerror="alert(1)" />`;
    const sanitized = sanitizeHtml(maliciousInput);
    expect(sanitized.includes("<script>"), "should strip script tag").toBe(false);
    expect(sanitized.includes("alert"), "should strip script content").toBe(false);
    expect(sanitized.includes("onerror"), "should strip onerror handler").toBe(false);
  });

  it("strips javascript: pseudo-protocol URLs in href attributes", () => {
    const maliciousLink = `<a href="javascript:alert(1)">Click Here</a>`;
    const sanitized = sanitizeHtml(maliciousLink);
    expect(sanitized.includes("javascript:"), "should remove javascript: URL").toBe(false);
  });
});
