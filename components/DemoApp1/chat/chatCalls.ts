import { getChatName, getChatPeer, getChatPhoto } from "components/Chat/chatsFunctions";
import { useAppStore } from "store";
import { makeVideoCall, makeVoiceCall } from "store/chat/callActions";
import { LogError, translateFunction } from "utils/functions";
import { showErrorNotification } from "store/notifications/reducer";
import { findChannel } from "./chatActions";

/**
 * Starts a call from the new chat screens. Stage 6, step 5.
 *
 * The same call as the old chat header (components/Chat/components/
 * ChatHeader.tsx): `makeVoiceCall` / `makeVideoCall` with the chat's name,
 * photo and the other person's phone. An order chat sends its private
 * payload. When the chat backend answers with a token, the store holds the
 * call (`call`, `AgoraToken`), and the app opens the call page (AuthSections).
 *
 * Nothing starts while a call is on its way, ringing in, or running.
 */
export async function startCall(chatId: string, video: boolean): Promise<void> {
  const { callLoading, isCallIncoming, call } = useAppStore.getState();
  if (callLoading || isCallIncoming || call) return;
  const chat = findChannel(chatId);
  if (!chat) return;
  // One of us blocked the other: no calls, as the old chat header said.
  if (chat.channel_members?.some((m) => m.is_blocked === 1)) {
    showErrorNotification(translateFunction("You cannot send messages or calls to this user"));
    return;
  }
  const peer = getChatPeer(chat);
  const privatePayload = chat.order_chat_participant_id
    ? { order_chat_participant_id: chat.order_chat_participant_id, receiver_user_id: peer?.user_id, is_private: true }
    : null;
  const start = video ? makeVideoCall : makeVoiceCall;
  try {
    await start(chat.id, getChatName(chat), getChatPhoto(chat), peer?.user?.mobile_phone, privatePayload);
  } catch (error) {
    // The call actions already told the shopper why (the camera or the
    // microphone is not allowed).
    LogError({
      scenario: "startCall: the call could not start (new chat screens)",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
