// The "choose from gallery" modal of the product editor.
//
// It pages through the seller's product images on the core backend (60 at a
// time), lets the seller pick one or many, and hands the picks back as
// { url, name } pairs.
import { beforeEach, describe, expect, it, vi } from "vitest";

const getProductImages = vi.hoisted(() => vi.fn());
vi.mock("services/sellerDashboard", () => ({
  default: { getProductImages: (...a: unknown[]) => getProductImages(...a) },
}));

const logError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (orig) => ({
  ...(await orig<typeof import("utils/functions")>()),
  LogError: (e: unknown) => logError(e),
}));

import GalleryPickerModal from "components/SellerDashboard/productEdit/GalleryPickerModal";

import { renderWithProviders, screen, userEvent, waitFor } from "../../../render";

const im = (id: number | undefined, url?: string, path?: string) => ({ id, url, path });

const page = (images: unknown[], last_page = 1, where: "images" | "data" | "flat" = "images") => ({
  success: true,
  data:
    where === "images"
      ? { images, meta: { last_page } }
      : where === "data"
        ? { data: images }
        : images,
  meta: where === "images" ? undefined : { last_page },
});

const onClose = vi.fn();
const onPick = vi.fn();

async function open(multiple = true) {
  await renderWithProviders(
    <GalleryPickerModal sellerId="77" multiple={multiple} onClose={onClose} onPick={onPick} />,
  );
}

const tiles = () => Array.from(document.querySelectorAll("img")).map((i) => i.closest("button")!);

beforeEach(() => {
  getProductImages.mockReset();
  logError.mockReset();
  onClose.mockReset();
  onPick.mockReset();
});

