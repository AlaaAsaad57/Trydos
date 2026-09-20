// The shared pieces every seller-dashboard section is built from
// (components/SellerDashboard/ui). Each one carries a small decision that a
// section depends on, and a wrong decision is visible to the seller:
//
//   Monogram     - a shop with no logo must show its initials, never a grey box
//   DashButton   - a saving button must not be clickable twice
//   Segmented    - the sub-tab the seller is on must be the selected one
//   Pagination   - the first page must not offer "Previous"
//   DashField    - an error must replace the hint, not sit under it
//   StatusPill / InlineAlert / EmptyState / ErrorState / AccessDenied
//
// English is the source language, so `translateFunction` gives back the key
// itself. That is why the copy below is asserted in English.
import { describe, expect, it, vi } from "vitest";

import {
  AccessDenied,
  DashButton,
  DashCard,
  DashField,
  EmptyState,
  ErrorState,
  InlineAlert,
  Monogram,
  Pagination,
  SectionHeader,
  Segmented,
  StatusPill,
} from "components/SellerDashboard/ui";

import { renderWithProviders, screen, userEvent } from "../../../render";

describe("Monogram", () => {
  it("shows the first letter of each of the first two words", async () => {
    await renderWithProviders(<Monogram name="Damascus Fine Goods" />);
    expect(
      screen.getByText("DF"),
      "a two-word shop name should show the first two initials",
    ).toBeInTheDocument();
  });

  it("uppercases the initials whatever the seller typed", async () => {
    await renderWithProviders(<Monogram name="sweet things" />);
    expect(
      screen.getByText("ST"),
      "a lower-case shop name should still show upper-case initials",
    ).toBeInTheDocument();
  });

  it("shows the logo instead of initials when the shop has one", async () => {
    await renderWithProviders(
      <Monogram name="My Shop" src="https://example.com/logo.webp" />,
    );
    const logo = screen.getByRole("img");
    expect(
      logo.getAttribute("src"),
      "the shop logo should be the picture that is shown",
    ).toBe("https://example.com/logo.webp");
    expect(
      screen.queryByText("MS"),
      "the initials must not be drawn on top of the logo",
    ).not.toBeInTheDocument();
  });

  it("falls back to an icon when there is neither a name nor a logo", async () => {
    const { container } = await renderWithProviders(<Monogram />);
    expect(
      container.querySelector("svg"),
      "with no name and no logo the shop icon should be drawn",
    ).toBeTruthy();
  });
});

describe("DashButton", () => {
  it("runs its action on a click", async () => {
    const onClick = vi.fn();
    await renderWithProviders(<DashButton onClick={onClick}>Save</DashButton>);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick, "clicking the button should run its action").toHaveBeenCalledTimes(
      1,
    );
  });

  it("cannot be clicked while it is loading", async () => {
    const onClick = vi.fn();
    await renderWithProviders(
      <DashButton loading onClick={onClick}>
        Save
      </DashButton>,
    );
    const button = screen.getByRole("button");
    expect(
      button,
      "a saving button must be disabled so the seller cannot save twice",
    ).toBeDisabled();
    await userEvent.click(button);
    expect(
      onClick,
      "a click on a loading button must not reach the action",
    ).not.toHaveBeenCalled();
  });

  it("hides its label while it is loading", async () => {
    await renderWithProviders(<DashButton loading>Save</DashButton>);
    expect(
      screen.queryByText("Save"),
      "the spinner replaces the label while saving",
    ).not.toBeInTheDocument();
  });
});

describe("Segmented", () => {
  it("marks only the current option as selected", async () => {
    await renderWithProviders(
      <Segmented
        value="active"
        options={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole("tab", { name: "Active" }).getAttribute("aria-selected"),
      "the option the seller is on should read as selected",
    ).toBe("true");
    expect(
      screen.getByRole("tab", { name: "Inactive" }).getAttribute("aria-selected"),
      "the option the seller is not on should not read as selected",
    ).toBe("false");
  });

  it("reports the value that was picked", async () => {
    const onChange = vi.fn();
    await renderWithProviders(
      <Segmented
        value="active"
        options={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("tab", { name: "Inactive" }));
    expect(
      onChange,
      "picking an option should report that option's value",
    ).toHaveBeenCalledWith("inactive");
  });
});

describe("Pagination", () => {
  it("shows which page of how many the seller is on", async () => {
    await renderWithProviders(
      <Pagination current={2} last={5} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(
      screen.getByText(/Page\s*2\s*\/\s*5/),
      "the seller should be told the page number and the total",
    ).toBeInTheDocument();
  });

  it("offers no Previous on the first page", async () => {
    await renderWithProviders(
      <Pagination current={1} last={5} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: /Previous/ }),
      "there is no page before the first one",
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Next/ }),
      "the first of five pages should still offer Next",
    ).toBeEnabled();
  });

  it("offers no Next on the last page", async () => {
    await renderWithProviders(
      <Pagination current={5} last={5} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: /Next/ }),
      "there is no page after the last one",
    ).toBeDisabled();
  });

  it("offers neither direction while a page is still loading", async () => {
    await renderWithProviders(
      <Pagination
        current={3}
        last={5}
        disabled
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Previous/ }),
      "Previous must be blocked while the page is loading",
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Next/ }),
      "Next must be blocked while the page is loading",
    ).toBeDisabled();
  });

  it("asks for the page in the direction that was clicked", async () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    await renderWithProviders(
      <Pagination current={3} last={5} onPrev={onPrev} onNext={onNext} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(onNext, "clicking Next should ask for the next page").toHaveBeenCalledTimes(
      1,
    );
    await userEvent.click(screen.getByRole("button", { name: /Previous/ }));
    expect(
      onPrev,
      "clicking Previous should ask for the previous page",
    ).toHaveBeenCalledTimes(1);
  });
});

