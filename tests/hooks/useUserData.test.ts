import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useUserData } from "hooks/useUserData";
import { useAppStore } from "store";
import { fetchAuthMe } from "utils/authMe";

vi.mock("utils/authMe", () => ({
  fetchAuthMe: vi.fn(async () => null),
}));

describe("useUserData hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAuthMe).mockResolvedValue(null);
    useAppStore.setState({
      userProfile: null,
      userChat: null,
      userStories: null,
      userWallet: null,
    });
  });

  it("returns store userProfile when all store data is available", () => {
    const storeProfile = { id: 1, name: "Alice" } as any;
    const storeChat = { id: 1 } as any;
    const storeStories = { id: 1 } as any;
    const storeWallet = { firstName: "Alice", lastName: "Smith", phone: "123" } as any;

    useAppStore.setState({
      userProfile: storeProfile,
      userChat: storeChat,
      userStories: storeStories,
      userWallet: storeWallet,
    });

    const initialData = {
      userData: { id: 2, name: "Bob" } as any,
      userChat: null,
      userStories: null,
      userWallet: null,
    };

    const { result } = renderHook(() => useUserData({ initialUserData: initialData }));
    expect(result.current.userData, "should prefer store userProfile over initialUserData").toEqual(storeProfile);
  });

  it("falls back to serverData/initialUserData when store data is null", () => {
    const initialData = {
      userData: { id: 2, name: "Bob" } as any,
      userChat: { id: 2 } as any,
      userStories: null,
      userWallet: null,
    };

    const { result } = renderHook(() => useUserData({ initialUserData: initialData }));
    expect(result.current.userData, "should fallback to initialUserData userData").toEqual(initialData.userData);
    expect(result.current.userChat, "should fallback to initialUserData userChat").toEqual(initialData.userChat);
  });

  it("fetches /api/auth/me when store profile is null and updates serverData", async () => {
    vi.mocked(fetchAuthMe).mockResolvedValueOnce({
      user: { id: 10, name: "Charlie" } as any,
      chatUser: { id: 10 } as any,
      storiesUser: null,
      walletUser: null,
      hasMarketToken: true,
    });

    const initialData = {
      userData: null,
      userChat: null,
      userStories: null,
      userWallet: null,
    };

    const { result } = renderHook(() => useUserData({ initialUserData: initialData }));

    await waitFor(() => {
      expect(result.current.userData, "userData should update from fetchAuthMe").toEqual({ id: 10, name: "Charlie" });
    });
  });
});
