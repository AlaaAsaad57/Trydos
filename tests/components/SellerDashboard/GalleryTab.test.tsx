// The Gallery section of the seller dashboard — the shop's pool of product
// images.
//
// Two permissions gate it, and each removes a whole half of the section:
// without upload there is no drop zone at all, and without delete there is no
// select toolbar, no checkbox and no bin on a tile.
//
// The part worth guarding hardest is what happens after a delete. Deleting the
// last image on page 3 leaves the seller staring at an empty page 3, so the
// section re-reads the page and steps back one when it comes back empty.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getProductImages = vi.fn();
const uploadProductImages = vi.fn();
const deleteProductImages = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getProductImages: (...a: unknown[]) => getProductImages(...a),
    uploadProductImages: (...a: unknown[]) => uploadProductImages(...a),
    deleteProductImages: (...a: unknown[]) => deleteProductImages(...a),
  },
}));

import GalleryTab from "components/SellerDashboard/GalleryTab";

import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

const SELLER_ID = "77";

/** The page size the section asks for. */
const PER_PAGE = 60;

const image = (id: number, name = `photo-${id}.webp`) => ({
  id,
  url: `https://example.com/gallery/${name}`,
  name,
});

/** What GET /shop/product-images answers with. */
const listAnswer = (
  images: unknown[],
  meta: Record<string, unknown> = { current_page: 1, last_page: 1, total: 1 },
) => ({ success: true, data: { images, meta } });

const picture = (name: string) =>
  new File(["bytes"], name, { type: "image/webp" });

async function mount(props: { canUpload?: boolean; canDelete?: boolean } = {}) {
  return renderWithProviders(
    <GalleryTab
      sellerId={SELLER_ID}
      canUpload={true}
      canDelete={true}
      {...props}
    />,
    { path: `/sellerProfile/sellerDashboard/${SELLER_ID}` },
  );
}

/**
 * The toolbar's "Select" button, which turns select mode on.
 *
 * Every tile also carries a checkbox whose label is "Select", so the name alone
 * is ambiguous. The toolbar sits above the grid, so it is the first one.
 */
const toolbarSelectButton = () =>
  screen.getAllByRole("button", { name: "Select" })[0];

/** The "Select Files" input — the one the drop zone's first button opens. */
const filesInput = () =>
  document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;

beforeEach(() => {
  getProductImages.mockReset();
  uploadProductImages.mockReset();
  deleteProductImages.mockReset();
  getProductImages.mockResolvedValue(listAnswer([image(1)]));
  // The confirm-upload panel previews the chosen files, which needs object URLs.
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: (file: File) => `blob:${(file as File).name}`,
    revokeObjectURL: () => {},
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Gallery section — the grid", () => {
  it("asks the shop backend for the first page at the size it draws", async () => {
    await mount();
    await waitFor(() => expect(getProductImages).toHaveBeenCalled());
    expect(
      getProductImages,
      "the first load should ask for page 1 at the gallery's own page size",
    ).toHaveBeenCalledWith(SELLER_ID, 1, PER_PAGE);
  });

  it("shows each image with its filename", async () => {
    getProductImages.mockResolvedValue(
      listAnswer([image(1, "shoe.webp"), image(2, "bag.webp")]),
    );
    await mount();
    expect(
      await screen.findByAltText("shoe.webp"),
      "the first image should be drawn in the grid",
    ).toBeInTheDocument();
    expect(
      screen.getByAltText("bag.webp"),
      "the second image should be drawn in the grid",
    ).toBeInTheDocument();
  });

  it("says when the shop has no images yet", async () => {
    getProductImages.mockResolvedValue(listAnswer([]));
    await mount();
    expect(
      await screen.findByText("No images found"),
      "an empty gallery should say so rather than show an empty grid",
    ).toBeInTheDocument();
  });

  it("shows the backend's own reason when the page did not load", async () => {
    getProductImages.mockResolvedValue({
      success: false,
      message: "The image service is unavailable.",
    });
    await mount();
    expect(
      await screen.findByText("The image service is unavailable."),
      "the seller should read what the image backend said",
    ).toBeInTheDocument();
  });

  it("lets the seller dismiss the error banner", async () => {
    getProductImages.mockResolvedValue({ success: false, message: "Boom" });
    await mount();
    await screen.findByText("Boom");

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(
      screen.queryByText("Boom"),
      "a dismissed banner should go away",
    ).not.toBeInTheDocument();
  });

  it("asks for the next page when the seller clicks Next", async () => {
    getProductImages.mockResolvedValue(
      listAnswer([image(1)], { current_page: 1, last_page: 3, total: 130 }),
    );
    await mount();
    await screen.findByAltText("photo-1.webp");

    await userEvent.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => {
      expect(
        getProductImages.mock.calls.at(-1),
        "Next should ask the image backend for page 2",
      ).toEqual([SELLER_ID, 2, PER_PAGE]);
    });
  });
});

