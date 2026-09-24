// The "become a seller" modal (components/settings/BecomeSellerModal.tsx).
//
// becomeSellerLimits.test.ts next to this file only reads the length table out
// of the source text, in a node environment. This file renders the modal: the
// status screens driven by the shopper's vendor request, the inline form
// checks, the document upload, and the submit outcomes (including the phone
// re-verify recovery). The network is replaced: `fetchData` answers per call,
// and the document PUT goes to a stubbed global `fetch`.
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchDataMock = vi.hoisted(() => vi.fn());
vi.mock("utils/fetchData", () => ({
  fetchData: fetchDataMock,
  abortInFlightForLogout: vi.fn(),
}));

const notifications = vi.hoisted(() => ({
  showErrorNotification: vi.fn(),
  showSuccessNotification: vi.fn(),
}));
vi.mock("@/store/notifications/reducer", () => notifications);

const getCountries = vi.hoisted(() => vi.fn());
vi.mock("serverRequests/product", () => ({ GetCountries: getCountries }));

vi.mock("components/Cart/Map", () => ({
  default: ({ setAddressDetails, center }: any) => (
    <div data-testid="map" data-center={`${center.lat},${center.lng}`}>
      <button
        onClick={() =>
          setAddressDetails({ location: { latitude: "33.5", longitude: "36.3" } })
        }
      >
        pick location
      </button>
      <button onClick={() => setAddressDetails(null)}>clear location</button>
    </div>
  ),
}));

import BecomeSellerModal from "components/settings/BecomeSellerModal";
import { renderWithProviders, screen, userEvent, waitFor, fireEvent } from "../../render";

const VALID_PHONE = "+10000000001";

type Reply = any | ((params: any) => any);
let statusReplies: Reply[] = [];
let submitReplies: Reply[] = [];
let presignReplies: Reply[] = [];

function answer(queue: Reply[], params: any) {
  const next = queue.length > 1 ? queue.shift() : queue[0];
  return typeof next === "function" ? next(params) : next;
}

beforeEach(() => {
  statusReplies = [{ success: false, code: 404 }];
  submitReplies = [{ success: true }];
  presignReplies = [
    { success: true, data: { upload_url: "https://example.com/put?sig=1", path: "docs/id.png" } },
  ];
  fetchDataMock.mockReset();
  fetchDataMock.mockImplementation(async (params: any) => {
    if (params.url === "/shop/vendor-requests" && params.method === "GET")
      return answer(statusReplies, params);
    if (params.url === "/shop/vendor-requests" && params.method === "POST")
      return answer(submitReplies, params);
    if (params.url === "/shop/uploads/presigned-url") return answer(presignReplies, params);
    throw new Error(`unexpected call ${params.url}`);
  });
  getCountries.mockReset();
  getCountries.mockResolvedValue([
    { id: 1, iso: "GB" },
    { id: 2, iso: "SY" },
  ]);
  sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true })));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.clearAllMocks();
});

async function openModal(opts: { country?: string; onClose?: any } = {}) {
  const onClose = opts.onClose ?? vi.fn();
  const result = await renderWithProviders(<BecomeSellerModal onClose={onClose} />, {
    country: opts.country ?? "gb",
    store: { setAddressDetails: vi.fn() },
  });
  return { ...result, onClose };
}

async function openForm(opts: { country?: string } = {}) {
  const r = await openModal(opts);
  await screen.findByText("Become A Seller At Trydos");
  return r;
}

const input = (name: string) => document.querySelector(`#${name}`) as HTMLInputElement;

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(input("f_name"), "Sam");
  await user.type(input("l_name"), "Lee");
  await user.type(input("email"), "sam@example.com");
  await user.type(input("phone"), VALID_PHONE);
  await user.type(input("password"), "abcd1234");
  await user.type(input("repeat_password"), "abcd1234");
  await user.type(input("shop_name"), "Shop");
  await user.type(input("shop_address"), "Street");
  await user.type(input("location_name"), "Store");
  await user.type(input("location_address"), "Road 1");
}

