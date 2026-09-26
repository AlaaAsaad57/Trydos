// The Shop Info section of the seller dashboard — name, contact, address,
// logo and banner.
//
// Two backends take part in a save, and each step can fail on its own:
//   - the media server takes a new logo or banner (uploadShopImage)
//   - the shop backend takes the form (updateShopInfo)
// The logo and banner go through the crop widget first. The widget needs a
// canvas jsdom does not have, so a stand-in offers its two ways out: save the
// picture as it is, or close without saving.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getShopInfo = vi.fn();
const updateShopInfo = vi.fn();
const uploadShopImage = vi.fn();
const showSuccessMessage = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getShopInfo: (...a: unknown[]) => getShopInfo(...a),
    updateShopInfo: (...a: unknown[]) => updateShopInfo(...a),
    uploadShopImage: (...a: unknown[]) => uploadShopImage(...a),
  },
}));

vi.mock("components/global/AddToCartMessage", () => ({
  showSuccessMessage: (...a: unknown[]) => showSuccessMessage(...a),
  showErrorMessage: vi.fn(),
}));

vi.mock("components/global/ImageCropWidget", () => ({
  ImageCropWidget: ({
    image,
    onSave,
    onClose,
  }: {
    image: File;
    onSave: (f: File) => void;
    onClose: () => void;
  }) => (
    <div data-testid="crop">
      <button type="button" onClick={() => onSave(image)}>
        crop-save
      </button>
      <button type="button" onClick={onClose}>
        crop-close
      </button>
    </div>
  ),
}));

import ShopInfo from "components/SellerDashboard/ShopInfo";

import { fireEvent, renderWithProviders, screen, userEvent, waitFor } from "../../render";

const SELLER_ID = "77";

const SHOP = {
  name: "Rama Shoes",
  contact: "963911000000",
  address: "Mazzeh, Damascus",
  image: "https://example.com/seller/logo.webp",
  banner: "https://example.com/seller/banner.webp",
};

async function mount(props: { canUpdate?: boolean; sellerId?: string } = {}) {
  return renderWithProviders(
    <ShopInfo sellerId={props.sellerId ?? SELLER_ID} language="en" canUpdate={props.canUpdate ?? true} />,
    { path: `/sellerProfile/sellerDashboard/${SELLER_ID}` },
  );
}

const field = (pw: string) =>
  document.querySelector(`[data-pw="${pw}"]`) as HTMLInputElement;
const nameInput = () => field("shop-info-name-input");
const contactInput = () => field("shop-info-contact-input");
const addressInput = () => field("shop-info-address-input");
const fileInputs = () =>
  Array.from(document.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
const picture = (name: string) => new File(["img"], name, { type: "image/png" });

const alertSpy = vi.fn();

beforeEach(() => {
  getShopInfo.mockReset();
  updateShopInfo.mockReset();
  uploadShopImage.mockReset();
  showSuccessMessage.mockReset();
  alertSpy.mockReset();
  vi.stubGlobal("alert", alertSpy);
  getShopInfo.mockResolvedValue({ success: true, data: SHOP });
  updateShopInfo.mockResolvedValue({ success: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Shop info — loading", () => {
  it("fills the form, the logo and the banner from the shop backend", async () => {
    await mount();
    await waitFor(() => expect(nameInput()?.value, "the shop name should be filled").toBe("Rama Shoes"));
    expect(getShopInfo, "the shop info should be asked for this shop").toHaveBeenCalledWith(SELLER_ID);
    expect(contactInput().value, "the contact should be filled").toBe("963911000000");
    expect(addressInput().value, "the address should be filled").toBe("Mazzeh, Damascus");
    expect(screen.getByAltText("Shop logo preview").getAttribute("src"), "the stored logo should be shown").toBe(SHOP.image);
    expect(screen.getByAltText("Banner preview").getAttribute("src"), "the stored banner should be shown").toBe(SHOP.banner);
    expect(screen.getByText("logo.webp"), "the logo's file name should be shown").toBeInTheDocument();
    expect(screen.getByText("banner.webp"), "the banner's file name should be shown").toBeInTheDocument();
  });

  it("leaves an empty form when the shop backend refuses", async () => {
    getShopInfo.mockResolvedValue({ success: false });
    await mount();
    await waitFor(() => expect(nameInput(), "the form should be drawn after the load").toBeTruthy());
    expect(nameInput().value, "a refused load should leave the name empty").toBe("");
    expect(screen.getByText("No Banner Yet"), "no banner should be shown").toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Upload$/ }), "with no logo the button should say Upload").toBeInTheDocument();
  });

  it("reads a flat answer and empty fields", async () => {
    getShopInfo.mockResolvedValue({ success: true, data: null, name: null });
    await mount();
    await waitFor(() => expect(nameInput()).toBeTruthy());
    expect(nameInput().value, "a missing name should become an empty field").toBe("");
  });

  it("does not ask anything without a shop id", async () => {
    await mount({ sellerId: "" });
    expect(getShopInfo, "there is no shop to ask about").not.toHaveBeenCalled();
    expect(nameInput(), "the form should stay on its loading skeleton").toBeNull();
  });
});

