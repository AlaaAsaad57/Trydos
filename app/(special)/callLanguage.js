import { cookies } from "next/headers";

// The call screens have no `[lang]` segment in their address: the mobile app
// opens them directly. The only language signal is the `lang` cookie the proxy
// writes on every storefront visit. With no request, or no cookie, the screen
// is English.
export async function callScreenLanguage() {
  try {
    return (await cookies()).get("lang")?.value || "en";
  } catch {
    return "en";
  }
}