async function uploadOneDocument(user: ReturnType<typeof userEvent.setup>, file?: File) {
  await user.selectOptions(document.querySelector("#doc-type")!, "passport");
  fireEvent.change(input("doc-upload"), {
    target: { files: [file ?? new File(["x"], "id.png", { type: "image/png" })] },
  });
  await user.click(screen.getByText("Upload Document"));
}

describe("the status screens", () => {
  it("shows a spinner while the status loads, then the form for a shopper who never applied", async () => {
    let release: (v: any) => void = () => {};
    statusReplies = [() => new Promise((resolve) => (release = resolve))];
    await openModal();
    expect(
      screen.getByRole("dialog").textContent,
      "the loading dialog shows text instead of only a spinner",
    ).toBe("");
    await act(async () => release({ success: false, code: 404 }));
    expect(
      await screen.findByText("Become A Seller At Trydos"),
      "a 404 from the vendor-request lookup did not open the form",
    ).toBeInTheDocument();
  });

  it("shows an error with a retry for any other failure, and retry re-reads the status", async () => {
    statusReplies = [{ success: false, code: 500 }, { success: true, data: { status: "pending" } }];
    const { onClose } = await openModal();
    expect(
      await screen.findByText("Couldn't load your request"),
      "a failed status lookup did not show the error screen",
    ).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByText("Close"));
    await user.click(screen.getByLabelText("Cancel"));
    expect(onClose, "the error screen's close controls did not close the modal").toHaveBeenCalledTimes(2);

    await user.click(screen.getByText("Retry"));
    expect(
      await screen.findByText("Your seller request is under review"),
      "retry did not show the pending status from the second lookup",
    ).toBeInTheDocument();
    await user.click(screen.getByText("Close"));
    expect(onClose, "the pending screen's close button did not close the modal").toHaveBeenCalledTimes(3);
  });

  it("treats an answer with no body as an error", async () => {
    statusReplies = [undefined];
    await openModal();
    expect(
      await screen.findByText("Couldn't load your request"),
      "an empty status answer did not show the error screen",
    ).toBeInTheDocument();
  });

  it.each([
    [{ status: "REJECTED", rejection_reason: "Missing licence" }, "Missing licence"],
    [{ status: "rejected", reason: "Bad photo" }, "Bad photo"],
    [{ status: "REJECTED" }, "Unfortunately, your seller request was not approved."],
  ])("a rejected request shows the reason the backend gave (%o)", async (data, text) => {
    statusReplies = [{ success: true, data }];
    await openModal();
    expect(
      await screen.findByText("Your seller request was rejected"),
      "a rejected request did not show the rejected screen",
    ).toBeInTheDocument();
    expect(screen.getByText(text), "the rejection text is not the one expected").toBeInTheDocument();
  });

  it("an approved request shows the approved screen", async () => {
    statusReplies = [{ success: true, data: { status: "APPROVED" } }];
    await openModal();
    expect(
      await screen.findByText("Your seller request was approved"),
      "an approved request did not show the approved screen",
    ).toBeInTheDocument();
  });

  it("a successful answer with no known status opens the form", async () => {
    statusReplies = [{ success: true, data: null }];
    await openModal();
    expect(
      await screen.findByText("Become A Seller At Trydos"),
      "a request with no status did not open the form",
    ).toBeInTheDocument();
  });
});

