// The search box with a drop-down list used twice on the compare page.
import { afterEach, describe, expect, it, vi } from "vitest";

import AsyncSelectCustom from "components/global/AsyncSelectCustom";

import { act, fireEvent, renderWithProviders, screen, userEvent } from "../../render";

afterEach(() => {
  vi.useRealTimers();
});

const shirt = { label: "Shirt", value: "shirt", images: { file_path: "a.jpg" }, price: 12.5 };
const hat = { label: "Hat", value: "hat", images: { file_path: "" } };

const setup = async (props: Record<string, any> = {}) => {
  const handlers = { onSearch: vi.fn(), onChange: vi.fn(), onClear: vi.fn() };
  const result = await renderWithProviders(
    <div>
      <span>outside</span>
      <AsyncSelectCustom
        placeholder="Search"
        options={[shirt, hat]}
        isLoading={false}
        className="w-full"
        selectedOption={null}
        testId="slot"
        {...handlers}
        {...props}
      />
    </div>,
  );
  const input = document.querySelector('[data-pw="slot-input"]') as HTMLInputElement;
  return { ...handlers, ...result, input };
};

describe("the async select", () => {
  it("opens its list on focus and shows each option with its picture and price", async () => {
    const { input } = await setup();
    await userEvent.click(input);

    expect(document.querySelector('[data-pw="slot-options"]'), "focusing the box must open the list").toBeInTheDocument();
    expect(screen.getByAltText("Shirt"), "an option with a picture must show it").toBeInTheDocument();
    expect(screen.queryByAltText("Hat"), "an option with no picture path must not draw a broken image").toBeNull();
    expect(screen.getByText("$12.50"), "the option price must show with two decimals").toBeInTheDocument();
  });

  it("searches as the shopper types, but not for an empty box", async () => {
    const { input, onSearch } = await setup();
    await userEvent.type(input, "sh");
    expect(onSearch, "typing must search for the text in the box").toHaveBeenLastCalledWith("sh");

    onSearch.mockClear();
    await userEvent.clear(input);
    expect(onSearch, "an emptied box must not start a search").not.toHaveBeenCalled();
  });

  it("picks an option: fills the box, reports it, and closes the list", async () => {
    const { input, onChange } = await setup();
    await userEvent.click(input);
    await userEvent.click(screen.getByText("Shirt"));

    expect(onChange, "the picked option was not reported to the page").toHaveBeenCalledWith(shirt);
    expect(input.value, "the box must show the picked option's name").toBe("Shirt");
    expect(document.querySelector('[data-pw="slot-options"]'), "the list must close after a pick").toBeNull();
  });

  it("clears the pick with the cross button", async () => {
    const { input, onChange, onClear } = await setup();
    await userEvent.click(input);
    await userEvent.click(screen.getByText("Shirt"));
    await userEvent.click(document.querySelector('[data-pw="slot-clear"]') as HTMLElement);

    expect(onChange, "clearing must report no product").toHaveBeenLastCalledWith(null);
    expect(onClear, "clearing must tell the page").toHaveBeenCalled();
    expect(input.value, "clearing must empty the box").toBe("");
  });

  it("clears without error when the page gave no clear handler", async () => {
    const { input, onChange } = await setup({ onClear: undefined });
    await userEvent.type(input, "x");
    await userEvent.click(document.querySelector('[data-pw="slot-clear"]') as HTMLElement);
    expect(onChange, "clearing must still report no product").toHaveBeenLastCalledWith(null);
  });

  it("closes on a click outside and forgets typed text that was never picked", async () => {
    const { input } = await setup();
    await userEvent.type(input, "sh");
    fireEvent.mouseDown(screen.getByText("outside"));

    expect(document.querySelector('[data-pw="slot-options"]'), "a click outside must close the list").toBeNull();
    expect(input.value, "text that was never picked must be dropped").toBe("");
  });

  it("keeps the picked name after a click outside or a blur", async () => {
    const { input } = await setup();
    await userEvent.click(input);
    await userEvent.click(screen.getByText("Shirt"));
    fireEvent.mouseDown(screen.getByText("outside"));
    expect(input.value, "a click outside must keep the picked name").toBe("Shirt");

    vi.useFakeTimers();
    fireEvent.blur(input);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(input.value, "leaving the box must keep the picked name").toBe("Shirt");
  });

  it("drops unpicked text 200 ms after the box loses focus", async () => {
    const { input } = await setup();
    fireEvent.change(input, { target: { value: "sh" } });
    vi.useFakeTimers();
    fireEvent.blur(input);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(input.value, "unpicked text must be dropped after the box loses focus").toBe("");
  });

  it("shows the option chosen by the page, and searches for it on focus", async () => {
    const { input, onSearch } = await setup({ selectedOption: shirt });
    expect(input.value, "the page's chosen option must show in the box").toBe("Shirt");

    await userEvent.click(input);
    expect(onSearch, "focusing a filled box must search for its option").toHaveBeenCalledWith("Shirt");
  });

  it("says it is loading, or that nothing was found, when the list is empty", async () => {
    const { input, rerender, onSearch, onChange } = await setup({ options: [], isLoading: true });
    await userEvent.click(input);
    expect(document.querySelector('[data-pw="slot-no-options"]'), "an empty list while loading must say so").toHaveTextContent(
      "Loading...",
    );
    expect(document.querySelector(".animate-spin"), "the spinner must show while loading").toBeInTheDocument();

    rerender(
      <div>
        <span>outside</span>
        <AsyncSelectCustom
          placeholder="Search"
          options={[]}
          isLoading={false}
          className="w-full"
          selectedOption={null}
          testId="slot"
          onSearch={onSearch}
          onChange={onChange}
          onClear={undefined}
        />
      </div>,
    );
    expect(
      document.querySelector('[data-pw="slot-no-options"]'),
      "an empty list after loading must say nothing was found",
    ).toHaveTextContent("No options found");
  });

  it("uses the default hook name when the page gives none", async () => {
    await renderWithProviders(
      <AsyncSelectCustom
        placeholder="Search"
        options={[]}
        isLoading={false}
        className=""
        selectedOption={null}
        onSearch={vi.fn()}
        onChange={vi.fn()}
        onClear={undefined}
      />,
    );
    expect(
      document.querySelector('[data-pw="async-select-input"]'),
      "with no testId the box must use the 'async-select' hook name",
    ).toBeInTheDocument();
  });
});
