import { beforeAll, describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/react";

import ProductPhotosWrapper from "components/ServerWrapper/ProductWrapper/ProductPhotosWrapper";

// jsdom has no IntersectionObserver / ResizeObserver; the carousel asks for both.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", NoopObserver);
  vi.stubGlobal("ResizeObserver", NoopObserver);
});

describe("the product card photo carousel", () => {
  it("puts the photos it is given inside the carousel track", () => {
    const { getByText, container } = render(
      <ProductPhotosWrapper>
        <div>photo one</div>
      </ProductPhotosWrapper>,
    );
    expect(
      container.querySelector(".embla__container")?.contains(getByText("photo one")),
      "the photo should be inside the carousel track",
    ).toBe(true);
  });
});
