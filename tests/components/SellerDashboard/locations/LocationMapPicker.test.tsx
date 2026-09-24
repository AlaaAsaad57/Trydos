// The click-to-drop-pin map inside the location form.
//
// Google's map cannot load in jsdom, so `@react-google-maps/api` is replaced by
// a stand-in: the "map" is a div that calls `onClick` with a fake lat/lng when
// clicked, and `onLoad` with a fake map object so pan and zoom can be checked.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loader = vi.hoisted(() => ({
  state: { isLoaded: true, loadError: undefined as unknown },
}));
const fakeMap = vi.hoisted(() => ({ panTo: vi.fn(), setZoom: vi.fn() }));
const mapsKey = vi.hoisted(() => ({ value: "test-key" }));

vi.mock("utils/mapsConfig", () => ({
  get GOOGLE_MAPS_API_KEY() {
    return mapsKey.value;
  },
  GOOGLE_MAPS_LOADER_ID: "google-map-script",
}));

vi.mock("@react-google-maps/api", async () => {
  const React = await import("react");
  return {
    useJsApiLoader: () => loader.state,
    GoogleMap: ({ onClick, onLoad, onUnmount, children }: any) => {
      React.useEffect(() => {
        onLoad?.(fakeMap);
        return () => onUnmount?.();
      }, []);
      return (
        <div>
          <button
            type="button"
            onClick={() => onClick({ latLng: { lat: () => 10, lng: () => 20 } })}
          >
            fake map
          </button>
          <button type="button" onClick={() => onClick({ latLng: null })}>
            fake map edge
          </button>
          {children}
        </div>
      );
    },
    Marker: ({ position }: any) => (
      <span data-testid="marker">{`${position.lat},${position.lng}`}</span>
    ),
  };
});

import LocationMapPicker from "components/SellerDashboard/locations/LocationMapPicker";

import { renderWithProviders, screen, userEvent } from "../../../render";

const realGeolocation = Object.getOwnPropertyDescriptor(navigator, "geolocation");

beforeEach(() => {
  loader.state = { isLoaded: true, loadError: undefined };
  mapsKey.value = "test-key";
  fakeMap.panTo.mockReset();
  fakeMap.setZoom.mockReset();
  (window as any).google = { maps: { Size: class { constructor(public w: number, public h: number) {} } } };
});

afterEach(() => {
  if (realGeolocation) Object.defineProperty(navigator, "geolocation", realGeolocation);
  else delete (navigator as any).geolocation;
});

function setGeolocation(value: unknown) {
  Object.defineProperty(navigator, "geolocation", { value, configurable: true });
}

async function mount(props: Partial<Parameters<typeof LocationMapPicker>[0]> = {}) {
  const onPick = vi.fn();
  const view = await renderWithProviders(
    <LocationMapPicker value={null} onPick={onPick} {...props} />,
  );
  return { ...view, onPick };
}

describe("Location map — when the map cannot be shown", () => {
  it("says the map is unavailable when Google's script failed", async () => {
    loader.state = { isLoaded: false, loadError: new Error("blocked") };
    await mount();
    expect(screen.getByText("Map is unavailable"), "a failed map should say so, not show a grey box").toBeInTheDocument();
  });

  it("says the map is unavailable when there is no maps key", async () => {
    mapsKey.value = "";
    await mount();
    expect(screen.getByText("Map is unavailable"), "without a key the map should say it is unavailable").toBeInTheDocument();
  });

  it("shows a spinner and no location button while the script loads", async () => {
    loader.state = { isLoaded: false, loadError: undefined };
    await mount();
    expect(screen.queryByText("fake map"), "the map must not render before the script is loaded").not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Use my current location" }),
      "the location button needs the map, so it must wait too",
    ).not.toBeInTheDocument();
  });
});

describe("Location map — picking a point", () => {
  it("reports the clicked point and pans to it", async () => {
    const { onPick } = await mount();
    await userEvent.click(screen.getByRole("button", { name: "fake map" }));
    expect(onPick, "the clicked point should go up to the form").toHaveBeenCalledWith({ lat: 10, lng: 20 });
    expect(fakeMap.panTo, "the map should move to the clicked point").toHaveBeenCalledWith({ lat: 10, lng: 20 });
    expect(screen.getByText("Pick the position on the map"), "an editable map should say how to use it").toBeInTheDocument();
  });

  it("ignores a click with no position", async () => {
    const { onPick } = await mount();
    await userEvent.click(screen.getByRole("button", { name: "fake map edge" }));
    expect(onPick, "a click that carries no lat/lng must report nothing").not.toHaveBeenCalled();
  });

  it("draws the pin for the value it is given", async () => {
    await mount({ value: { lat: 1.5, lng: 2.5 } });
    expect(screen.getByTestId("marker").textContent, "the pin should sit on the given point").toBe("1.5,2.5");
  });

  it("reports nothing when disabled, and offers no location button", async () => {
    const { onPick } = await mount({ disabled: true });
    await userEvent.click(screen.getByRole("button", { name: "fake map" }));
    expect(onPick, "a read-only map must not report a click").not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Use my current location" }),
      "a read-only map must not offer the location button",
    ).not.toBeInTheDocument();
    expect(screen.getByText("Coordinates are optional"), "a read-only map should not ask the seller to pick").toBeInTheDocument();
  });
});

describe("Location map — use my location", () => {
  it("picks the device position, pans and zooms in", async () => {
    setGeolocation({
      getCurrentPosition: (ok: (p: unknown) => void) =>
        ok({ coords: { latitude: 33.5, longitude: 36.3 } }),
    });
    const { onPick } = await mount();
    await userEvent.click(screen.getByRole("button", { name: "Use my current location" }));
    expect(onPick, "the device position should go up to the form").toHaveBeenCalledWith({ lat: 33.5, lng: 36.3 });
    expect(fakeMap.setZoom, "the map should zoom in on the device position").toHaveBeenCalledWith(14);
  });

  it("says so when the position cannot be read", async () => {
    setGeolocation({
      getCurrentPosition: (_ok: unknown, fail: () => void) => fail(),
    });
    await mount();
    await userEvent.click(screen.getByRole("button", { name: "Use my current location" }));
    expect(screen.getByText("Error getting your location"), "a refused position should be explained").toBeInTheDocument();
  });

  it("shows a spinner while the position is being read", async () => {
    setGeolocation({ getCurrentPosition: () => {} });
    await mount();
    const button = screen.getByRole("button", { name: "Use my current location" });
    await userEvent.click(button);
    expect(
      button.querySelector('[data-pw="SpinneR"]'),
      "the button should show the spinner while it waits for the position",
    ).toBeInTheDocument();
  });

  it("says so when the browser has no geolocation", async () => {
    setGeolocation(undefined);
    await mount();
    await userEvent.click(screen.getByRole("button", { name: "Use my current location" }));
    expect(
      screen.getByText("Geolocation is not supported by your browser"),
      "a browser without geolocation should be told so",
    ).toBeInTheDocument();
  });

});
