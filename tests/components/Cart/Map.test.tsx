// The small map inside the address form (components/Cart/Map.tsx).
//
// The map widget asks the search backend for the country's border, then draws
// the Google map (MapElement) inside a box that the shopper can expand. The
// Google map itself is replaced here: it needs the Google Maps script, and its
// own behaviour is tested in MapElement.test.tsx. The stand-in shows the border
// it was given and offers one button that reports a picked location.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

import Map from "components/Cart/Map";

import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

const fetchData = vi.fn();
vi.mock("utils/fetchData", () => ({
  fetchData: (...args: any[]) => fetchData(...args),
  abortInFlightForLogout: vi.fn(),
}));

vi.mock("services/auth", () => ({ default: { UserID: vi.fn(() => 1) } }));

vi.mock("components/Cart/MapElement", () => ({
  MapElement: ({ cordinates, setLocation, expanded }: any) => (
    <div data-testid="google-map" data-expanded={String(expanded)}>
      <span data-testid="border">{JSON.stringify(cordinates)}</span>
      <button onClick={() => setLocation({ latitude: 33.5, longitude: 36.3 })}>
        pick
      </button>
    </div>
  ),
}));

/** Holds `expanded` the way AddAddressForm does, so the map can open and close. */
function Harness({ setAddressDetails }: { setAddressDetails: any }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Map
      center={{ lat: 1, lng: 2 }}
      expanded={expanded}
      setExpanded={setExpanded}
      setAddressDetails={setAddressDetails}
    />
  );
}

const border = [{ lat: 1, lon: 2 }];

async function openMap(
  location: Record<string, any> = { latitude: null, longitude: null },
) {
  const setAddressDetails = vi.fn();
  const view = await renderWithProviders(
    <Harness setAddressDetails={setAddressDetails} />,
    { country: "sy", store: { addressDetails: { location } } },
  );
  return { ...view, setAddressDetails };
}

beforeEach(() => {
  fetchData.mockReset();
});

describe("the address map box", () => {
  it("asks the search backend for the border of the country in the URL and hands it to the map", async () => {
    fetchData.mockResolvedValue({
      success: true,
      country: { boundary: { coordinates: border } },
    });
    await openMap();

    const border_ = await screen.findByTestId("border");
    expect(
      fetchData.mock.calls[0][0].url,
      "the border request did not name the country from the URL (sy)",
    ).toBe("/api/addresses/CountryBoundaryByIso/SY");
    expect(border_.textContent, "the map did not get the border the search backend sent").toBe(
      JSON.stringify(border),
    );
    expect(
      screen.getByText("Location Is Accurate, Making It Easy To Receive Shipments"),
      "the closed map did not show the accuracy note",
    ).toBeInTheDocument();
  });

  it("still draws the map, with no border, when the search backend refuses the border request", async () => {
    fetchData.mockResolvedValue({ success: false, message: "no border" });
    await openMap();

    const border_ = await screen.findByTestId("border");
    expect(border_.textContent, "a refused border request must leave the map without a border").toBe(
      "null",
    );
  });

  it("opens from the 'Locate Your Location On Map' strip, reports a picked point and closes on Select", async () => {
    fetchData.mockResolvedValue({
      success: true,
      country: { boundary: { coordinates: border } },
    });
    const { setAddressDetails } = await openMap({ latitude: 33.5, longitude: 36.3 });

    await userEvent.click(await screen.findByText("Locate Your Location On Map"));
    expect(
      screen.getByTestId("google-map").dataset.expanded,
      "tapping the strip did not open the map",
    ).toBe("true");

    await userEvent.click(screen.getByText("pick"));
    expect(
      setAddressDetails,
      "a point picked on the map was not written into the address form",
    ).toHaveBeenCalledWith({ location: { latitude: 33.5, longitude: 36.3 } });

    const select = screen.getByText("Select");
    expect(select.className, "Select must look active once a point is stored").toContain(
      "bg-[#346BFF]",
    );
    await userEvent.click(select);
    expect(
      screen.getByTestId("google-map").dataset.expanded,
      "Select did not close the map",
    ).toBe("false");
  });

  it("opens by tapping the box itself, and Cancel clears the picked point", async () => {
    fetchData.mockResolvedValue({
      success: true,
      country: { boundary: { coordinates: border } },
    });
    const { setAddressDetails } = await openMap();
    await screen.findByTestId("google-map");

    await userEvent.click(document.querySelector('[data-pw="map-toggle"]')!);
    expect(screen.getByText("Select").className, "Select must look grey while no point is stored").toContain(
      "bg-[#7C7C7C]",
    );
    // A second tap on the open box changes nothing.
    await userEvent.click(document.querySelector('[data-pw="map-toggle"]')!);

    await userEvent.click(screen.getByText("Cancel"));
    expect(setAddressDetails, "Cancel did not clear the picked point").toHaveBeenCalledWith({
      location: { latitude: null, longitude: null },
    });
    await waitFor(() =>
      expect(
        screen.getByTestId("google-map").dataset.expanded,
        "Cancel did not close the map",
      ).toBe("false"),
    );
  });
});
