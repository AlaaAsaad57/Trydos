// The Google map inside the address form (components/Cart/MapElement.tsx).
//
// The Google Maps script cannot load in jsdom, so the React wrapper
// (@react-google-maps/api) and the `google.maps` global are replaced. The
// stand-in map hands the component a fake map object on load, and shows the
// map's click handler as a button so a test can "tap" a point.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";

import { MapElement } from "components/Cart/MapElement";

import { act, renderWithProviders, screen, userEvent } from "../../render";

const loader = { isLoaded: true };
const fakeMap = { getZoom: vi.fn(() => 12), panTo: vi.fn(), setCenter: vi.fn() };
let lastPoint: any = null;
let clickPoint: any = { latLng: { lat: () => 33.5, lng: () => 36.3 } };

vi.mock("@react-google-maps/api", () => ({
  useJsApiLoader: () => loader,
  GoogleMap: ({ children, onLoad, onUnmount, onClick, center }: any) => {
    useEffect(() => {
      onLoad(fakeMap);
      return () => onUnmount();
    }, []);
    return (
      <div data-testid="gmap" data-center={JSON.stringify(center)}>
        <button onClick={() => onClick(clickPoint)}>tap-map</button>
        {children}
      </div>
    );
  },
  Polygon: ({ onLoad, onClick }: any) => {
    useEffect(() => {
      onLoad({ polygon: true });
    }, []);
    return <button onClick={() => onClick(clickPoint)}>tap-polygon</button>;
  },
  Marker: ({ position }: any) => (
    <div data-testid="marker">{`${position.lat},${position.lng}`}</div>
  ),
}));

const showSuccessNotification = vi.fn();
const showErrorNotification = vi.fn();
vi.mock("@/store/notifications/reducer", () => ({
  showSuccessNotification: (...a: any[]) => showSuccessNotification(...a),
  showErrorNotification: (...a: any[]) => showErrorNotification(...a),
}));

const containsLocation = vi.fn(() => true);