describe("the country list", () => {
  it("loads the countries once and keeps them in the session", async () => {
    await openForm();
    await waitFor(() =>
      expect(
        (document.querySelector("#country_iso") as HTMLSelectElement).options.length,
        "the loaded countries are not offered in the country picker",
      ).toBe(2),
    );
    expect(
      JSON.parse(sessionStorage.getItem("countries-gb-en")!)[1].iso,
      "the country list was not kept in the session",
    ).toBe("SY");

    const user = userEvent.setup();
    await user.selectOptions(document.querySelector("#country_iso")!, "sy");
    expect(
      (document.querySelector("#country_iso") as HTMLSelectElement).value,
      "choosing a country did not change the picker",
    ).toBe("sy");
  });

  it("reads the cached list without asking again", async () => {
    sessionStorage.setItem("countries-gb-en", JSON.stringify([{ iso: "gb" }, { iso: "iq" }]));
    await openForm();
    await waitFor(() =>
      expect(
        (document.querySelector("#country_iso") as HTMLSelectElement).options.length,
        "the cached countries are not offered",
      ).toBe(2),
    );
    expect(getCountries, "the countries were fetched although they were cached").not.toHaveBeenCalled();
  });

  it("keeps the address country as the only option when the list is empty or fails", async () => {
    getCountries.mockResolvedValueOnce([]);
    await openForm();
    await waitFor(() => expect(getCountries).toHaveBeenCalled());
    const select = document.querySelector("#country_iso") as HTMLSelectElement;
    expect(select.options.length, "an empty country list replaced the address country").toBe(1);
    expect(select.value, "the address country is not the selected one").toBe("gb");
  });

  it("survives a country request that throws", async () => {
    getCountries.mockRejectedValueOnce(new Error("down"));
    await openForm();
    await waitFor(() => expect(getCountries).toHaveBeenCalled());
    expect(
      (document.querySelector("#country_iso") as HTMLSelectElement).value,
      "a failed country request removed the address country",
    ).toBe("gb");
  });

  it("does not ask for countries when the address has no country", async () => {
    await openForm({ country: "" });
    expect(getCountries, "countries were requested with no country in the address").not.toHaveBeenCalled();
  });
});

describe("inline checks on blur", () => {
  it.each([
    ["email", "", "Email is required"],
    ["email", "bad@", "Enter a valid email address"],
    ["phone", "", "Phone number is required"],
    ["phone", "123", "Invalid Phone Number"],
    ["password", "", "Password is required"],
    ["password", "short", "Min 8 characters, including a letter and a number"],
    ["repeat_password", "", "Please repeat your password"],
    ["repeat_password", "other123", "Passwords do not match"],
    ["f_name", "", "First Name is required"],
    ["f_name", "Abcdefghijk", "Must not exceed 10 characters"],
    ["shop_address", "", "Shop Address is required"],
  ])("%s = %j shows %j", async (name, value, message) => {
    await openForm();
    const user = userEvent.setup();
    if (value) await user.type(input(name), value);
    fireEvent.blur(input(name));
    expect(await screen.findByText(message), `the ${name} check did not say "${message}"`).toBeInTheDocument();
    expect(input(name).getAttribute("aria-invalid"), `the ${name} field is not marked invalid`).toBe("true");

    await user.type(input(name), "x");
    expect(screen.queryByText(message), `editing ${name} did not clear its error`).not.toBeInTheDocument();
  });

  it("valid values raise no error", async () => {
    await openForm();
    const user = userEvent.setup();
    await fillValidForm(user);
    for (const name of ["email", "phone", "password", "repeat_password", "f_name", "shop_address"]) {
      fireEvent.blur(input(name));
    }
    expect(
      document.querySelectorAll('[aria-invalid="true"]').length,
      "a valid value was marked invalid",
    ).toBe(0);
  });
});

describe("the map", () => {
  it("centres on Dubai by default and on the picked location after a pick", async () => {
    const { store } = await openForm();
    expect(screen.getByTestId("map").dataset.center, "the default map centre changed").toBe("25.2048,55.2708");
    const user = userEvent.setup();
    await user.click(screen.getByText("clear location"));
    expect(screen.getByTestId("map").dataset.center, "an empty pick moved the map").toBe("25.2048,55.2708");
    await user.click(screen.getByText("pick location"));
    expect(screen.getByTestId("map").dataset.center, "the picked location did not centre the map").toBe("33.5,36.3");
    expect(
      (store.getState() as any).setAddressDetails,
      "the pick was not passed to the shared address state",
    ).toHaveBeenCalledWith({ location: { latitude: "33.5", longitude: "36.3" } });
  });
});