describe("Gallery section — uploading", () => {
  it("shows the chosen files before anything is sent", async () => {
    await mount();
    await screen.findByAltText("photo-1.webp");

    await userEvent.upload(filesInput(), [
      picture("new-1.webp"),
      picture("new-2.webp"),
    ]);

    expect(
      await screen.findByText("Confirm Upload"),
      "the seller should confirm before the images are sent",
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2\s*files selected/),
      "the panel should say how many files are about to be sent",
    ).toBeInTheDocument();
  });

  it("ignores a chosen file that is not an image", async () => {
    await mount();
    await screen.findByAltText("photo-1.webp");

    await userEvent.upload(
      filesInput(),
      new File(["x"], "notes.pdf", { type: "application/pdf" }),
    );

    expect(
      screen.queryByText("Confirm Upload"),
      "a PDF is not a product image, so there is nothing to confirm",
    ).not.toBeInTheDocument();
  });

  it("sends the chosen files to the shop backend", async () => {
    uploadProductImages.mockResolvedValue({ success: true });
    await mount();
    await screen.findByAltText("photo-1.webp");
    await userEvent.upload(filesInput(), picture("new-1.webp"));
    await screen.findByText("Confirm Upload");

    await userEvent.click(screen.getByRole("button", { name: /^Upload$/ }));

    await waitFor(() => expect(uploadProductImages).toHaveBeenCalledTimes(1));
    const [files, seller] = uploadProductImages.mock.calls[0];
    expect(
      (files as File[]).map((f) => f.name),
      "the files the seller chose should be the files that are sent",
    ).toEqual(["new-1.webp"]);
    expect(seller, "the upload should name the shop it belongs to").toBe(
      SELLER_ID,
    );
  });

  it("goes back to the first page so the new images are on screen", async () => {
    uploadProductImages.mockResolvedValue({ success: true });
    await mount();
    await screen.findByAltText("photo-1.webp");
    await userEvent.upload(filesInput(), picture("new-1.webp"));
    await screen.findByText("Confirm Upload");

    await userEvent.click(screen.getByRole("button", { name: /^Upload$/ }));

    await waitFor(() => {
      expect(
        getProductImages.mock.calls.at(-1),
        "a finished upload should reload page 1, where the new images land",
      ).toEqual([SELLER_ID, 1, PER_PAGE]);
    });
  });

  it("keeps the panel open and says why an upload was refused", async () => {
    uploadProductImages.mockResolvedValue({
      success: false,
      message: "The image is too large.",
    });
    await mount();
    await screen.findByAltText("photo-1.webp");
    await userEvent.upload(filesInput(), picture("new-1.webp"));
    await screen.findByText("Confirm Upload");

    await userEvent.click(screen.getByRole("button", { name: /^Upload$/ }));

    expect(
      await screen.findByText("The image is too large."),
      "the seller should read why the upload was refused",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Confirm Upload"),
      "a refused upload must not close the panel and lose the selection",
    ).toBeInTheDocument();
  });

  it("drops the selection when the seller cancels", async () => {
    await mount();
    await screen.findByAltText("photo-1.webp");
    await userEvent.upload(filesInput(), picture("new-1.webp"));
    await screen.findByText("Confirm Upload");

    // The panel has one Cancel per chosen file (the small x on a preview) and
    // one in the footer. The footer one is last.
    await userEvent.click(
      screen.getAllByRole("button", { name: "Cancel" }).at(-1)!,
    );

    expect(
      screen.queryByText("Confirm Upload"),
      "cancelling should close the panel",
    ).not.toBeInTheDocument();
    expect(
      uploadProductImages,
      "a cancelled selection must never be sent",
    ).not.toHaveBeenCalled();
  });
});

