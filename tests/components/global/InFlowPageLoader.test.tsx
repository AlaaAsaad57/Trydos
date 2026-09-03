// Which loader the in-flow navigation loader picks (AC-10).
//
// The seller dashboard's back journey used to set a bare `true`, which falls
// through every branch of this picker to the last one — a 15x15 spinner scaled
// five times inside a `min-h-[50vh]` box. That box is the whole of the document
// while the real page is `display:none`, which is how the page ended up
// collapsed and scrolled somewhere else.
//
// The back journey now marks itself. The forward click deliberately does not:
// it is heading for an editor, so drawing the dashboard would be the shape of
// the page being left.
import { describe, expect, it } from "vitest";

import { render } from "@testing-library/react";

import InFlowPageLoader from "components/global/InFlowPageLoader";

const dashboardShape = (root: HTMLElement) =>
  root.querySelector('[data-pw="seller-dashboard-loader"]');
const genericSpinner = (root: HTMLElement) => root.querySelector(".spin-cont");

describe("the in-flow navigation loader", () => {
  it("shows the dashboard shape for a seller-dashboard back navigation (AC-10)", () => {
    const { container } = render(
      <InFlowPageLoader
        nav={{ is_seller_dashboard: true, no_overlay_scroll: true }}
      />,
    );

    expect(
      dashboardShape(container),
      "a back navigation to the seller dashboard did not get the dashboard shape, so it falls through to the generic loader",
    ).not.toBeNull();

    expect(
      genericSpinner(container),
      "the seller-dashboard branch still rendered the generic spinner — that is the scale-[5] spinner in a half-screen box, which is what collapses the page",
    ).toBeNull();
  });

  it("does not show the dashboard shape for the forward click into an editor (AC-10)", () => {
    // What `handleCardNavigate` sets: a bare `true`, on purpose.
    const { container } = render(<InFlowPageLoader nav={true} />);

    expect(
      dashboardShape(container),
      "the forward click into a product editor drew the dashboard shape — that is the shape of the page being left, not the one being opened",
    ).toBeNull();
  });

  it("leaves every other navigation on the loader it already had", () => {
    const { container } = render(<InFlowPageLoader nav={{ is_settings: true }} />);

    expect(
      dashboardShape(container),
      "a settings navigation was given the seller-dashboard shape, so the new branch is matching more than it should",
    ).toBeNull();

    expect(
      container.querySelector('[data-pw="settings-loader"]'),
      "a settings navigation stopped getting the settings loader, so the added branch changed a journey it had no business touching",
    ).not.toBeNull();
  });

  it("renders nothing when no navigation is in flight", () => {
    const { container } = render(<InFlowPageLoader nav={null} />);

    expect(
      container.innerHTML,
      "the loader drew something with no navigation in flight, which would sit on top of a page that is not going anywhere",
    ).toBe("");
  });
});
