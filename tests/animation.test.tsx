import { fireEvent, render, waitFor } from "@testing-library/react";
import TestAnimation from "components/TestAnimation";

it("should toggle visibility of animated container when button is clicked", async () => {
  const { getByTestId, queryByTestId } = render(<TestAnimation />);

  const container = getByTestId("container");
  expect(container).toBeInTheDocument();

  const button = getByTestId("animation-button");
  expect(button).toBeInTheDocument();
  fireEvent.click(button);

  // Wait for the animated container to appear
  await waitFor(
    () => expect(getByTestId("animated-container")).toBeInTheDocument(),
    { timeout: 2000 }
  );

  const animatedChild = getByTestId("animation-component");
  expect(animatedChild).toBeInTheDocument();

  fireEvent.click(button);

  // Wait for the animated container to disappear
  await waitFor(
    () => expect(queryByTestId("animated-container")).not.toBeInTheDocument(),
    { timeout: 2000 }
  );
});
