import { act, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<any>, options: any) => {
    const Dyn = () => {
      loader();
      return options.loading();
    };
    return Dyn;
  },
}));
vi.mock("components/Home/Stories/AddStoryWidget", () => ({ default: () => null }));
vi.mock("components/skeleton/AddStorySkeleton", () => ({
  default: () => <div data-testid="add-story-skeleton" />,
}));

import AddStoryWidgetLazy from "components/Home/Stories/AddStoryWidgetLazy";

describe("AddStoryWidgetLazy", () => {
  it("draws nothing until the add-story sheet is first opened, then keeps it mounted", async () => {
    const { store } = await renderWithProviders(<AddStoryWidgetLazy />, {
      store: { addStoryEnable: false },
    });
    expect(screen.queryByTestId("add-story-skeleton"), "the widget loaded before it was asked for").toBeNull();

    act(() => store.setState({ addStoryEnable: true } as any));
    expect(screen.getByTestId("add-story-skeleton"), "opening the sheet did not load the widget").toBeInTheDocument();

    act(() => store.setState({ addStoryEnable: false } as any));
    expect(
      screen.getByTestId("add-story-skeleton"),
      "closing the sheet unmounted the widget; it must stay mounted",
    ).toBeInTheDocument();
  });
});
