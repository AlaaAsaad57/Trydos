import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { beforeAll, vi } from "vitest";
import MockReactMountAnimation from "./helpers/mockReactMountAnimation";
beforeAll(() => {
  vi.mock("next/headers", async () => {
    return {
      cookies: () => {
        return {
          get: (name: string) => {
            return {
              value: "cookie",
            };
          },
        };
      },
    };
  });
  vi.mock("next/navigation", () => ({
    useRouter() {
      return {
        prefetch: () => null,
      };
    },
    usePathname() {
      return {
        prefetch: () => null,
      };
    },
    useParams() {
      return {
        prefetch: () => null,
      };
    },
  }));
});
vi.mock("react-mount-animation", async () => MockReactMountAnimation);

screen.debug();
afterEach(() => {
  vi.resetAllMocks();
});
