import {
  ARCHIVE_CHANNEL_URL,
  CANCEL_REMINDER_URL,
  DELETE_CHAT_URL,
  EDIT_MESSAGE_URL,
  MESSAGE_REMINDERS_URL,
  MESSAGE_TAGS_URL,
  MY_REMINDERS_URL,
  SEARCH_CONTACTS_URL,
  SEND_MESSAGE_URL,
  SET_CHANNEL_OPT_UTL,
  UNREAD_CHANNEL_URL,
} from "utils/endpointConfig";
import { useAppStore } from "store";
import chat from "services/chat";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { LogError, translateFunction } from "utils/functions";
import { showErrorNotification } from "store/notifications/reducer";

import UPDATED_API_DATA from "migration.staging";

export const GetLastSeen = async (chatId, friendID) => {
  const { setServerTime, setIsTyping } = useAppStore.getState();
  try {
    const { onValue, ref } = await import("firebase/database");
    const { getDb } = await import("../../utils/firebaseInitv1");
    const db = await getDb();
    let server_time;

    let response = await fetchData({
      url: "/api/v1/channels/get_date_time",
      reqTitle: REQUESTS_DATA.GET_LAST_SEEN,
      method: UPDATED_API_DATA.MOD_DATE_TIME_METHOD as any,

      // ###EDIT###
      // method: "GET",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    server_time = response.data;
    setServerTime(response.data);
    const dbRef = ref(db, `ConnectStatus/${friendID.toString()}`);
    onValue(dbRef, async (snapshot) => {
      const desc = snapshot.val();

      if (!!desc) {
        if (typeof desc === "string") {
          let date = desc;
          setIsTyping({ id: chatId.toString(), date: date });
        } else {
          const { showDate } = await import("components/Chat/chatsFunctions");
          let date =
            Object.keys(desc).length > 0 &&
            showDate(desc[Object.keys(desc)[0]]);
          setIsTyping({
            id: chatId.toString(),
            desc: Object.keys(desc).length > 0 ? date : null,
          });
        }
      } else {
        setIsTyping({ id: chatId.toString(), desc: null, date: null });
      }
    });
  } catch (error) {
    LogError({
      scenario: "Error in GetLastSeen in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
export const setLastSeen = async (MyId) => {
  const { setServerTime } = useAppStore.getState();
  try {
    const { push, ref, set } = await import("firebase/database");
    let server_time;
    let response = await fetchData({
      url: "/api/v1/channels/get_date_time",
      reqTitle: REQUESTS_DATA.GET_LAST_SEEN,
      method: UPDATED_API_DATA.MOD_DATE_TIME_METHOD as any,
      // ###EDIT###
      // method: "GET",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    server_time = response.data;
    setServerTime(response.data);
    const { getDb } = await import("../../utils/firebaseInitv1");
    const db = await getDb();
    push(ref(db, `ConnectStatus/${MyId.toString()}`));
    set(ref(db, `ConnectStatus/${MyId.toString()}`), server_time)
      .then(() => {
        // Success.
      })
      .catch((error) => {
        LogError(error);
      });
  } catch (error) {
    LogError({
      scenario: "Error in setLastSeen in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const SendMessage = async (payload, isNew, isPrivate?) => {
  const { sendNewMessage, sendRealMessage, deleteErrorMessage } =
    useAppStore.getState();
  let message = isPrivate
    ? {
        ...payload,
        order_chat_participant_id: isPrivate,
      }
    : payload;

  try {
    let response = await fetchData({
      url: SEND_MESSAGE_URL,
      body: JSON.stringify(message),
      reqTitle: REQUESTS_DATA.SEND_MESSAGE,
      method: "POST",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    if (response?.data?.id) {
      if (isNew) {
        // The chat list comes in pages, so the chat the backend put this
        // message into may not be loaded yet. Then only the new message would
        // show, so ask for the ones before it.
        const loaded = useAppStore
          .getState()
          .data?.some(
            (c: any) => String(c.id) === String(response.data.channel_id),
          );
        sendNewMessage({
          channel: {
            id: response.data.channel_id,
            messages: [{ ...response.data }],
            mid: isNew,
          },
        });
        if (!loaded) await getPage(response.data.channel_id, response.data.id);
      } else {
        sendRealMessage({
          ...response.data,
          mid: payload.mid,
          cid: payload.cid,
          isPrivate: isPrivate,
        });
      }
    }
  } catch (error) {
    deleteErrorMessage({ msg_id: payload.mid, ch_id: payload.cid });
    showErrorNotification(translateFunction("Failed to send message"));
    LogError({
      scenario: "Error in SendMessage in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
export async function watchChannel(payload) {
  try {
    let response = await fetchData({
      url: `/api/v1/channels/${payload}/watched`,
      reqTitle: REQUESTS_DATA.WATCH_CHANNEL,
      method: "GET",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
  } catch (error) {
    LogError({
      scenario: "Error in watchChannel in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function DeleteMessageApi(msg_id, bool) {
  await fetchData({
    url: "/api/v1/messages/destroy",
    body: JSON.stringify({ id: msg_id, delete_for_all: bool ? 1 : 0 }),
    reqTitle: REQUESTS_DATA.DELETE_MESSAGE,
    method: "POST",
    server: "chat",
  });
}
export async function deleteChat(payload) {
  try {
    await fetchData({
      url: DELETE_CHAT_URL,
      body: JSON.stringify({ id: payload }),
      reqTitle: REQUESTS_DATA.DELETE_CHANNEL,
      method: "POST",
      server: "chat",
    });
  } catch (error) {
    LogError({
      scenario: "Error in deleteChat in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
export async function Recive(payload) {
  try {
    let response = await fetchData({
      url: `/api/v1/channels/${payload}/received`,
      reqTitle: REQUESTS_DATA.RECIEIVE_CHANNEL,
      method: "GET",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
  } catch (error) {
    LogError({
      scenario: "Error in Recive in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
export async function getPage(channel, mid) {
  const { setPageData } = useAppStore.getState();
  try {
    let channel_id = channel;

    let response = await fetchData({
      url: `/api/v1/messages/messages_of_channel/${channel_id}?message_id=${mid}&limit=10`,
      reqTitle: REQUESTS_DATA.GET_MESSAGES_OF_CHANNEL,
      method: "POST",
      server: "chat",

      // ###EDIT###
      // body: {},
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    setPageData({ mes: response.data, ch: channel_id });
  } catch (error) {
    LogError({
      scenario: "Error in getMessagesBetweenMessage in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
export async function SearchContact(payload) {
  const { setChatSearchResults } = useAppStore.getState();

  try {
    if (payload?.length > 0) {
      let response = await fetchData({
        url: SEARCH_CONTACTS_URL + encodeURIComponent(payload),
        reqTitle: REQUESTS_DATA.SEARCH_MESSAGE,
        method: "GET",
        server: "chat",
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      setChatSearchResults(response.data);
    }
  } catch (error) {
    LogError({
      scenario: "Error in SearchContact in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
export async function PinnChat(payload) {
  try {
    const response = await fetchData({
      url: SET_CHANNEL_OPT_UTL,
      body: JSON.stringify({
        channel_id: payload.id,
        id: payload?.member_id,
        pin: payload.value ? 1 : 0,
      }),
      reqTitle: REQUESTS_DATA.PIN_CHANNEL,
      method: "POST",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
  } catch (e) {
    LogError({ scenario: "chat store action failed", error: e });
  }

  chat.getChats(true);
}
export async function MuteChat(payload) {
  try {
    const response = await fetchData({
      url: SET_CHANNEL_OPT_UTL,
      body: JSON.stringify({
        channel_id: payload.id,
        id: payload?.member_id,
        mute: payload.value ? 1 : 0,
      }),
      reqTitle: REQUESTS_DATA.MUTE_CHANNEL,
      method: "POST",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
  } catch (error) {
    LogError({
      scenario: "Error in MuteChat in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
export const getMessagesBetweenTwoMessages = async ({
  first,
  second,
  channel_id,
}) => {
  const { setPageData } = useAppStore.getState();
  let response = await fetchData({
    url: `/api/v1/messages/get_all_messages_between_two_messages`,
    reqTitle: REQUESTS_DATA.GET_MESSAGES_OF_CHANNEL,
    method: "POST",
    server: "chat",
    body: JSON.stringify({
      channel_id: channel_id,
      first_message_id: first,
      second_message_id: second,
    }),
  });

  if (!response.success) {
    throw new Error(response.message);
  }
  setPageData({ mes: response.data, ch: channel_id });
};

export async function getContacts() {
  const { setContacts } = useAppStore.getState();
  try {
    let response = await fetchData({
      url: "/api/v1/users/my_contacts",
      reqTitle: REQUESTS_DATA.GET_CONTACTS,
      method: UPDATED_API_DATA.MOD_CONTACTS_METHOD as any,
      // ###EDIT###
      // method: "GET",
      server: "chat",
    });
    // @ts-ignore
    if (!response.success) {
      throw new Error(response.message);
    }
    setContacts(response.data);
  } catch (error) {
    LogError({
      scenario: "Error in getContacts in  chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
export const getMedia = async (id, media) => {
  // A `ch-<user id>` chat is a placeholder with no channel on the backend yet.
  if (typeof id === "string" && id.includes("ch")) return;
  const { editChatInfoMedia } = useAppStore.getState();
  try {
    let response = await fetchData({
      url: `/api/v1/messages/messages_of_channel/${id}?limit=10&message_type=${media}`,
      reqTitle: REQUESTS_DATA.GET_MEDIA_FOR_A_CHANNEL,
      body: JSON.stringify({
        limit: 10,
        message_type: media,
      }),
      method: "POST",
      server: "chat",

      // ###EDIT###
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    editChatInfoMedia({ id: id, data: response.data, media: media });
  } catch (e) {
    LogError({
      scenario: "Error in getMedia in  chat/actions",
      error: e instanceof Error ? e.message : String(e),
    });
  }
};
export const getMediaReducer = (media, data) => {
  if (media === "ImageMessage") {
    return { image_messages: data };
  }
  if (media === "VideoMessage") {
    return { video_messages: data };
  }
  if (media === "FileMessage") {
    return { file_messages: data };
  }
};

export const GetChatDetails = async (id) => {
  // A `ch-<user id>` chat is a placeholder with no channel on the backend yet.
  if (typeof id === "string" && id.includes("ch")) return;
  const { editChatInfo } = useAppStore.getState();
  try {
    let response = await fetchData({
      url: UPDATED_API_DATA.MOD_MEDIA_CHAT_URL.replace("__", `${id}`),
      reqTitle: REQUESTS_DATA.GET_CHANNEL_DATA,
      method: "GET",
      server: "chat",
    });
    if (!response.success) {
      throw new Error(response.message);
    }
    editChatInfo({ id: id, data: response.data });
  } catch (e) {
    LogError({
      scenario: "Error in GetChatDetails in  chat/actions",
      error: e instanceof Error ? e.message : String(e),
    });
  }
};

/* ------------------------------------------------------------------------ */
/* Message edit, tags and reminders; chat archive and unread.               */
/*                                                                          */
/* Every call below passes `noMessage: true`. The chat backend answers in   */
/* English ("Channel archived successfully"), and fetchData would show that */
/* text as a toast. The caller shows its own translated text instead.       */
/* ------------------------------------------------------------------------ */

export type MessageTag = "urgent" | "important" | "todo" | "done";

/** The fixed tag list, in the order the tag picker shows it. */
export const MESSAGE_TAGS: MessageTag[] = [
  "urgent",
  "important",
  "todo",
  "done",
];

/**
 * Change the text of my own text message.
 *
 * The backend answers with the whole message after the edit, and that
 * message replaces the one in the store — except its `reminder`, which the
 * store keeps. Answers `true` when the edit was saved.
 */
export async function EditMessageApi(
  channelId: string | number,
  messageId: string | number,
  content: string,
): Promise<boolean> {
  const { patchMessage } = useAppStore.getState();
  try {
    const response = await fetchData({
      url: EDIT_MESSAGE_URL,
      body: JSON.stringify({ id: String(messageId), content }),
      reqTitle: REQUESTS_DATA.EDIT_MESSAGE,
      method: "POST",
      server: "chat",
      noMessage: true,
    });
    if (!response.success || !response.data) {
      throw new Error(response.message || "the edit returned no message");
    }
    const { reminder, ...edited } = response.data;
    patchMessage({ ch_id: channelId, msg_id: messageId, patch: edited });
    return true;
  } catch (error) {
    showErrorNotification(translateFunction("Failed to edit the message"));
    LogError({
      scenario: "Error in EditMessageApi in chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Add or remove one tag of the fixed list on a message. The backend answers
 * with the full tag list after the change, and the store takes that list.
 */
export async function ToggleMessageTag(
  channelId: string | number,
  messageId: string | number,
  tag: MessageTag,
): Promise<boolean> {
  const { patchMessage } = useAppStore.getState();
  try {
    const response = await fetchData({
      url: MESSAGE_TAGS_URL(messageId),
      body: JSON.stringify({ tag, action: "toggle" }),
      reqTitle: REQUESTS_DATA.TAG_MESSAGE,
      method: "POST",
      server: "chat",
      noMessage: true,
    });
    if (!response.success || !Array.isArray(response.data?.tags)) {
      throw new Error(
        response.message || "the tag change returned no tag list",
      );
    }
    patchMessage({
      ch_id: channelId,
      msg_id: messageId,
      patch: { tags: response.data.tags },
    });
    return true;
  } catch (error) {
    showErrorNotification(translateFunction("Failed to update the tag"));
    LogError({
      scenario: "Error in ToggleMessageTag in chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Create a reminder on a message, or move the time of the one it has. The
 * backend keeps one active reminder per message and user, and keeps its id
 * when the time moves, so the answer replaces the reminder in the store.
 */
export async function SetMessageReminder(
  channelId: string | number,
  messageId: string | number,
  remindAt: Date,
): Promise<boolean> {
  const { patchMessage } = useAppStore.getState();
  try {
    const response = await fetchData({
      url: MESSAGE_REMINDERS_URL(messageId),
      body: JSON.stringify({ remind_at: remindAt.toISOString() }),
      reqTitle: REQUESTS_DATA.SET_MESSAGE_REMINDER,
      method: "POST",
      server: "chat",
      noMessage: true,
    });
    if (!response.success || !response.data?.id) {
      throw new Error(response.message || "the reminder returned no id");
    }
    const { id, remind_at, created_at } = response.data;
    patchMessage({
      ch_id: channelId,
      msg_id: messageId,
      patch: { reminder: { id, remind_at, created_at } },
    });
    // The Reminders folder shows the message text and sender too, which this
    // answer does not carry. Reload the list rather than guess them.
    GetMyReminders();
    return true;
  } catch (error) {
    showErrorNotification(translateFunction("Failed to set the reminder"));
    LogError({
      scenario: "Error in SetMessageReminder in chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/** Cancel a reminder. The backend takes the reminder id, not the message id. */
export async function CancelMessageReminder(
  channelId: string | number,
  messageId: string | number,
  reminderId: string | number,
): Promise<boolean> {
  const { patchMessage, removeReminder } = useAppStore.getState();
  try {
    const response = await fetchData({
      url: CANCEL_REMINDER_URL(reminderId),
      reqTitle: REQUESTS_DATA.CANCEL_MESSAGE_REMINDER,
      method: "DELETE",
      server: "chat",
      noMessage: true,
    });
    // 404: the reminder is gone already. It fired while this tab missed the
    // push, or another device cancelled it. Either way the goal is met.
    if (!response.success && response.httpStatus !== 404) {
      throw new Error(response.message || "the reminder was not cancelled");
    }
    patchMessage({
      ch_id: channelId,
      msg_id: messageId,
      patch: { reminder: null },
    });
    removeReminder(reminderId);
    return true;
  } catch (error) {
    showErrorNotification(translateFunction("Failed to cancel the reminder"));
    LogError({
      scenario: "Error in CancelMessageReminder in chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/** My reminders that have not fired yet, soonest first. */
export async function GetMyReminders() {
  const { setReminders } = useAppStore.getState();
  try {
    const response = await fetchData({
      url: MY_REMINDERS_URL,
      reqTitle: REQUESTS_DATA.GET_MESSAGE_REMINDERS,
      method: "GET",
      server: "chat",
      noMessage: true,
    });
    if (!response.success) {
      throw new Error(response.message || "the reminders were not loaded");
    }
    setReminders(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    LogError({
      scenario: "Error in GetMyReminders in chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Archive or unarchive a chat. Archiving is personal: it hides the chat from
 * my list only. The store moves the chat between the main list and the
 * archived list once the backend agrees.
 */
export async function ArchiveChannel(
  channelId: string | number,
  archived: boolean,
): Promise<boolean> {
  const { archiveChat } = useAppStore.getState();
  try {
    const response = await fetchData({
      url: ARCHIVE_CHANNEL_URL(channelId),
      // A number, not a boolean: the backend refuses the string "false".
      body: JSON.stringify({ archived: archived ? 1 : 0 }),
      reqTitle: REQUESTS_DATA.ARCHIVE_CHANNEL,
      method: "POST",
      server: "chat",
      noMessage: true,
    });
    if (!response.success) {
      throw new Error(response.message || "the archive change was not saved");
    }
    archiveChat({ id: channelId, archived });
    return true;
  } catch (error) {
    showErrorNotification(
      archived
        ? translateFunction("Failed to archive the chat")
        : translateFunction("Failed to unarchive the chat"),
    );
    LogError({
      scenario: "Error in ArchiveChannel in chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Mark a chat as unread. The backend sets its unread counter to at least 1
 * and tells nobody. Opening the chat (`/watched`) marks it read again.
 */
export async function MarkChannelUnread(
  channelId: string | number,
): Promise<boolean> {
  const { setUnreadChat } = useAppStore.getState();
  try {
    const response = await fetchData({
      url: UNREAD_CHANNEL_URL(channelId),
      reqTitle: REQUESTS_DATA.UNREAD_CHANNEL,
      method: "POST",
      server: "chat",
      noMessage: true,
    });
    if (!response.success) {
      throw new Error(response.message || "the unread mark was not saved");
    }
    setUnreadChat({ id: channelId, value: true });
    return true;
  } catch (error) {
    showErrorNotification(
      translateFunction("Failed to mark the chat as unread"),
    );
    LogError({
      scenario: "Error in MarkChannelUnread in chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/** The chats I archived: `my_channels` returns only those when `archived` is true. */
export async function GetArchivedChats() {
  const { setArchivedChats } = useAppStore.getState();
  try {
    const response = await fetchData({
      url: UPDATED_API_DATA.MOD_CHAT_URL,
      body: JSON.stringify({ limit: 50, messages_limit: 10, archived: true }),
      reqTitle: REQUESTS_DATA.GET_ARCHIVED_CHATS,
      method: "POST",
      server: "chat",
      noMessage: true,
    });
    if (!response.success) {
      throw new Error(response.message || "the archived chats were not loaded");
    }
    setArchivedChats([
      ...(response.data?.pinned_channels ?? []),
      ...(response.data?.channels ?? []),
    ]);
  } catch (error) {
    LogError({
      scenario: "Error in GetArchivedChats in chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** The messages of one chat that carry a tag, newest first. */
export async function GetTaggedMessages(
  channelId: string | number,
  tag: MessageTag,
): Promise<any[] | null> {
  try {
    const response = await fetchData({
      url: `/api/v1/messages/messages_of_channel/${channelId}`,
      body: JSON.stringify({ limit: 50, tag }),
      reqTitle: REQUESTS_DATA.GET_MESSAGES_OF_CHANNEL,
      method: "POST",
      server: "chat",
      noMessage: true,
    });
    if (!response.success) {
      throw new Error(
        response.message || "the tagged messages were not loaded",
      );
    }
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    LogError({
      scenario: "Error in GetTaggedMessages in chat/actions",
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