describe("Shop info — read only", () => {
  it("locks the form, offers no Save and sends nothing", async () => {
    await mount({ canUpdate: false });
    await waitFor(() => expect(nameInput()?.value).toBe("Rama Shoes"));
    expect(screen.getByText("Read Only"), "a seller without UPDATE_SHOP_INFO should be told the form is read only").toBeInTheDocument();
    expect(nameInput().disabled, "the name must be locked").toBe(true);
    expect(screen.queryByRole("button", { name: /Save Changes/ }), "there must be no Save").not.toBeInTheDocument();
    fireEvent.submit(field("shop-info-form"));
    expect(updateShopInfo, "a read-only form must never send an update").not.toHaveBeenCalled();
  });
});

describe("Shop info — checking the fields", () => {
  it("asks for every field when they are empty, and clears an error on typing", async () => {
    getShopInfo.mockResolvedValue({ success: true, data: {} });
    await mount();
    await waitFor(() => expect(nameInput()).toBeTruthy());
    await userEvent.click(screen.getByRole("button", { name: /Save Changes/ }));

    expect(screen.getByText("Shop Name Is Required"), "an empty name must be refused").toBeInTheDocument();
    expect(screen.getByText("Contact Is Required"), "an empty contact must be refused").toBeInTheDocument();
    expect(screen.getByText("Address Is Required"), "an empty address must be refused").toBeInTheDocument();
    expect(updateShopInfo, "an invalid form must not reach the shop backend").not.toHaveBeenCalled();

    await userEvent.type(nameInput(), "A");
    expect(screen.queryByText("Shop Name Is Required"), "typing a name should clear its error").not.toBeInTheDocument();
    await userEvent.type(addressInput(), "B");
    expect(screen.getByText("Contact Is Required"), "the contact error should stay until the contact is edited").toBeInTheDocument();
  });

  it("refuses a contact that is not a number", async () => {
    await mount();
    await waitFor(() => expect(nameInput()?.value).toBe("Rama Shoes"));
    await userEvent.clear(contactInput());
    await userEvent.type(contactInput(), "call me");
    await userEvent.click(screen.getByRole("button", { name: /Save Changes/ }));
    expect(
      screen.getByText("Contact Must Contain Valid Numbers"),
      "a contact with letters must be refused",
    ).toBeInTheDocument();
  });
});

