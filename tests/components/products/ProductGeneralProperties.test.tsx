// The rating / views strip on a product (ProductGeneralProperties) and the
// sheet it opens (GeneralPropertiesModal): star counts, sizing reviews, and the
// recommend / don't-recommend bar.
import { describe, expect, it, vi } from "vitest";

import ProductGeneralProperties from "components/products/ProductGeneralProperties";

import { fireEvent, renderWithProviders, screen } from "../../render";

vi.mock("components/settings/cards/RatingStars", () => ({
  default: ({ initialRating }: any) => <span data-testid="stars">{initialRating}</span>,
}));
vi.mock("components/global/BottomSheet", () => ({
  default: ({ children, onClose }: any) => (
    <div data-testid="sheet">
      <button onClick={onClose}>close sheet</button>
      {children}
    </div>
  ),
}));

const RATING_STATS = [
  { ratingGroup: 4, count: 3 },
  { ratingGroup: 5, count: 7 },
];

async function renderStrip(extra: any = {}, store: any = {}) {
  return renderWithProviders(
    <ProductGeneralProperties
      languageVariable="en"
      total_rating={4.5}
      rating_stats={RATING_STATS}
      recommendation_stats={[
        { category: "recommend", count: 3 },
        { category: "not_recommend", count: 1 },
      ]}
      views={120}
      sizeFitData={{ true_percentage: 60, small_percentage: 30, large_percentage: 10 }}
      {...extra}
    >
      <span>strip</span>
    </ProductGeneralProperties>,
    { store },
  );
}

describe("ProductGeneralProperties and GeneralPropertiesModal", () => {
  it("opens the sheet from the strip and shows the totals, stars and sizing", async () => {
    const { store } = await renderStrip({ good_quality_product: true });
    expect(screen.queryByTestId("sheet"), "the sheet showed before a tap").not.toBeInTheDocument();
    fireEvent.click(screen.getByText("strip"));
    expect(store.getState().ColorBottomSheet, "the strip did not open the sheet").toEqual({
      is_general_properties: true,
    });
    expect(screen.getByText("10", { selector: "span.bold" }), "the buyer total is not 3 + 7").toBeInTheDocument();
    expect(screen.getByText("Overall Good Quality"), "the good-quality mark is missing").toBeInTheDocument();
    expect(screen.getByText("120"), "the views are missing").toBeInTheDocument();
    const counts = screen.getAllByText(/^(3|7)$/, { selector: "span.bold" }).map((el) => el.textContent);
    expect(counts.slice(0, 2), "the star rows are not highest first").toEqual(["7", "3"]);
    expect(screen.getByText("60%"), "the true-to-size share is missing").toBeInTheDocument();
    const bar = document.querySelector(".bg-\\[\\#068D06\\]") as HTMLElement;
    expect(bar.style.width, "the recommend bar is not 3 of 4").toBe("75%");

    fireEvent.click(screen.getByText("close sheet"));
    expect(store.getState().ColorBottomSheet, "closing did not clear the sheet").toBe(false);
  });

  it("hides the recommend bar with no votes, and the quality mark when not earned, in Arabic", async () => {
    await renderStrip(
      { languageVariable: "ar", recommendation_stats: [], sizeFitData: undefined, rating_stats: undefined, views: undefined },
      { ColorBottomSheet: { is_general_properties: true }, language: "ar" },
    );
    expect(document.querySelector(".bg-\\[\\#068D06\\]"), "a bar showed with no votes").toBeNull();
    expect(screen.queryByText("Overall Good Quality"), "the quality mark showed when not earned").not.toBeInTheDocument();
    expect(screen.getAllByText("0%").length === 3, "missing sizing data is not 0%").toBe(true);
    expect(screen.getByText("1", { selector: ".view-count span" }), "missing views do not fall back to 1").toBeInTheDocument();
    expect(document.querySelector(".flex-row-reverse"), "the Arabic strip is not flipped").not.toBeNull();
  });
});