describe("Gallery section — deleting one image", () => {
  it("asks before deleting", async () => {
    await mount();
    await screen.findByAltText("photo-1.webp");

    await userEvent.click(screen.getAllByTitle("Delete")[0]);

    expect(
      await screen.findByText("Delete Image"),
      "deleting an image should be confirmed first — it cannot be undone",
    ).toBeInTheDocument();
    expect(
      deleteProductImages,
      "nothing should be deleted before the seller confirms",
    ).not.toHaveBeenCalled();
  });

  it("deletes the image the seller picked", async () => {
    deleteProductImages.mockResolvedValue({ success: true });
    await mount();
    await screen.findByAltText("photo-1.webp");
    await userEvent.click(screen.getAllByTitle("Delete")[0]);
    await screen.findByText("Delete Image");

    await userEvent.click(
      screen.getAllByRole("button", { name: /^Delete$/ }).at(-1)!,
    );

    await waitFor(() => {
      expect(
        deleteProductImages,
        "the delete should name the image id and the shop",
      ).toHaveBeenCalledWith(1, SELLER_ID);
    });
  });

  it("says why a delete was refused", async () => {
    deleteProductImages.mockResolvedValue({
      success: false,
      message: "This image is used by a live product.",
    });
    await mount();
    await screen.findByAltText("photo-1.webp");
    await userEvent.click(screen.getAllByTitle("Delete")[0]);
    await screen.findByText("Delete Image");

    await userEvent.click(
      screen.getAllByRole("button", { name: /^Delete$/ }).at(-1)!,
    );

    expect(
      await screen.findByText("This image is used by a live product."),
      "the seller should read why the image backend kept the image",
    ).toBeInTheDocument();
  });

  it("steps back a page when the last image on it is deleted", async () => {
    // Page 2 holds one image. Deleting it leaves page 2 empty, so the section
    // must not leave the seller on an empty page.
    getProductImages
      .mockResolvedValueOnce(
        listAnswer([image(1)], { current_page: 1, last_page: 2, total: 61 }),
      )
      .mockResolvedValueOnce(
        listAnswer([image(2)], { current_page: 2, last_page: 2, total: 61 }),
      )
      .mockResolvedValueOnce(
        listAnswer([], { current_page: 2, last_page: 1, total: 60 }),
      )
      .mockResolvedValue(
        listAnswer([image(1)], { current_page: 1, last_page: 1, total: 60 }),
      );
    deleteProductImages.mockResolvedValue({ success: true });

    await mount();
    await screen.findByAltText("photo-1.webp");
    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    await screen.findByAltText("photo-2.webp");

    await userEvent.click(screen.getAllByTitle("Delete")[0]);
    await screen.findByText("Delete Image");
    await userEvent.click(
      screen.getAllByRole("button", { name: /^Delete$/ }).at(-1)!,
    );

    await waitFor(() => {
      expect(
        getProductImages.mock.calls.at(-1),
        "an emptied page 2 should send the seller back to page 1, not leave them on a blank page",
      ).toEqual([SELLER_ID, 1, PER_PAGE]);
    });
  });
});

describe("Gallery section — deleting several at once", () => {
  beforeEach(() => {
    getProductImages.mockResolvedValue(
      listAnswer([image(1, "a.webp"), image(2, "b.webp")], {
        current_page: 1,
        last_page: 1,
        total: 2,
      }),
    );
  });

  it("counts what is selected", async () => {
    await mount();
    await screen.findByAltText("a.webp");

    await userEvent.click(toolbarSelectButton());
    await userEvent.click(screen.getByRole("button", { name: "Select all" }));

    expect(
      await screen.findByText(/2\s*selected/),
      "the toolbar should say how many images are selected",
    ).toBeInTheDocument();
  });

  it("will not delete when nothing is selected", async () => {
    await mount();
    await screen.findByAltText("a.webp");

    await userEvent.click(toolbarSelectButton());

    expect(
      screen.getByRole("button", { name: /^Delete$/ }),
      "there is nothing to delete until an image is selected",
    ).toBeDisabled();
  });

  it("sends every selected id in one request", async () => {
    deleteProductImages.mockResolvedValue({ success: true });
    await mount();
    await screen.findByAltText("a.webp");

    await userEvent.click(toolbarSelectButton());
    await userEvent.click(screen.getByRole("button", { name: "Select all" }));
    await userEvent.click(screen.getByRole("button", { name: /Delete \(2\)/ }));
    await userEvent.click(
      screen.getAllByRole("button", { name: /Delete \(2\)/ }).at(-1)!,
    );

    await waitFor(() => {
      expect(
        deleteProductImages,
        "a bulk delete should hand the image backend every selected id at once",
      ).toHaveBeenCalledWith(["1", "2"], SELLER_ID);
    });
  });

  it("leaves select mode after a finished bulk delete", async () => {
    deleteProductImages.mockResolvedValue({ success: true });
    await mount();
    await screen.findByAltText("a.webp");

    await userEvent.click(toolbarSelectButton());
    await userEvent.click(screen.getByRole("button", { name: "Select all" }));
    await userEvent.click(screen.getByRole("button", { name: /Delete \(2\)/ }));
    await userEvent.click(
      screen.getAllByRole("button", { name: /Delete \(2\)/ }).at(-1)!,
    );

    expect(
      (await screen.findAllByRole("button", { name: "Select" }))[0],
      "a finished bulk delete should put the toolbar back to its normal state",
    ).toBeInTheDocument();
  });
});

describe("Gallery section — the permission gates", () => {
  it("shows no drop zone without the upload permission", async () => {
    await mount({ canUpload: false });
    await screen.findByAltText("photo-1.webp");
    expect(
      screen.queryByText("Drop images here"),
      "a seller who cannot upload must not be offered a drop zone",
    ).not.toBeInTheDocument();
  });

  it("shows no select toolbar or bin without the delete permission", async () => {
    await mount({ canDelete: false });
    await screen.findByAltText("photo-1.webp");
    expect(
      screen.queryAllByRole("button", { name: "Select" }),
      "a seller who cannot delete has nothing to select images for",
    ).toEqual([]);
    expect(
      screen.queryByTitle("Delete"),
      "a seller who cannot delete must not be offered a bin on a tile",
    ).not.toBeInTheDocument();
  });

  it("still lets a seller with neither permission look at the gallery", async () => {
    await mount({ canUpload: false, canDelete: false });
    expect(
      await screen.findByAltText("photo-1.webp"),
      "reading the gallery needs neither upload nor delete",
    ).toBeInTheDocument();
  });
});
