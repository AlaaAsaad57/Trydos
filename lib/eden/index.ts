import { treaty } from "@elysiajs/eden";
import type { AppType } from "../../app/api/[[...slugs]]/elysiaApp";

export const { api } = treaty<AppType>("http://localhost:3000/api");
