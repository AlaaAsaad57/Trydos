import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { beforeAll, vi } from "vitest";
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
  vi.mock("react-mount-animation");
  // vi.mock("react-mount-animation", () => {
  // vi.mock("react-mount-animation", () => ({
  //   Animation: (props) => {
  //     props.onExited();
  //     return { props };
  //   },
  // }));
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
screen.debug();
afterEach(() => {
  vi.resetAllMocks();
});
