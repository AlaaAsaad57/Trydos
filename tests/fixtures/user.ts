// Builder for a user.
//
// Where the shape comes from (C-5): the `UserData` interface in
// utils/cookies/cookie-manager.ts — the profile JSON the app keeps in the
// `User-Data` cookie. The type comes in through `import type`, which the
// compiler removes, so no production module is loaded here.
//
// Every value below is an obviously fake constant. Nothing is copied from a
// real session, a real response, or a real person: the token says it is a test
// token, the phone is all zeroes, and the address is on example.com, a domain
// reserved for exactly this.
import type { UserData } from "utils/cookies/cookie-manager";

export function buildUser(overrides: Partial<UserData> = {}): UserData {
  return {
    id: 1,
    name: "Test User",
    phone: "+10000000000",
    is_phone_verified: 1,
    expired_at: "2030-01-01T00:00:00.000Z",
    access_token: "test-market-token",
    image: "/user/test-user.png",
    email: "test-user@example.com",
    ...overrides,
  };
}
