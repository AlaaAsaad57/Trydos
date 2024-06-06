import { vi } from "vitest";

export const usePhoneNumber = vi.fn().mockImplementation(() => ({
  validNumber: false,
  setValidNumber: vi.fn(),
}));
