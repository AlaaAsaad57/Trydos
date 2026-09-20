// Is a chat muted for the signed-in user?
//
// Mute is stored per member, not per channel. Every row in `channel_members`
// carries its own `mute`, and only the row of the signed-in user counts —
// `muteChat` in store/chat/reducer.ts writes exactly that row, and the chat list
// reads it back the same way (components/Chat/pages/ChatLists.js).
//
// The push payload never carries the flag, so everything that reacts to a push
// has to read it from the chat the store already holds. Two places do:
//
//   - utils/NotificationHandler.ts — the new-message toast
//   - components/Chat/components/CallComponent.jsx — the ringing sound
//
// Ids arrive as numbers from the store and as strings from the push, so both
// sides are compared as text. `mute` arrives as 1 or "1" for the same reason.
export const isChannelMutedForMe = (
  channel: any,
  myUserId: any,
): boolean => {
  if (!channel || myUserId === undefined || myUserId === null) return false;

  const myMembership = channel.channel_members?.find(
    (member: any) => String(member?.user_id) === String(myUserId),
  );

  return parseInt(myMembership?.mute) === 1;
};
