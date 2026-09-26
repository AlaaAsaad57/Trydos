import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

const fetchData = vi.fn();
vi.mock("utils/fetchData", () => ({ fetchData: (...a: any[]) => fetchData(...a) }));
const EditNotificationSettings = vi.fn();
vi.mock("services/home", () => ({
  default: { EditNotificationSettings: (...a: any[]) => EditNotificationSettings(...a) },
}));
vi.mock("components/global/NotificationsTest", () => ({ default: () => <div data-testid="notifications-test" /> }));
const LogError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => LogError(...a),
}));

import SettingsModal from "components/Home/SettingsModal";

const settings = (extra: any = {}) => ({
  success: true,
  data: {
    firebase_settings: {
      email: 1,
      firebase: 0,
      whatsapp: 0,
      notification_frequency: "weekly",
      subscribed_topics: [{ topic: "new_offers_sy_en" }],
      unsubscribed_topics: [{ topic: "price_drop" }],
      ...extra,
    },
  },
});

const toggle = (name: string) => document.querySelector(`[data-pw="checkbox-${name}"]`) as HTMLButtonElement;
const select = () => screen.getByRole("combobox") as HTMLSelectElement;

describe("SettingsModal", () => {
  beforeEach(() => {
    fetchData.mockReset();
    EditNotificationSettings.mockReset();
    LogError.mockReset();
    localStorage.setItem("FB-DEVICE-TOKEN", "device");
    window.location.hash = "";
  });
  afterEach(() => {
    localStorage.removeItem("FB-DEVICE-TOKEN");
  });

  it("reads the notification settings from the core backend and shows them", async () => {
    fetchData.mockResolvedValue(settings());
    await renderWithProviders(<SettingsModal onClose={() => {}} lang="gb-en" />, { store: { userProfile: { name: "Sara" } } });
    expect(await screen.findByText("new offers"), "a subscribed topic is not shown with a readable name").toBeInTheDocument();
    expect(screen.getByText("price drop"), "an unsubscribed topic is not shown").toBeInTheDocument();
    expect(toggle("mail").getAttribute("aria-checked"), "email should be on").toBe("true");
    expect(toggle("firebase").getAttribute("aria-checked"), "firebase should be off").toBe("false");
    expect(select().value, "the saved frequency is not selected").toBe("weekly");
    expect(fetchData.mock.calls[0][0].server, "the settings were not read from the market backend").toBe("market");
  });

  it("shows 'No Topics Subscribed.' and logs when the backend refuses the read", async () => {
    fetchData.mockResolvedValue({ success: false, message: "core refused" });
    await renderWithProviders(<SettingsModal onClose={() => {}} lang={["ar"]} />);
    expect(await screen.findByText("No Topics Subscribed."), "the empty state is missing").toBeInTheDocument();
    expect(LogError.mock.calls[0][0].error.message, "the refusal was not logged with the backend's message").toBe("core refused");
    expect(document.querySelector('[dir="rtl"]'), "an Arabic modal must run right to left").not.toBeNull();
  });

  it("handles settings with no topic lists and no frequency", async () => {
    fetchData.mockResolvedValue(settings({ subscribed_topics: null, unsubscribed_topics: null, notification_frequency: null }));
    await renderWithProviders(<SettingsModal onClose={() => {}} lang="gb-en" />);
    await waitFor(() => expect(select().disabled, "the form stayed locked after reading").toBe(false));
    expect(select().value, "an empty frequency did not pick the placeholder").toBe("");
    expect(document.querySelector('[data-pw="NotificationsItem-Can-Disenabled"]'), "an empty list was drawn").toBeNull();
  });

  it("moves a topic to disabled when unsubscribed, and back when subscribed", async () => {
    fetchData.mockResolvedValueOnce(settings()).mockResolvedValue({ success: true });
    await renderWithProviders(<SettingsModal onClose={() => {}} lang="gb-en" />);
    await screen.findByText("new offers");
    await act(async () => fireEvent.click(screen.getByText("Unsubscribe")));
    expect(fetchData.mock.calls[1][0].url, "unsubscribe went to the wrong address").toBe("/firebase_device_tokens/unsubscribe_topic");
    expect(JSON.parse(fetchData.mock.calls[1][0].body).topic, "the locale suffix was not stripped from the topic").toBe("new_offers");
    expect(screen.getAllByText("Subscribe").length, "the unsubscribed topic did not move to the disabled list").toBe(2);
    await act(async () => fireEvent.click(screen.getAllByText("Subscribe")[0]));
    expect(fetchData.mock.calls[2][0].url, "subscribe went to the wrong address").toBe("/firebase_device_tokens/subscribe_topic");
    expect(screen.getByText("Unsubscribe"), "the subscribed topic did not move back").toBeInTheDocument();
  });

  it("logs and changes nothing when the core backend refuses a topic change", async () => {
    fetchData.mockResolvedValueOnce(settings()).mockResolvedValue({ success: false, message: "no" });
    await renderWithProviders(<SettingsModal onClose={() => {}} lang="gb-en" />);
    await screen.findByText("new offers");
    await act(async () => fireEvent.click(screen.getByText("Unsubscribe")));
    await act(async () => fireEvent.click(screen.getByText("Subscribe")));
    expect(screen.getByText("Unsubscribe"), "a refused unsubscribe still moved the topic").toBeInTheDocument();
    const scenarios = LogError.mock.calls.map((c) => c[0].scenario);
    expect(scenarios, "a refused unsubscribe was not logged").toContain("SettingsModal: unsubscribing from the topic threw");
    expect(scenarios, "a refused subscribe was not logged").toContain("SettingsModal: subscribing to the topic threw");
  });

  it("does not call the backend for a topic change without a device token", async () => {
    localStorage.removeItem("FB-DEVICE-TOKEN");
    fetchData.mockResolvedValue(settings());
    await renderWithProviders(<SettingsModal onClose={() => {}} lang="gb-en" />);
    await screen.findByText("new offers");
    await act(async () => fireEvent.click(screen.getByText("Unsubscribe")));
    await act(async () => fireEvent.click(screen.getByText("Subscribe")));
    expect(fetchData, "a topic change was sent with no device token").toHaveBeenCalledTimes(1);
    const scenarios = LogError.mock.calls.map((c) => c[0].scenario);
    expect(scenarios, "a missing token was not logged").toEqual([
      "SettingsModal: unsubscribing from the topic was refused",
      "SettingsModal: subscribing to the topic was refused",
    ]);
  });

  it("saves a channel toggle, and puts it back when the save fails", async () => {
    fetchData.mockResolvedValue(settings({ email: 0 }));
    await renderWithProviders(<SettingsModal onClose={() => {}} lang="gb-en" />);
    await waitFor(() => expect(toggle("whatsapp").disabled, "the toggles stayed locked").toBe(false));
    EditNotificationSettings.mockResolvedValue(true);
    await act(async () => fireEvent.click(toggle("whatsapp")));
    expect(EditNotificationSettings, "the WhatsApp change was not saved").toHaveBeenCalledWith({ url: "update_whatsapp", body: { whatsapp: 1 } });
    expect(toggle("whatsapp").getAttribute("aria-checked"), "a saved toggle did not stay on").toBe("true");
    await act(async () => fireEvent.click(toggle("mail")));
    expect(EditNotificationSettings, "the email change was not saved").toHaveBeenCalledWith({ url: "update_email", body: { email: 1 } });
    EditNotificationSettings.mockResolvedValue(false);
    await act(async () => fireEvent.click(toggle("firebase")));
    expect(toggle("firebase").getAttribute("aria-checked"), "a failed save did not put the toggle back").toBe("false");
  });

  it("toggles on from no saved settings at all", async () => {
    fetchData.mockRejectedValue(new Error("network"));
    EditNotificationSettings.mockResolvedValue(true);
    await renderWithProviders(<SettingsModal onClose={() => {}} lang="gb-en" />);
    await waitFor(() => expect(toggle("mail").disabled, "the toggles stayed locked").toBe(false));
    await act(async () => fireEvent.click(toggle("mail")));
    expect(toggle("mail").getAttribute("aria-checked"), "the toggle did not turn on").toBe("true");
  });

  it("saves the frequency, and puts it back when the save fails", async () => {
    fetchData.mockResolvedValue(settings());
    await renderWithProviders(<SettingsModal onClose={() => {}} lang="gb-en" />);
    await waitFor(() => expect(select().disabled, "the select stayed locked").toBe(false));
    EditNotificationSettings.mockResolvedValue(true);
    await act(async () => fireEvent.change(select(), { target: { value: "daily" } }));
    expect(EditNotificationSettings, "the frequency was not saved").toHaveBeenCalledWith({
      url: "update_notification_frequency",
      body: { notification_frequency: "daily" },
    });
    EditNotificationSettings.mockResolvedValue(false);
    await act(async () => fireEvent.change(select(), { target: { value: "monthly" } }));
    expect(select().value, "a failed save did not put the frequency back").toBe("daily");
  });

  it("switches to the test tab from a button and from the address hash", async () => {
    fetchData.mockResolvedValue(settings());
    // Plain render: the render helper rewrites the address and would drop the hash.
    window.location.hash = "preferences";
    render(<SettingsModal onClose={() => {}} lang="gb-en" />);
    expect(screen.getByTestId("notifications-test"), "the #preferences hash did not open the test tab").toBeInTheDocument();
    fireEvent.click(screen.getByText("Notifications Settings"));
    expect(window.location.hash, "the tab was not written to the address").toBe("#notifications");
    expect(screen.queryByTestId("notifications-test"), "the settings tab did not open").toBeNull();
    fireEvent.click(screen.getByText("Notification Test"));
    expect(screen.getByTestId("notifications-test"), "the test tab button did not work").toBeInTheDocument();
    act(() => {
      window.location.hash = "notifications";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.queryByTestId("notifications-test"), "a hash change did not switch the tab").toBeNull();
    act(() => {
      window.location.hash = "other";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.queryByTestId("notifications-test"), "an unknown hash changed the tab").toBeNull();
  });
});