describe("documents", () => {
  it("the file button opens the hidden file input", async () => {
    await openForm();
    const click = vi.spyOn(input("doc-upload"), "click");
    await userEvent.setup().click(screen.getByText("Choose File"));
    expect(click, "the file button did not open the file picker").toHaveBeenCalled();
  });

  it("refuses a file that is not an image or PDF, and accepts a PDF with no type by its name", async () => {
    await openForm();
    fireEvent.change(input("doc-upload"), {
      target: { files: [new File(["x"], "notes.txt", { type: "text/plain" })] },
    });
    expect(
      screen.getByText("Only image or PDF files are allowed"),
      "a text file was not refused",
    ).toBeInTheDocument();

    fireEvent.change(input("doc-upload"), { target: { files: [new File(["x"], "scan.pdf", { type: "" })] } });
    expect(screen.getByText("scan.pdf"), "a PDF with no type was not accepted by name").toBeInTheDocument();
    expect(
      screen.queryByText("Only image or PDF files are allowed"),
      "accepting a good file did not clear the file error",
    ).not.toBeInTheDocument();

    fireEvent.change(input("doc-upload"), { target: { files: [] } });
    expect(screen.getByText("Choose File"), "clearing the picker kept the old file").toBeInTheDocument();
  });

  it("asks for a document type before uploading", async () => {
    await openForm();
    fireEvent.change(input("doc-upload"), {
      target: { files: [new File(["x"], "id.png", { type: "image/png" })] },
    });
    const user = userEvent.setup();
    await user.click(screen.getByText("Upload Document"));
    expect(screen.getByText("Please select a document type"), "an upload with no type was not stopped").toBeInTheDocument();
    await user.selectOptions(document.querySelector("#doc-type")!, "passport");
    expect(
      screen.queryByText("Please select a document type"),
      "choosing a type did not clear the type error",
    ).not.toBeInTheDocument();
    await user.selectOptions(document.querySelector("#doc-type")!, "");
  });

  it("uploads a document, lists it by its label, and can remove it", async () => {
    await openForm();
    const user = userEvent.setup();
    await uploadOneDocument(user);

    expect(await screen.findByText("docs/id.png"), "the uploaded document path is not listed").toBeInTheDocument();
    expect(screen.getByText("Passport", { selector: "div" }), "the uploaded document is not labelled by its type").toBeInTheDocument();
    expect(
      JSON.parse(fetchDataMock.mock.calls.find((c) => c[0].url.includes("presigned"))![0].body),
      "the presign request did not name the file type",
    ).toEqual({ mime_type: "image/png" });
    expect(
      (globalThis.fetch as any).mock.calls[0][0],
      "the file was not sent to the presigned address",
    ).toBe("https://example.com/put?sig=1");

    await user.click(screen.getByText("Remove"));
    expect(screen.getByText("No documents uploaded"), "removing the document left it listed").toBeInTheDocument();
  });

  it.each([
    [{ success: true, upload_url: "https://example.com/a?x=1", path: "p1" }, "p1"],
    [{ success: true, data: { url: "https://example.com/b?x=1", file_path: "p2" } }, "p2"],
    [{ success: true, data: { url: "https://example.com/c", key: "p3" } }, "p3"],
    [{ success: true, data: { url: "https://example.com/d" }, file_path: "p4" }, "p4"],
    [{ success: true, data: { url: "https://example.com/e" }, key: "p5" }, "p5"],
    [{ success: true, data: { url: "https://example.com/f?sig=2" } }, "https://example.com/f"],
  ])("reads the stored path from every answer shape (%o)", async (reply, path) => {
    presignReplies = [reply];
    await openForm();
    await uploadOneDocument(userEvent.setup(), new File(["x"], "scan.pdf", { type: "" }));
    expect(await screen.findByText(path), `the stored path ${path} was not read from the answer`).toBeInTheDocument();
    expect(
      (globalThis.fetch as any).mock.calls[0][1].headers["Content-Type"],
      "a file with no type was not sent as a generic binary",
    ).toBe("application/octet-stream");
  });

  it.each([
    [{ success: false, message: "Too big" }, "Too big"],
    [null, "Something went wrong"],
    [{ success: true, data: {} }, "Upload URL not found"],
  ])("reports a failed presign (%o)", async (reply, message) => {
    presignReplies = [reply];
    await openForm();
    await uploadOneDocument(userEvent.setup());
    await waitFor(() =>
      expect(notifications.showErrorNotification, `the failed presign did not say "${message}"`).toHaveBeenCalledWith(message),
    );
    expect(screen.getByText("No documents uploaded"), "a failed upload still listed a document").toBeInTheDocument();
  });

  it("reports a refused file PUT and a PUT that throws", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    await openForm();
    const user = userEvent.setup();
    await uploadOneDocument(user);
    await waitFor(() =>
      expect(notifications.showErrorNotification, "a refused file upload was not reported").toHaveBeenCalledWith(
        "Failed to upload document",
      ),
    );

    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    await user.click(screen.getByText("Upload Document"));
    await waitFor(() =>
      expect(notifications.showErrorNotification, "a file upload that threw was not reported").toHaveBeenCalledWith(
        "Something went wrong",
      ),
    );
  });
});

