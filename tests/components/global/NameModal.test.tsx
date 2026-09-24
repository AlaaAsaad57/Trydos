// The "Enter Your Name" modal a new chat user sees.
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ updateName: vi.fn() }));
vi.mock("services/auth", () => ({ default: { UpdateName: auth.updateName } }));

import NameModal from "components/global/NameModal";

import { renderWithProviders, screen, userEvent } from "../../render";

beforeEach(() => {
  auth.updateName.mockClear();
});

describe("the name modal", () => {
  it("sends the typed name and closes when the arrow is pressed", async () => {
    const { store } = await renderWithProviders(<NameModal />, { store: { nameModal: true } });
    const input = document.querySelector('[data-pw="Input-Name"]') as HTMLInputElement;

    await userEvent.type(input, "A");
    expect(
      document.querySelector('[data-pw="Input-Name-Submit"]'),
      "the send arrow must stay hidden for a one-letter name",
    ).not.toBeInTheDocument();

    await userEvent.type(input, "li");
    await userEvent.click(document.querySelector('[data-pw="Input-Name-Submit"]') as HTMLElement);

    expect(auth.updateName, "the typed name was not sent to the auth service").toHaveBeenCalledWith("Ali");
    expect(store.getState().nameModal, "the modal must close after the name is sent").toBe(false);
    expect(screen.getByText("Enter Your Name"), "the modal title is missing").toBeInTheDocument();
  });

  it("closes when the dark backdrop is clicked", async () => {
    const { store, container } = await renderWithProviders(<NameModal />, { store: { nameModal: true } });
    const backdrop = container.querySelector(".open") as HTMLElement;
    expect(backdrop, "an open modal must mark its backdrop 'open'").toBeInTheDocument();

    await userEvent.click(backdrop);
    expect(store.getState().nameModal, "a click on the backdrop must close the modal").toBe(false);
    expect(auth.updateName, "closing must not send a name").not.toHaveBeenCalled();
  });
});
