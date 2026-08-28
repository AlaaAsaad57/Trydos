import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import CartErrorComponent from "components/Cart/CartErrorComponent";

vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "sy-en" }),
}));

describe("CartErrorComponent component", () => {
  it("renders error message and triggers onRetry when button is clicked", () => {
    const onRetryMock = vi.fn();
    render(<CartErrorComponent errorMessage="Network Timeout" onRetry={onRetryMock} />);

    expect(screen.getByText("Network Timeout"), "error message text should render").toBeInTheDocument();
    
    const retryButton = screen.getByRole("button", { name: /Try Again|Retry/i });
    expect(retryButton, "retry button should exist").toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetryMock, "onRetry callback should be called when clicked").toHaveBeenCalledTimes(1);
  });
});