describe("submitting", () => {
  it("shows every inline error at once when the form is incomplete", async () => {
    await openForm();
    const user = userEvent.setup();
    await uploadOneDocument(user);
    await screen.findByText("docs/id.png");
    await user.click(screen.getByText("Submit"));
    expect(screen.getByText("First Name is required"), "an empty first name was not flagged on submit").toBeInTheDocument();
    expect(screen.getByText("Location Address is required"), "an empty location address was not flagged on submit").toBeInTheDocument();
    expect(fetchDataMock.mock.calls.some((c) => c[0].method === "POST" && c[0].url === "/shop/vendor-requests"), "an incomplete form was sent").toBe(false);
  });

  async function submitValid() {
    const r = await openForm();
    const user = userEvent.setup();
    await fillValidForm(user);
    await user.click(screen.getByText("pick location"));
    await uploadOneDocument(user);
    await screen.findByText("docs/id.png");
    await user.click(screen.getByText("Submit"));
    return { ...r, user };
  }

  it("sends the form with numeric coordinates and shows the pending status afterwards", async () => {
    statusReplies = [{ success: false, code: 404 }, { success: true, data: { status: "PENDING" } }];
    await submitValid();

    expect(
      await screen.findByText("Your seller request is under review"),
      "a successful submit did not re-read and show the pending status",
    ).toBeInTheDocument();
    expect(notifications.showSuccessNotification, "a successful submit did not confirm it").toHaveBeenCalledWith(
      "Request submitted successfully",
    );
    const body = JSON.parse(fetchDataMock.mock.calls.find((c) => c[0].method === "POST" && c[0].url === "/shop/vendor-requests")![0].body);
    expect(body.latitude, "the latitude was not sent as a number").toBe(33.5);
    expect(body.documents, "the uploaded document was not sent").toEqual([{ type: "passport", path: "docs/id.png" }]);
  });

  it("re-reads the status when the backend says the request already exists", async () => {
    submitReplies = [{ success: false, detailed_error: [{ code: "user_id", message: "User already exists" }] }];
    statusReplies = [{ success: false, code: 404 }, { success: true, data: { status: "REJECTED" } }];
    await submitValid();
    expect(
      await screen.findByText("Your seller request was rejected"),
      "an already-existing request did not show its real status",
    ).toBeInTheDocument();
  });

  it("opens phone verification on an unverified phone and resends once verified", async () => {
    submitReplies = [
      { success: false, message: "This user phone is not verified", detailed_error: [{ code: "user_id" }] },
      { success: true },
    ];
    statusReplies = [{ success: false, code: 404 }, { success: true, data: { status: "PENDING" } }];
    const { store } = await submitValid();

    await waitFor(() =>
      expect((store.getState() as any).shouldAuthinticated, "the phone verify widget was not opened").toBe(true),
    );
    expect(notifications.showErrorNotification, "the shopper was not told to verify the phone").toHaveBeenCalledWith(
      "Please verify your phone number to continue",
    );
    act(() => store.setState({ reAuthResult: "success" } as any));
    expect(
      await screen.findByText("Your seller request is under review", {}, { timeout: 3000 }),
      "the request was not resent after the phone was verified",
    ).toBeInTheDocument();
  });

  it("stops when the verify widget is closed, and does not reopen it on a second unverified answer", async () => {
    submitReplies = [{ success: false, detailed_error: [{ code: "user_id", message: "phone not verified" }] }];
    const { store, user } = await submitValid();
    await waitFor(() => expect((store.getState() as any).shouldAuthinticated).toBe(true));
    act(() => store.setState({ reAuthResult: "cancelled" } as any));
    await waitFor(
      () => expect(screen.getByText("Submit"), "the submit button did not come back after a cancelled verify").toBeInTheDocument(),
      { timeout: 3000 },
    );
    const posts = () => fetchDataMock.mock.calls.filter((c) => c[0].method === "POST" && c[0].url === "/shop/vendor-requests").length;
    expect(posts(), "the request was resent although verification was cancelled").toBe(1);

    // Verified, but the backend still says unverified: the error is shown, not the widget again.
    act(() => store.setState({ reAuthResult: null, shouldAuthinticated: false } as any));
    await user.click(screen.getByText("Submit"));
    await waitFor(() => expect((store.getState() as any).shouldAuthinticated).toBe(true));
    act(() => store.setState({ reAuthResult: "success" } as any));
    await waitFor(
      () =>
        expect(notifications.showErrorNotification, "the second unverified answer was not shown as an error").toHaveBeenCalledWith(
          "phone not verified",
        ),
      { timeout: 3000 },
    );
  });

  it("gives up on verification after five minutes", async () => {
    submitReplies = [{ success: false, detailed_error: [{ code: "user_id", message: "not verified" }] }];
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { store } = await submitValid();
    await waitFor(() => expect((store.getState() as any).shouldAuthinticated).toBe(true));
    await act(async () => {
      vi.advanceTimersByTime(300000);
    });
    await waitFor(() =>
      expect(screen.getByText("Submit"), "the modal did not give up waiting after five minutes").toBeInTheDocument(),
    );
    expect(
      fetchDataMock.mock.calls.filter((c) => c[0].method === "POST" && c[0].url === "/shop/vendor-requests").length,
      "the request was resent after the wait timed out",
    ).toBe(1);
  });

  it.each([
    [{ success: false, detailed_error: [{ message: "Shop name taken" }, "Raw error"] }, ["Shop name taken", "Raw error"]],
    [{ success: false, message: "Refused" }, ["Refused"]],
    [{ success: false }, ["Something went wrong"]],
    [{ success: false, detailed_error: [{ code: "user_id" }], message: "Other" }, [{ code: "user_id" }]],
  ])("shows what the backend said on a refusal (%o)", async (reply, messages: any[]) => {
    submitReplies = [reply];
    await submitValid();
    for (const m of messages) {
      await waitFor(() =>
        expect(notifications.showErrorNotification, `the refusal "${m}" was not shown`).toHaveBeenCalledWith(m),
      );
    }
  });

  it.each([
    [{ detailed_error: [{ message: "Thrown detail" }, "Thrown raw"] }, ["Thrown detail", "Thrown raw"]],
    [{ response: { data: { message: "Response message" } } }, ["Response message"]],
    [new Error("Thrown message"), ["Thrown message"]],
    [null, ["Something went wrong"]],
  ])("shows what a thrown submit said (%o)", async (thrown, messages) => {
    submitReplies = [() => Promise.reject(thrown)];
    await submitValid();
    for (const m of messages) {
      await waitFor(() =>
        expect(notifications.showErrorNotification, `the thrown error "${m}" was not shown`).toHaveBeenCalledWith(m),
      );
    }
  });

  it("the footer cancel closes the modal", async () => {
    const { onClose } = await openForm();
    const user = userEvent.setup();
    await user.click(screen.getAllByText("Cancel")[0]);
    await user.click(screen.getByLabelText("Cancel"));
    expect(onClose, "the cancel controls on the form did not close the modal").toHaveBeenCalledTimes(2);
  });
});