beforeEach(() => {
  loader.isLoaded = true;
  fakeMap.getZoom.mockReturnValue(12);
  fakeMap.panTo.mockClear();
  fakeMap.setCenter.mockClear();
  containsLocation.mockReset().mockReturnValue(true);
  showErrorNotification.mockClear();
  showSuccessNotification.mockClear();
  clickPoint = { latLng: { lat: () => 33.5, lng: () => 36.3 } };
  vi.stubGlobal("google", {
    maps: {
      LatLng: class {
        lat: number;
        lng: number;
        constructor(lat: number, lng: number) {
          this.lat = lat;
          this.lng = lng;
          lastPoint = this;
        }
      },
      Size: class {},
      ControlPosition: { RIGHT_TOP: 1 },
      geometry: { poly: { containsLocation } },
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function drawMap(
  props: Partial<{ center: any; expanded: boolean; cordinates: any }> = {},
  location: Record<string, any> = { latitude: null, longitude: null },
) {
  const setLocation = vi.fn();
  const view = await renderWithProviders(
    <MapElement
      center={props.center ?? { lat: 33, lng: 36 }}
      expanded={props.expanded ?? true}
      cordinates={
        "cordinates" in props ? props.cordinates : [{ lat: "1", lon: "2" }]
      }
      setLocation={setLocation}
    />,
    { store: { addressDetails: { location } } },
  );
  return { ...view, setLocation };
}

/** The round "my location" button: the one button the stand-ins did not add. */
const locateButton = () =>
  Array.from(document.querySelectorAll("button")).find(
    (b) => !b.textContent?.startsWith("tap-"),
  )!;

function stubGeolocation(geolocation: any) {
  vi.stubGlobal("navigator", { ...navigator, geolocation });
}

describe("the Google map in the address form", () => {
  it("centres on the given point once the map has loaded", async () => {
    await drawMap();
    expect(
      fakeMap.setCenter,
      "the loaded map was not centred on the given point",
    ).toHaveBeenCalled();
    expect(
      lastPoint,
      "the centre point was not built from the given lat/lng",
    ).toMatchObject({ lat: 33, lng: 36 });
    expect(
      fakeMap.panTo,
      "the map did not pan to the given centre",
    ).toHaveBeenCalledWith({ lat: 33, lng: 36 });
  });

  it("falls back to the default centre when the centre is the string 'null'", async () => {
    await drawMap({ center: { lat: "null", lng: "null" } });
    expect(
      JSON.parse(screen.getByTestId("gmap").dataset.center!),
      "a 'null' centre did not fall back to the default centre",
    ).toEqual({ lat: 39.1667, lng: 35.6667 });
    expect(
      fakeMap.setCenter,
      "a string centre must not be used to centre the map",
    ).not.toHaveBeenCalled();
  });

  it("asks the shopper to zoom in before a tap is accepted", async () => {
    fakeMap.getZoom.mockReturnValue(5);
    const { setLocation } = await drawMap();
    await userEvent.click(screen.getByText("tap-map"));
    expect(
      showSuccessNotification,
      "no 'be accurate' hint was shown at a far zoom",
    ).toHaveBeenCalledWith("Please Be Accurate and select your Location");
    expect(
      setLocation,
      "a tap at a far zoom was stored as the location",
    ).not.toHaveBeenCalled();
  });

  it("stores a tapped point inside the country and pans to it", async () => {
    const { setLocation } = await drawMap();
    await userEvent.click(screen.getByText("tap-polygon"));
    expect(setLocation, "a tap inside the border was not stored").toHaveBeenCalledWith({
      latitude: 33.5,
      longitude: 36.3,
    });
    expect(
      fakeMap.panTo,
      "the map did not pan to the tapped point",
    ).toHaveBeenCalledWith({ lat: 33.5, lng: 36.3 });
  });

  it("refuses a tapped point outside the country", async () => {
    containsLocation.mockReturnValue(false);
    const { setLocation } = await drawMap();
    await userEvent.click(screen.getByText("tap-map"));
    expect(
      showErrorNotification,
      "no error was shown for a point outside the country",
    ).toHaveBeenCalledWith("Pick Your Deleivery Location Inside Your Country");
    expect(
      setLocation,
      "a point outside the country was stored",
    ).not.toHaveBeenCalled();
  });

  it("ignores a tap that carries no point", async () => {
    clickPoint = {};
    const { setLocation } = await drawMap();
    await userEvent.click(screen.getByText("tap-map"));
    expect(
      setLocation,
      "a tap with no point stored a location",
    ).not.toHaveBeenCalled();
  });

  it("accepts any point when there is no country border", async () => {
    const { setLocation } = await drawMap({ cordinates: null });
    await userEvent.click(screen.getByText("tap-map"));
    expect(
      containsLocation,
      "the border check ran with no border",
    ).not.toHaveBeenCalled();
    expect(setLocation, "a tap with no border was not stored").toHaveBeenCalled();
  });

  it("shows a marker on the stored location", async () => {
    await drawMap({}, { latitude: "33.5", longitude: "36.3" });
    expect(
      screen.getByTestId("marker").textContent,
      "the marker is not on the stored location",
    ).toBe("33.5,36.3");
  });

  it("shows a spinner while the Google script loads and there is a border to draw", async () => {
    loader.isLoaded = false;
    await drawMap();
    expect(
      screen.queryByTestId("gmap"),
      "the map was drawn before the script loaded",
    ).toBeNull();
    expect(
      document.querySelector("svg"),
      "no spinner was shown while the script loads",
    ).not.toBeNull();
  });

  describe("the 'my location' button", () => {
    it("stores the device location when it is inside the country", async () => {
      stubGeolocation({
        getCurrentPosition: (ok: any) =>
          ok({ coords: { latitude: 34, longitude: 37 } }),
      });
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const { setLocation } = await drawMap();
      await act(async () => locateButton().click());
      expect(
        setLocation,
        "the device location was not stored",
      ).toHaveBeenCalledWith({ latitude: 34, longitude: 37 });
      expect(
        fakeMap.panTo,
        "the map did not pan to the device location",
      ).toHaveBeenCalledWith({ lat: 34, lng: 37 });
      await act(async () => {
        vi.advanceTimersByTime(1100);
      });
    });

    it("refuses a device location outside the country", async () => {
      containsLocation.mockReturnValue(false);
      stubGeolocation({
        getCurrentPosition: (ok: any) =>
          ok({ coords: { latitude: 1, longitude: 1 } }),
      });
      const { setLocation } = await drawMap();
      await act(async () => locateButton().click());
      expect(
        showErrorNotification,
        "no error for a device location outside the country",
      ).toHaveBeenCalledWith("Your Current Location is Not belong to Country Bounds");
      expect(
        setLocation,
        "a device location outside the country was stored",
      ).not.toHaveBeenCalled();
    });

    it("says so when the device refuses to give its location", async () => {
      stubGeolocation({
        getCurrentPosition: (_ok: any, fail: any) => fail({ code: 1 }),
      });
      await drawMap();
      await act(async () => locateButton().click());
      expect(
        showErrorNotification,
        "no error when the device refused its location",
      ).toHaveBeenCalledWith("Error getting your location");
    });

    it("says so when the browser has no geolocation", async () => {
      stubGeolocation(undefined);
      await drawMap();
      await act(async () => locateButton().click());
      expect(
        showErrorNotification,
        "no error when the browser has no geolocation",
      ).toHaveBeenCalledWith("Geolocation is not supported by your browser");
    });
  });
});
