// lib/eden.ts
import { treaty } from "@elysiajs/eden";
import { app as APP } from "../../app/api/[[...slugs]]/route"; // ✅ normal import

export const api =
  typeof window === "undefined"
    ? treaty(APP).api // server: direct call
    : treaty<typeof APP>("http://localhost:3000").api; // client: fetch