describe("Shop info — saving", () => {
  it("sends the trimmed form and the stored media's file names when nothing new was picked", async () => {
    await mount();
    await waitFor(() => expect(nameInput()?.value).toBe("Rama Shoes"));
    await userEvent.type(nameInput(), "  ");
    await userEvent.click(screen.getByRole("button", { name: /Save Changes/ }));

    await waitFor(() =>
      expect(showSuccessMessage, "a saved form should be confirmed").toHaveBeenCalledWith("Shop Info Updated Successfully!"),
    );
    expect(uploadShopImage, "no new media was picked, so nothing goes to the media server").not.toHaveBeenCalled();
    expect(updateShopInfo.mock.calls[0], "the shop backend should get the trimmed form and the stored file names").toEqual([
      SELLER_ID,
      { name: "Rama Shoes", address: "Mazzeh, Damascus", contact: "963911000000", image: "logo.webp", banner: "banner.webp" },
    ]);
  });

  it("sends no media when the shop has none", async () => {
    getShopInfo.mockResolvedValue({ success: true, data: { ...SHOP, image: null, banner: null } });
    await mount();
    await waitFor(() => expect(nameInput()?.value).toBe("Rama Shoes"));
    await userEvent.click(screen.getByRole("button", { name: /Save Changes/ }));
    await waitFor(() => expect(updateShopInfo).toHaveBeenCalled());
    expect(updateShopInfo.mock.calls[0][1], "a shop with no media should send null for both").toMatchObject({ image: null, banner: null });
  });

  it("uploads a new logo and banner to the media server first, then saves their names", async () => {
    uploadShopImage
      .mockResolvedValueOnce("https://media.example.com/image/upload/seller/new-logo.webp")
      .mockResolvedValueOnce("seller/new-banner.webp");
    await mount();
    await waitFor(() => expect(nameInput()?.value).toBe("Rama Shoes"));
    const [logoInput, bannerInput] = fileInputs();

    const logoClick = vi.spyOn(logoInput, "click");
    const bannerClick = vi.spyOn(bannerInput, "click");
    await userEvent.click(screen.getByRole("button", { name: /^Change$/ }));
    await userEvent.click(screen.getByRole("button", { name: /Change Banner/ }));
    expect(logoClick, "the logo button should open the logo picker").toHaveBeenCalled();
    expect(bannerClick, "the banner button should open the banner picker").toHaveBeenCalled();

    fireEvent.change(logoInput, { target: { files: [picture("new-logo.png")] } });
    await userEvent.click(await screen.findByRole("button", { name: "crop-save" }));
    await waitFor(() =>
      expect(
        screen.getByAltText("Shop logo preview").getAttribute("src"),
        "the cropped logo should be previewed",
      ).toMatch(/^data:/),
    );
    expect(screen.getByText("new-logo.png"), "the new logo's name should be shown").toBeInTheDocument();

    fireEvent.change(bannerInput, { target: { files: [picture("new-banner.png")] } });
    await userEvent.click(await screen.findByRole("button", { name: "crop-save" }));
    await waitFor(() =>
      expect(screen.getByAltText("Banner preview").getAttribute("src"), "the cropped banner should be previewed").toMatch(/^data:/),
    );

    await userEvent.click(screen.getByRole("button", { name: /Save Changes/ }));
    await waitFor(() => expect(showSuccessMessage, "the save should be confirmed").toHaveBeenCalled());
    expect(
      uploadShopImage.mock.calls.map((c) => [(c[0] as File).name, c[1]]),
      "the logo and the banner should both go to the media server, in the seller folder",
    ).toEqual([
      ["new-logo.png", "seller"],
      ["new-banner.png", "seller"],
    ]);
    expect(updateShopInfo.mock.calls[0][1], "the shop backend should get the new file names").toMatchObject({
      image: "new-logo.webp",
      banner: "new-banner.webp",
    });
    expect(
      screen.getByAltText("Banner preview").getAttribute("src"),
      "after the save the banner should come from its stored address",
    ).toBe("https://example.com/seller/new-banner.webp");
  });

  it("sends no logo when the media server answers with nothing", async () => {
    uploadShopImage.mockResolvedValue("");
    await mount();
    await waitFor(() => expect(nameInput()?.value).toBe("Rama Shoes"));
    fireEvent.change(fileInputs()[0], { target: { files: [picture("x.png")] } });
    await userEvent.click(await screen.findByRole("button", { name: "crop-save" }));
    await userEvent.click(screen.getByRole("button", { name: /Save Changes/ }));
    await waitFor(() => expect(updateShopInfo).toHaveBeenCalled());
    expect(updateShopInfo.mock.calls[0][1].image, "an empty upload answer should send no logo").toBeNull();
  });

  it("closes the crop widget without keeping the picture, and ignores a pick with no file", async () => {
    await mount();
    await waitFor(() => expect(nameInput()?.value).toBe("Rama Shoes"));
    fireEvent.change(fileInputs()[0], { target: { files: [] } });
    expect(screen.queryByTestId("crop"), "no file picked, so no crop widget").not.toBeInTheDocument();

    fireEvent.change(fileInputs()[0], { target: { files: [picture("x.png")] } });
    await userEvent.click(await screen.findByRole("button", { name: "crop-close" }));
    expect(screen.queryByTestId("crop"), "closing should take the widget away").not.toBeInTheDocument();
    expect(screen.getByAltText("Shop logo preview").getAttribute("src"), "the stored logo should stay").toBe(SHOP.image);
  });

  it("tells the seller when the shop backend refuses the save", async () => {
    updateShopInfo.mockResolvedValue({ success: false, message: "Name is taken." });
    await mount();
    await waitFor(() => expect(nameInput()?.value).toBe("Rama Shoes"));
    await userEvent.click(screen.getByRole("button", { name: /Save Changes/ }));
    await waitFor(() => expect(alertSpy, "a refused save should be reported").toHaveBeenCalledWith("Failed to update"));
    expect(showSuccessMessage, "a refused save must not be confirmed").not.toHaveBeenCalled();
  });

  it("tells the seller when the save is refused without a message or throws", async () => {
    updateShopInfo.mockResolvedValueOnce({ success: false }).mockRejectedValueOnce("offline");
    await mount();
    await waitFor(() => expect(nameInput()?.value).toBe("Rama Shoes"));
    await userEvent.click(screen.getByRole("button", { name: /Save Changes/ }));
    await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByRole("button", { name: /Save Changes/ }));
    await waitFor(() =>
      expect(alertSpy, "a thrown save should be reported the same way").toHaveBeenCalledTimes(2),
    );
  });
});
