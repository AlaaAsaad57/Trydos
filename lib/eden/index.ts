// lib/eden.ts
import { treaty } from "@elysiajs/eden";
// ✅ normal import
import { app as serverApp } from "../../app/api/[[...slugs]]/route";
import type { AppType } from "../../app/api/[[...slugs]]/route";
export const api =
  typeof window === "undefined"
    ? treaty(serverApp).api // server: direct call
    : treaty<AppType>("http://localhost:3000").api; // client: fetch
