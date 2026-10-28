import { beforeEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAppStore } from "store";
import { useShellData } from "components/DemoApp1/useShellData";

const MEDIA = "https://media.test";

const newMessage = {
  message_type: { name: "TextMessage" },
  sender_user_id: 2,
  message_status: [{ user_id: 1, is_watched: false }],
  auth_message_status: { delete_for_all: false },
};

const reset = () =>
  useAppStore.setState({
    localCart: [],
    data: [],
    userProfile: null,
    user: null,
    userChat: { id: 1 },
  } as any);

describe("useShellData", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_MEDIA_URL = MEDIA;
    reset();
  });

  it("empty store gives zero counts, no photo and not verified", () => {
    const { result } = renderHook(() => useShellData());
    expect(
      result.current,
      "an empty store should give {0, 0, null, false}",
    ).toEqual({ cartCount: 0, unreadChats: 0, photo: null, phoneVerified: false });
  });

  it("cartCount is the length of the store field localCart", () => {
    useAppStore.setState({ localCart: [{ item_id: 1 }, { item_id: 2 }] } as any);
    const { result } = renderHook(() => useShellData());
    expect(
      result.current.cartCount,
      "cartCount should be 2 for two lines in store.localCart",
    ).toBe(2);
  });

  it("unreadChats counts the chats in store.data that have a new message", () => {
    useAppStore.setState({
      data: [
        { id: 10, messages: [newMessage] },
        { id: 11, messages: [] },
      ],
    } as any);
    const { result } = renderHook(() => useShellData());
    expect(
      result.current.unreadChats,
      "unreadChats should be 1 for one chat with a new message in store.data",
    ).toBe(1);
  });

  it("photo is the URL of store.userProfile.image", () => {
    useAppStore.setState({
      userProfile: { image: "https://cdn.test/me.jpg" },
    } as any);
    const { result } = renderHook(() => useShellData());
    expect(
      result.current.photo,
      "photo should be the URL of store.userProfile.image",
    ).toBe("https://cdn.test/me.jpg");
  });

  it("phoneVerified is false for the phone \"0\" in store.userProfile", () => {
    useAppStore.setState({ userProfile: { phone: "0" } } as any);
    const { result } = renderHook(() => useShellData());
    expect(
      result.current.phoneVerified,
      "phone \"0\" is the guest sentinel, so phoneVerified should be false",
    ).toBe(false);
  });

  it("phoneVerified is true for a valid phone in store.userProfile", () => {
    useAppStore.setState({ userProfile: { phone: "+963944123456" } } as any);
    const { result } = renderHook(() => useShellData());
    expect(
      result.current.phoneVerified,
      "a valid phone in store.userProfile should make phoneVerified true",
    ).toBe(true);
  });
});
