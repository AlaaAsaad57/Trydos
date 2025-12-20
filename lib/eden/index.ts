import { treaty } from "@elysiajs/eden";
import type { AppType } from "../../app/api/[[...slugs]]/route";

export const api = treaty<AppType>("loclhost:3000/api");
