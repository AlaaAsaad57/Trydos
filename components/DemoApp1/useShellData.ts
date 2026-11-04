"use client";

import { useAppStore } from "store";
import { getNew } from "components/Chat/chatsFunctions";
import { GetImageUrl } from "utils/tinyUtils";
import { isValidPhone } from "utils/phone";

// The real numbers and photo the bottom bar shows.
// One selector per field, so a change in one field does not redraw for the others.
export const useShellData = (): {
  cartCount: number;
  unreadChats: number;
  photo: string | null;
  phoneVerified: boolean;
} => {
  const localCart = useAppStore((s) => s.localCart);
  const chats = useAppStore((s) => s.data);
  const userProfile = useAppStore((s) => s.userProfile);
  const user = useAppStore((s) => s.user);
  const userChat = useAppStore((s) => s.userChat);

  // Same rule as VerifyUser.tsx. `is_phone_verified` is not used because
  // register-guest resets it to 0.
  const phone = userProfile?.phone ?? user?.phone;

  // The count also depends on the chat sign-in. getNew reads it with
  // getState(), which the React Compiler cannot see. So userChat is used here.
  // No chat account means no unread chats.
  const unreadChats = userChat?.id ? getNew(chats ?? []).length : 0;

  return {
    cartCount: localCart?.length ?? 0,
    unreadChats,
    photo: userProfile?.image ? GetImageUrl(userProfile.image) || null : null,
    phoneVerified: isValidPhone(phone),
  };
};
