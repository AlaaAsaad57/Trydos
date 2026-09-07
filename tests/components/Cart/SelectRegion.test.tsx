import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import SelectRegion from "components/Cart/SelectRegion";
import { renderWithProviders } from "../../render";
import { fetchData } from "utils/fetchData";
import { LogError } from "utils/functions";
import { useAppStore } from "store";
import { REQUESTS_DATA } from "utils/Requests";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

vi.mock("utils/functions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("utils/functions")>();
  return {
    ...actual,
    LogError: vi.fn(),
    translateFunction: (key: string) => key,
  };
});

vi.mock("react-debounce-input", () => ({
  DebounceInput: ({
    onChange,
    onFocus,
    value,
    placeholder,
    className,
    "data-pw": dataPw,
  }: any) => (
    <input
      data-pw={dataPw}
      value={value}
      placeholder={placeholder}
      className={className}
      onFocus={onFocus}
      onChange={onChange}
    />
  ),
}));

describe("SelectRegion component", () => {
  const defaultTestStore = {
    provinces: ["Damascus", "Aleppo", "Latakia"],
    addressDetails: {
      id: null,
      location: { latitude: null, longitude: null },
      user_name: null,
      Country: "SY",
      address_detail: "",
      address: "",
      contact_info: {
        contact_person_name: "",
        phone: "",
        alternative_phone: "",
      },
      region: "",
      region_details: {
        city: "",
        province: "",
        town: "",
        street: "",
        building: "",
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchData).mockReset();
  });

  it("renders country name and handles backdrop click to close", async () => {
    const closeSelect = vi.fn();
    const { container } = await renderWithProviders(
      <SelectRegion closeSelect={closeSelect} />,
      {
        country: "sy",
        language: "en",
        store: defaultTestStore,
      },
    );

    expect(screen.getByText("Select From List")).toBeInTheDocument();
    expect(container.querySelector('[data-pw="country-extend"]')).toBeInTheDocument();

    // Default provinces should be visible when search is empty
    expect(screen.getByText("Damascus")).toBeInTheDocument();
    expect(screen.getByText("Aleppo")).toBeInTheDocument();
    expect(screen.getByText("Latakia")).toBeInTheDocument();

    // Clicking overlay backdrop when not focused should trigger closeSelect
    const backdrop = container.querySelector(".opacity-40.bg-\\[black\\]");
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(closeSelect).toHaveBeenCalledTimes(1);
  });

  it("handles backdrop click after input focus: first click unfocuses, second click closes", async () => {
    const closeSelect = vi.fn();
    const { container } = await renderWithProviders(
      <SelectRegion closeSelect={closeSelect} />,
      {
        country: "sy",
        language: "en",
        store: defaultTestStore,
      },
    );

    const input = container.querySelector(
      '[data-pw="SearchProvince-District-Town-Street"]',
    ) as HTMLInputElement;
    expect(input).toBeInTheDocument();

    // Focus input
    fireEvent.focus(input);

    const backdrop = container.querySelector(".opacity-40.bg-\\[black\\]");
    // First click should unfocus, not close
    fireEvent.click(backdrop!);
    expect(closeSelect).not.toHaveBeenCalled();

    // Second click should close
    fireEvent.click(backdrop!);
    expect(closeSelect).toHaveBeenCalledTimes(1);
  });

  it("renders extended region details (province, city, town) if present in store", async () => {
    const storeWithDetails = {
      ...defaultTestStore,
      addressDetails: {
        ...defaultTestStore.addressDetails,
        region_details: {
          province: "Damascus",
          city: "Damascus City",
          town: "Midan",
          street: "Souk St",
          building: "12",
        },
      },
    };

    const { container } = await renderWithProviders(
      <SelectRegion closeSelect={vi.fn()} />,
      {
        country: "sy",
        language: "en",
        store: storeWithDetails,
      },
    );

    const provinceEl = container.querySelector('[data-pw="Province-extend"]');
    expect(provinceEl).toHaveTextContent("Damascus");

    const cityEl = container.querySelector('[data-pw="Town-extend"]');
    expect(cityEl).toHaveTextContent("Damascus City");

    const townEl = container.querySelector('[data-pw="Suburb-extend"]');
    expect(townEl).toHaveTextContent("Midan");
  });

  it("searches addresses when typing in input and renders search results", async () => {
    const mockResults = [
      {
        country: "Syria",
        province: "Damascus",
        city: "Damascus City",
        town: "Midan",
        street: "Old Souk",
        building: "5",
        coordinates: [{ lat: 33.5138, lon: 36.2765 }],
      },
    ];

    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      results: mockResults,
    });

    const closeSelect = vi.fn();
    const { container } = await renderWithProviders(
      <SelectRegion closeSelect={closeSelect} />,
      {
        country: "sy",
        language: "en",
        store: defaultTestStore,
      },
    );

    const input = container.querySelector(
      '[data-pw="SearchProvince-District-Town-Street"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Midan" } });

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith({
        url: "/api/addresses/get-address-by-text",
        method: "POST",
        body: JSON.stringify({ query: "Midan" }),
        server: "elastic",
        reqTitle: REQUESTS_DATA.GET_ADDRESS_BY_TEXT,
      });
    });

    // Verify search results rendered
    const resultItem = await screen.findByText(
      "Syria | Damascus | Damascus City | Midan | Old Souk | 5",
    );
    expect(resultItem).toBeInTheDocument();

    // Click search result to select
    fireEvent.click(resultItem);

    // Verify store updated with map center and address details
    const state = useAppStore.getState();
    expect(state.center).toEqual({ lat: 33.5138, lng: 36.2765 });
    expect(state.addressDetails.region_details).toEqual({
      city: "Damascus City",
      province: "Damascus",
      town: "Midan",
      street: "Old Souk",
      building: "5",
    });
    expect(state.addressDetails.region).toBe(
      "Syria | Damascus | Damascus City | Midan | Old Souk | 5",
    );
    expect(closeSelect).toHaveBeenCalledTimes(1);
  });

  it("handles search result click when coordinates are missing or null strings present", async () => {
    const mockResults = [
      {
        country: "Syria",
        province: "null",
        city: "Latakia",
        town: "null",
        street: "null",
        building: "null",
        coordinates: [],
      },
    ];

    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      results: mockResults,
    });

    const closeSelect = vi.fn();
    const { container } = await renderWithProviders(
      <SelectRegion closeSelect={closeSelect} />,
      {
        country: "sy",
        language: "en",
        store: defaultTestStore,
      },
    );

    const input = container.querySelector(
      '[data-pw="SearchProvince-District-Town-Street"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Latakia" } });

    const resultItem = await screen.findByText("Syria | Latakia");
    expect(resultItem).toBeInTheDocument();

    fireEvent.click(resultItem);

    const state = useAppStore.getState();
    expect(state.center).toBeNull();
    expect(state.addressDetails.region_details).toEqual({
      city: "Latakia",
      province: "null",
      town: "null",
      street: "null",
      building: "null",
    });
    expect(state.addressDetails.region).toBe("Syria | Latakia");
    expect(closeSelect).toHaveBeenCalledTimes(1);
  });

  it("clicking a province triggers searchAction with province name", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      results: [
        {
          country: "Syria",
          province: "Aleppo",
          coordinates: [{ lat: 36.2, lon: 37.1 }],
        },
      ],
    });

    const { container } = await renderWithProviders(
      <SelectRegion closeSelect={vi.fn()} />,
      {
        country: "sy",
        language: "en",
        store: defaultTestStore,
      },
    );

    const aleppoItem = screen.getByText("Aleppo");
    fireEvent.click(aleppoItem);

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith({
        url: "/api/addresses/get-address-by-text",
        method: "POST",
        body: JSON.stringify({ query: "Aleppo" }),
        server: "elastic",
        reqTitle: REQUESTS_DATA.GET_ADDRESS_BY_TEXT,
      });
    });

    // Check that input value updated to Aleppo
    const input = container.querySelector(
      '[data-pw="SearchProvince-District-Town-Street"]',
    ) as HTMLInputElement;
    expect(input.value).toBe("Aleppo");
  });

  it("handles search error when API returns success: false or network rejects", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: false,
      message: "Elasticsearch unavailable",
    });

    const { container } = await renderWithProviders(
      <SelectRegion closeSelect={vi.fn()} />,
      {
        country: "sy",
        language: "en",
        store: defaultTestStore,
      },
    );

    const input = container.querySelector(
      '[data-pw="SearchProvince-District-Town-Street"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "UnknownPlace" } });

    await waitFor(() => {
      expect(LogError).toHaveBeenCalledWith({
        error: expect.any(Error),
        scenario: "search for address by text - cart widget",
        search_text: "UnknownPlace",
      });
    });
  });
});
