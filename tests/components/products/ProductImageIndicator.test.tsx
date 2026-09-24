// The "Only This Piece" tag on a product photo (server component).
import { describe, expect, it, vi } from "vitest";

import ProductImageIndicator from "components/products/ProductImageIndicator";

import { render, screen } from "../../render";

vi.mock("utils/server", () => ({
  translateFunction: (key: string, language: string) => `${language}:${key}`,
}));

describe("ProductImageIndicator", () => {
  it("shows the translated tag", () => {
    render(<ProductImageIndicator language="ar" />);
    expect(screen.getByText("ar:Only This Piece"), "the tag is not translated").toBeInTheDocument();
  });
});
