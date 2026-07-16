import { buildParamsFromFilters, FilterParams, FilterState } from "utils/server";

export function getFilterStateForItem(
  parsedFilters: FilterParams,
  itemValue: string,
  filterKey: string,
  parentValue?: string[],
  lang?: string,
  baseUrlOfFiltersPage?: string,
  // Active query string (without leading "?") to carry across a filter click,
  // e.g. `search=nike` / `sort=price_asc`. Filter links are path-based, so
  // without this the current ?search=/?sort= would be dropped on every toggle.
  activeQueryString?: string,
): FilterState {
  let currentValues: any[] = [];

  // Extract the filter value - it's already parsed as an array
  const filterRawValue = parsedFilters[filterKey];
  if (filterRawValue && Array.isArray(filterRawValue)) {
    currentValues = filterRawValue;
  }

  // Check if item is currently filtered
  let isFiltered = false;
  if (filterKey === "colors") {
    // For colors, check both with and without # prefix
    const colorWithHash = itemValue.startsWith("#")
      ? itemValue
      : `#${itemValue}`;
    const colorWithoutHash = itemValue.startsWith("#")
      ? itemValue.substring(1)
      : itemValue;
    isFiltered =
      currentValues.includes(colorWithHash) ||
      currentValues.includes(colorWithoutHash);
  } else {
    isFiltered =
      Array.isArray(currentValues) && currentValues.includes(itemValue);
  }

  // Create new filters object
  const newFilters = { ...parsedFilters };

  // Special handling for prices - only allow one value at a time
  if (filterKey === "prices") {
    if (isFiltered) {
      delete newFilters[filterKey]; // Remove filter
    } else {
      newFilters[filterKey] = [itemValue]; // Set new value
    }
  } else if (filterKey === "colors") {
    // Special handling for colors - ensure we store with # prefix
    const colorValue = itemValue.startsWith("#") ? itemValue : `#${itemValue}`;

    if (!newFilters[filterKey]) {
      newFilters[filterKey] = [];
    }

    if (isFiltered) {
      // Remove both possible formats
      newFilters[filterKey] = newFilters[filterKey].filter(
        (val) => val !== colorValue && val !== itemValue,
      );
      if (newFilters[filterKey].length === 0) {
        delete newFilters[filterKey];
      }
    } else {
      newFilters[filterKey] = [...(newFilters[filterKey] || []), colorValue];
    }
  } else {
    // For other filters, toggle the value
    if (!newFilters[filterKey]) {
      newFilters[filterKey] = [];
    }

    if (isFiltered) {
      newFilters[filterKey] = newFilters[filterKey].filter(
        (val) => val !== itemValue,
      );
      if (newFilters[filterKey].length === 0) {
        delete newFilters[filterKey];
      }
    } else {
      // Remove parent values if specified
      if (parentValue) {
        newFilters[filterKey] = newFilters[filterKey].filter(
          (val) => !parentValue.includes(val),
        );
      }
      newFilters[filterKey] = [...(newFilters[filterKey] || []), itemValue];
    }
  }

  // Build URL path using utility function
  const pathParams = buildParamsFromFilters(newFilters);
  const basePath = lang
    ? `/${lang}${baseUrlOfFiltersPage}`
    : baseUrlOfFiltersPage;
  const path =
    pathParams.length > 0 ? `${basePath}/${pathParams.join("/")}` : basePath;
  // Preserve the active ?search=/?sort= across the filter toggle so applying a
  // filter narrows the current search instead of clearing it.
  const query = activeQueryString ? `?${activeQueryString}` : "";
  const href = `${path}${query}`;

  return {
    isFiltered,
    href,
  };
}

export function getFilterStateForItemLegacy(
  searchParams: URLSearchParams | any,
  itemValue: string,
  filterKey: string,
  parentValue?: string[],
  lang?: string,
): FilterState {
  // Convert to URLSearchParams if it's an object
  const params =
    searchParams instanceof URLSearchParams
      ? searchParams
      : new URLSearchParams();

  let currentValues: any[] = [];

  // Extract and decode the filter value
  const filterRawValue = params.get
    ? params.get(filterKey)
    : searchParams[filterKey];
  if (filterRawValue) {
    try {
      currentValues =
        typeof filterRawValue === "string"
          ? JSON.parse(decodeURIComponent(filterRawValue))
          : filterRawValue;
    } catch (e) {
      console.error("Error parsing filter values:", e);
      currentValues = [];
    }
  }

  // Check if item is currently filtered
  const isFiltered =
    Array.isArray(currentValues) && currentValues.includes(itemValue);

  // For legacy mode, return search params format
  const newParams = new URLSearchParams(
    params.toString ? params.toString() : "",
  );

  // Handle filter updates the old way
  if (filterKey === "prices") {
    const newValues = isFiltered ? [] : [itemValue];
    if (newValues.length > 0) {
      newParams.set(filterKey, encodeURIComponent(JSON.stringify(newValues)));
    } else {
      newParams.delete(filterKey);
    }
  } else {
    const newValues = isFiltered
      ? currentValues.filter((val) => val !== itemValue)
      : [
          ...currentValues?.filter((val) => !parentValue?.includes(val)),
          itemValue,
        ];

    if (newValues.length > 0) {
      newParams.set(filterKey, encodeURIComponent(JSON.stringify(newValues)));
    } else {
      newParams.delete(filterKey);
    }
  }

  return {
    isFiltered,
    href: `?${newParams.toString()}`,
  };
}
