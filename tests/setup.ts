import "@testing-library/jest-dom";
import { cleanup, screen } from "@testing-library/react";
import { beforeAll, vi } from "vitest";
import MockReactMountAnimation from "./helpers/mockReactMountAnimation";

beforeAll(() => {
  // vi.mock("services/auth");
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
        split: () => [],
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

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});
screen.debug();
afterEach(() => {
  vi.resetAllMocks();
  cleanup();
});
afterEach(() => {});
