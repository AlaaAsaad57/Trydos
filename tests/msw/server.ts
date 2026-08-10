// The fake network itself.
//
// One server for the whole test run. tests/setup.ts starts it before any test,
// resets it between tests, and stops it at the end — so a test file never has
// to do that for itself, and one test can never leave a reply behind for the
// next one.
//
// It runs in Node, not in a browser: msw hooks into the request layer directly,
// so there is no service worker and no file in public/. That is why the
// package's install script is not needed here.
//
// TO CHANGE A REPLY FOR ONE TEST
//
//   import { server } from "tests/msw/server";
//   import { proxyRoute } from "tests/msw/handlers";
//   import { HttpResponse } from "msw";
//
//   it("shows the empty cart message", async () => {
//     server.use(
//       proxyRoute("/cart/cart_shipping", () =>
//         HttpResponse.json({ success: true, data: { cart: [] } }),
//       ),
//     );
//     …
//   });
//
// Anything added with `server.use()` goes to the front of the queue and is
// thrown away again after that test.
import { setupServer } from "msw/node";

import { handlers } from "./handlers";

export const server = setupServer(...handlers);