describe("GalleryPickerModal", () => {
  it("picks several images, drops one again, and hands back url + file name", async () => {
    getProductImages.mockResolvedValueOnce(
      page([
        im(1, "https://example.com/p/a.webp?v=1"),
        im(2, undefined, "https://example.com/p/b.webp"),
        im(3),
      ]),
    );
    await open(true);
    expect(await screen.findByText("Select One Or More Images."), "the multi-pick hint is missing").toBeInTheDocument();
    expect(getProductImages, "the first page was not asked for, 60 at a time").toHaveBeenCalledWith("77", 1, 60);
    const [a, b] = tiles();
    expect(tiles().map((t) => t.querySelector("img")!.getAttribute("src")), "an image with no url was offered").toEqual([
      "https://example.com/p/a.webp?v=1",
      "https://example.com/p/b.webp",
    ]);

    await userEvent.click(a);
    await userEvent.click(b);
    await userEvent.click(b);
    await userEvent.click(b);
    await userEvent.click(screen.getByRole("button", { name: /Add Selected \(2\)/ }));
    expect(onPick, "the picks were not handed back as url + name").toHaveBeenCalledWith([
      { url: "https://example.com/p/a.webp?v=1", name: "a.webp" },
      { url: "https://example.com/p/b.webp", name: "b.webp" },
    ]);
    expect(onClose, "the modal did not close after picking").toHaveBeenCalled();
  });

  it("keeps only the last pick in single mode", async () => {
    getProductImages.mockResolvedValueOnce(page([im(1, "https://example.com/a.webp"), im(2, "https://example.com/b.webp")], 1, "data"));
    await open(false);
    expect(await screen.findByText("Select An Image."), "the single-pick hint is missing").toBeInTheDocument();
    const [a, b] = tiles();
    await userEvent.click(a);
    await userEvent.click(b);
    await userEvent.click(screen.getByRole("button", { name: /Add Selected \(1\)/ }));
    expect(onPick, "single mode kept more than the last pick").toHaveBeenCalledWith([
      { url: "https://example.com/b.webp", name: "b.webp" },
    ]);
  });

  it("loads the next page and appends it until the last page", async () => {
    getProductImages
      .mockResolvedValueOnce(page([im(1, "https://example.com/a.webp")], 2))
      .mockResolvedValueOnce(page([im(2, "https://example.com/b.webp")], 2));
    await open();
    await userEvent.click(await screen.findByRole("button", { name: "Load More" }));
    await waitFor(() => expect(tiles(), "the second page was not appended").toHaveLength(2));
    expect(getProductImages, "page 2 was not asked for").toHaveBeenLastCalledWith("77", 2, 60);
    expect(screen.queryByRole("button", { name: "Load More" }), "Load more is still offered on the last page").toBeNull();
  });

  it("says the gallery is empty for a flat empty answer, and for an answer that is not a list", async () => {
    getProductImages.mockResolvedValueOnce(page([], 1, "flat"));
    await open();
    expect(await screen.findByText("No Images In Your Gallery Yet."), "no empty-gallery message").toBeInTheDocument();
  });

  it("treats a data object that is not a list as no images", async () => {
    getProductImages.mockResolvedValueOnce({ success: true, data: { images: { a: 1 } } });
    await open();
    expect(await screen.findByText("No Images In Your Gallery Yet."), "a non-list answer was not treated as empty").toBeInTheDocument();
  });

  it("shows the core backend's refusal with a retry that loads again", async () => {
    getProductImages
      .mockResolvedValueOnce({ success: false, message: "Gallery locked" })
      .mockResolvedValueOnce(page([im(1, "https://example.com/a.webp")]));
    await open();
    expect(await screen.findByText("Gallery locked"), "the backend's refusal is not shown").toBeInTheDocument();
    expect(logError, "the refusal was not logged").toHaveBeenCalledWith({
      scenario: "GalleryPickerModal.load",
      error: "Gallery locked",
    });
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(tiles(), "retry did not load the gallery").toHaveLength(1));
  });

  it("uses the fallback text for a refusal with no message and for a thrown non-Error", async () => {
    getProductImages.mockResolvedValueOnce(null);
    await open();
    expect(await screen.findByText("Failed To Load Gallery"), "no fallback for a refusal with no message").toBeInTheDocument();
  });

  it("uses the fallback text when the call rejects with an empty value", async () => {
    getProductImages.mockRejectedValueOnce("");
    await open();
    expect(await screen.findByText("Failed To Load Gallery"), "no fallback for an empty rejection").toBeInTheDocument();
  });

  it("keeps the images and shows the error under them when a later page fails", async () => {
    getProductImages
      .mockResolvedValueOnce(page([im(1, "https://example.com/a.webp")], 3))
      .mockRejectedValueOnce(new Error("Page 2 broke"));
    await open();
    await userEvent.click(await screen.findByRole("button", { name: "Load More" }));
    expect(await screen.findByText("Page 2 broke"), "the later-page error is not shown").toBeInTheDocument();
    expect(tiles(), "the first page's images were lost").toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Load More" }), "Load more is offered while in error").toBeNull();
  });

  it("closes from the close button, the backdrop and Cancel, without picking", async () => {
    getProductImages.mockResolvedValueOnce(page([]));
    const { container } = await renderWithProviders(
      <GalleryPickerModal sellerId="77" multiple onClose={onClose} onPick={onPick} />,
    );
    await screen.findByText("No Images In Your Gallery Yet.");
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await userEvent.click(container.querySelector(".bg-black\\/45") as HTMLElement);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose, "one of the three close controls did not close").toHaveBeenCalledTimes(3);
    expect(screen.getByRole("button", { name: "Add Selected" }), "Add selected is enabled with nothing picked").toBeDisabled();
    expect(onPick, "closing handed back a pick").not.toHaveBeenCalled();
  });

  it("shows the loading line while the first page is on its way", async () => {
    getProductImages.mockReturnValueOnce(new Promise(() => {}));
    await open();
    expect(screen.getByText("Loading…"), "no loading line on the first page").toBeInTheDocument();
  });
});
