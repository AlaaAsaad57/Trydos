"use client";

import { createContext, useContext } from "react";
import type { ChatAction, ChatState } from "./chatModel";

/**
 * What the chat screens get from the chat: its state and what they can do.
 *
 * Two providers fill it. On `/demo` the mock provider does
 * (components/DemoApp/demoChatState.tsx). In the app the real chat data does.
 * The screens read it with `useChat()` and never know which one runs.
 */
export type ChatApi = {
  state: ChatState;
  dispatch: (action: ChatAction) => void;
  /** Sends a text I typed, answering `replyTo` when given. */
  sendText: (chat: string, text: string, replyTo?: { id: string; text: string }) => void;
  /** Sends a picked or taken photo. */
  sendPhoto: (chat: string, file: File) => void;
  /** Sends a recorded voice note and how long it is, in seconds. */
  sendVoice: (chat: string, audio: Blob, seconds: number) => void;
  /** Sends a picked video and how long it is, in seconds (0 when not known). */
  sendVideo: (chat: string, file: File, seconds: number) => void;
  /** Sends any picked file. */
  sendFile: (chat: string, file: File) => void;
  sendLocation: (chat: string, point: { lat: number; lng: number; accuracy?: number }) => void;
  forward: (from: string, id: string, to: string) => void;
  /** Opens the chat with a contact (a new one when there is none) and says which. */
  newChat: (contact: string) => string;
  /**
   * Saves a contact (a name and a full phone number with its country code)
   * and says its id, or null when there is no one to chat with: the number
   * is not on Trydos, or the save failed.
   */
  addContact: (name: string, phone: string) => Promise<string | null>;
  /** I am typing in this chat: the other person sees "Typing…". */
  typing: (chat: string) => void;
  /** A word for the shopper from the chat itself (a reminder that came due), shown by whatever screen is up. */
  notice: string | null;
  /** The conversation opens with its message search up (the contact screen's Search). */
  search: boolean;
  setSearch: (on: boolean) => void;
  /**
   * Loading the chats and the messages a page at a time (the real chat
   * only; the /demo mock holds all of its chats and messages).
   */
  paging?: ChatPaging;
  /** Starts a real call (a video call when `video`); the `/demo` preview has none and opens its mock call. */
  call?: (chat: string, video: boolean) => void;
  /** Old features with no XD board (D-36b), in the real chat only. */
  extras?: ChatExtras;
};

/** One of my reminders, as the reminders sheet lists it. */
export type ChatReminder = {
  id: string;
  /** The chat the message is in, when the backend says. */
  chat: string | null;
  message: string;
  /** The message's words, or its kind ("Photo"). */
  text: string;
  /** Who sent the message. */
  who: string;
  /** When the reminder comes, in ms. */
  at: number;
};

/** A message with a label, as the "Media & Files" sheet lists it. */
export type TaggedLine = { id: string; text: string; time: string };

export type ChatExtras = {
  /** My reminders that have not come yet, soonest first. */
  reminders: readonly ChatReminder[];
  /** Opens the chat at a message (loading both first); false when the chat is nowhere. */
  openMessage: (chat: string | null, message: string) => Promise<boolean>;
  cancelReminder: (reminder: ChatReminder) => void;
  /** The message the conversation should scroll to and flash, once it is loaded. */
  jump: string | null;
  setJump: (message: string | null) => void;
  /** This chat's messages with a label, from the chat backend; null when that failed. */
  tagged: (chat: string, label: string) => Promise<TaggedLine[] | null>;
  /** Saves contacts picked from the phone; only where the browser can read them. */
  syncContacts?: () => Promise<void>;
};

export type ChatPaging = {
  /** The chat backend may hold more chats than the list has loaded. */
  moreChats: boolean;
  /** Loads the list's next page of chats. */
  loadMoreChats: () => void;
  /** This chat may hold older messages than the ones loaded. */
  moreOlder: (chat: string) => boolean;
  /** Loads the page of messages before the oldest loaded one. */
  loadOlder: (chat: string) => void;
};

/** How long a notice stays, in ms. */
export const NOTICE_MS = 3200;

export const ChatContext = createContext<ChatApi | null>(null);

export function useChat(): ChatApi {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChat must be used inside a chat provider");
  return value;
}