describe("DashField", () => {
  it("shows the hint when there is no error", async () => {
    await renderWithProviders(
      <DashField label="Name" hint="Shown to shoppers">
        <input />
      </DashField>,
    );
    expect(
      screen.getByText("Shown to shoppers"),
      "the hint should be shown while the field is fine",
    ).toBeInTheDocument();
  });

  it("replaces the hint with the error, so only one line is read", async () => {
    await renderWithProviders(
      <DashField label="Name" hint="Shown to shoppers" error="Name is required.">
        <input />
      </DashField>,
    );
    expect(
      screen.getByText("Name is required."),
      "the field error should be shown under the field",
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Shown to shoppers"),
      "the hint must give way to the error, not sit beside it",
    ).not.toBeInTheDocument();
  });
});

describe("the state blocks", () => {
  it("EmptyState shows its title, its note and its action", async () => {
    await renderWithProviders(
      <EmptyState
        title="No products yet"
        subtitle="Add your first product"
        action={<DashButton>Add product</DashButton>}
      />,
    );
    expect(
      screen.getByText("No products yet"),
      "the empty section should say what is missing",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Add your first product"),
      "the empty section should say what to do next",
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add product" }),
      "the empty section should offer the action that fills it",
    ).toBeInTheDocument();
  });

  it("ErrorState shows the backend's own message", async () => {
    await renderWithProviders(<ErrorState message="The shop list did not load." />);
    expect(
      screen.getByText("The shop list did not load."),
      "the error the section hit should be shown, not a generic one",
    ).toBeInTheDocument();
  });

  it("ErrorState offers Retry only when there is something to retry", async () => {
    const onRetry = vi.fn();
    const { unmount } = await renderWithProviders(
      <ErrorState message="Failed" onRetry={onRetry} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry, "Retry should ask the section to load again").toHaveBeenCalledTimes(
      1,
    );
    unmount();

    await renderWithProviders(<ErrorState message="Failed" />);
    expect(
      screen.queryByRole("button", { name: "Retry" }),
      "with no retry handler there should be no Retry button",
    ).not.toBeInTheDocument();
  });

  it("AccessDenied names the missing permission instead of offering a retry", async () => {
    await renderWithProviders(
      <AccessDenied message="You need READ_SHOP_INFO to see this." />,
    );
    expect(
      screen.getByText("Access Denied"),
      "a blocked section should say it is blocked",
    ).toBeInTheDocument();
    expect(
      screen.getByText("You need READ_SHOP_INFO to see this."),
      "a blocked section should say which permission is missing",
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Retry" }),
      "retrying cannot grant a permission, so no Retry is offered",
    ).not.toBeInTheDocument();
  });
});

describe("StatusPill, InlineAlert, SectionHeader and DashCard", () => {
  it("StatusPill shows the word it was given", async () => {
    await renderWithProviders(<StatusPill active>Active</StatusPill>);
    expect(
      screen.getByText("Active"),
      "the status pill should read Active",
    ).toBeInTheDocument();
  });

  it("InlineAlert shows the message for every tone", async () => {
    const { unmount } = await renderWithProviders(
      <InlineAlert tone="success">Saved</InlineAlert>,
    );
    expect(
      screen.getByText("Saved"),
      "a success banner should carry its message",
    ).toBeInTheDocument();
    unmount();

    await renderWithProviders(<InlineAlert tone="warning">Check the size</InlineAlert>);
    expect(
      screen.getByText("Check the size"),
      "a warning banner should carry its message",
    ).toBeInTheDocument();
  });

  it("SectionHeader shows the title and the count of rows", async () => {
    await renderWithProviders(
      <SectionHeader title="Locations" count={4} right={<span>right slot</span>} />,
    );
    expect(
      screen.getByRole("heading", { name: "Locations" }),
      "the section heading should name the section",
    ).toBeInTheDocument();
    expect(
      screen.getByText("4"),
      "the heading should show how many rows the section holds",
    ).toBeInTheDocument();
    expect(
      screen.getByText("right slot"),
      "the heading's right slot should be rendered",
    ).toBeInTheDocument();
  });

  it("SectionHeader shows no count when there is none to show", async () => {
    await renderWithProviders(<SectionHeader title="Shop info" />);
    expect(
      screen.getByRole("heading", { name: "Shop info" }),
      "a section with no rows should still show its heading",
    ).toBeInTheDocument();
  });

  it("SectionHeader shows a zero count rather than hiding it", async () => {
    await renderWithProviders(<SectionHeader title="Locations" count={0} />);
    expect(
      screen.getByText("0"),
      "an empty section should say zero, not leave the count blank",
    ).toBeInTheDocument();
  });

  it("DashCard renders what is put inside it", async () => {
    await renderWithProviders(
      <DashCard>
        <p>card body</p>
      </DashCard>,
    );
    expect(
      screen.getByText("card body"),
      "the card should render its contents",
    ).toBeInTheDocument();
  });
});
