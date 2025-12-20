import { treaty } from "@elysiajs/eden";
import { app } from "./elysiaApp";
import type { AppType } from "./elysiaApp";

export const api =
  typeof window === "undefined"
    ? treaty(app).api // Server: Direct code execution (no URL)
    : treaty<AppType>("/").api;
