// Builder for a shipping address.
//
// Where the shape comes from (C-5): `OrderInterface["shipping_address_data"]`
// in utils/types/OrderInterface.ts. Taking the type straight off the order
// means the address builder can never drift away from the order builder. The
// type comes in through `import type`, which the compiler removes, so no
// production module is loaded here.
//
// The phone numbers are all zeroes and the address is invented — nothing here
// belongs to a real person.
import type { OrderInterface } from "utils/types/OrderInterface";

export type ShippingAddress = OrderInterface["shipping_address_data"];

export function buildAddress(
  overrides: Partial<ShippingAddress> = {},
): ShippingAddress {
  return {
    id: 1,
    country_iso: "gb",
    customer_id: 1,
    contact_person_name: "Test User",
    address_type: "home",
    address: "1 Test Street",
    address_detail: "Flat 1",
    country: "United Kingdom",
    province: "Test Province",
    city: "Test City",
    town: "Test Town",
    street: "Test Street",
    building: "1",
    zip: "00000",
    phone: "+10000000000",
    alternative_phone: "+10000000001",
    created_at: "2030-01-01T00:00:00.000Z",
    updated_at: "2030-01-01T00:00:00.000Z",
    latitude: null,
    longitude: null,
    is_billing: 0,
    is_default: 1,
    email: "test-user@example.com",
    cost: 0,
    duration: null,
    ...overrides,
  };
}
