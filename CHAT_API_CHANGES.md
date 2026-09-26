# API Changes — Requests & DTOs Reference

A short reference for every new or modified request. The full explanation is in `CHAT_NEW_FEATURES.md`.

- Every request needs `Authorization: Bearer <token>`.
- Every response uses the usual envelope; the DTO written below is the content of `data`:

```ts
{ isSuccessful: boolean; hasContent: boolean; code: number; message: string | null; detailed_error: any; data: T }
```

- Any extra body field not listed here returns 400.

---

## Shared DTOs

```ts
type MessageTag = 'urgent' | 'important' | 'todo' | 'done';

interface MessageTagSummary {
  tag: MessageTag;
  count: number;
  user_ids: number[];      // "did I tag it?" → user_ids.includes(myId)
}

interface MessageReminderInfo {
  id: string;              // reminder ID
  remind_at: string;       // ISO8601
  created_at: string;      // ISO8601
}

// Fields added to the Message object in every response
interface MessageAdditions {
  updated_at: string | null;
  is_edited: 0 | 1;
  tags: MessageTagSummary[];
  reminder: MessageReminderInfo | null;   // personal to the current user
}
```

---

## New requests

### 1. Edit message — `POST /api/v1/messages/update`

Edits the text of a text message. Only the sender can edit.

```ts
// Request body — UpdateMessageDto
{ id: string; content: string }   // content must not be empty

// Response data
Message                           // the full message after the edit
```

Notification to other members: `UpdatingMessageEvent` (see [Notifications](#notifications)).

### 2. Add/remove tag — `POST /api/v1/messages/{messageId}/tags`

Adds or removes a tag from the fixed list. The user must be a member of the channel.

```ts
// Request body — ToggleMessageTagDto
{
  tag: MessageTag;
  action?: 'toggle' | 'add' | 'remove';   // default: toggle
}

// Response data
{
  message_id: string;
  tag: MessageTag;
  action: 'added' | 'removed';
  tags: MessageTagSummary[];              // the full list after the change
}
```

Notification to other members: `UpdatingMessageEvent`.

### 3. Create or update reminder — `POST /api/v1/messages/{messageId}/reminders`

Creates a reminder on a message. If an active reminder already exists for the same message, its time is updated and the `id` stays the same.

```ts
// Request body — CreateMessageReminderDto
{ remind_at: string }   // ISO8601, in the future and before 2038-01-19

// Response data
{ message_id: string } & MessageReminderInfo
```

Notification when the time comes: `MessageReminderEvent`.

### 4. My reminders — `GET /api/v1/messages/reminders`

Returns reminders that haven't fired yet, soonest first.

```ts
// Response data
Array<MessageReminderInfo & {
  message_id: string;
  message: {
    id: string;
    channel_id: string | null;
    message_type: string;
    content: string;
    sender_user: { id: number; name: string; photo_path: string | null } | null;
    created_at: string | null;
  };
}>
```

### 5. Cancel reminder — `DELETE /api/v1/messages/reminders/{reminderId}`

Takes the reminder ID (not the message ID). No body.

```ts
// Response data
null   // hasContent: false
```

### 6. Archive or unarchive — `POST /api/v1/channels/{channelId}/archive`

Archiving is personal to the current user only.

```ts
// Request body — ChannelArchiveDto (optional)
{ archived?: 0 | 1 }   // default 1. The string "false" returns 400

// Response data
{ channel_id: number; channel_member_id: number; archived: 0 | 1 }
```

### 7. Mark as unread — `POST /api/v1/channels/{channelId}/unread`

Sets the unread counter to at least 1. No body, and no notification is sent to anyone. To mark it read again, use the existing `GET /api/v1/channels/{channelId}/watched`.

```ts
// Response data
{ channel_id: number; total_unread_message_count: number }
```

---

## Modified requests

### 8. Channel messages — `POST /api/v1/messages/messages_of_channel/{channelId}`

Added a `tag` field for filtering. Messages in the response have `tags` and `reminder` filled in.

```ts
// Request body — MessagesOfChannelDto
{
  message_id?: number;
  limit?: number;
  message_type?: string;
  tag?: MessageTag;        // new
}
```

### 9. My channels — `POST /api/v1/channels/my_channels`

Added an `archived` field. Without it, only non-archived channels are returned; with `true`, only archived ones.

```ts
// Request body
{
  timestamp?: string;
  limit?: number;
  messages_limit?: number;
  show_private?: boolean;
  archived?: boolean;      // new
}

// Response: each channel now also has
{ is_pin: 0 | 1; is_archived: 0 | 1 }
// and each channel's messages have tags and reminder filled in
```

### 10. Requests whose response now includes tags and reminder

The request is unchanged, but the messages in the response now carry real `tags` and `reminder` values:

- `POST /api/v1/messages/get_all_messages_between_two_messages`
- `POST /api/v1/channels/orderChatParticipant/get-recipient`

Other requests that return messages (such as send and `my_calls`) include the fields, but always as `tags: []` and `reminder: null`.

---

## Notifications

All notifications are data-only, with the same envelope:

```ts
// FCM message.data
{
  type: string;                    // event type
  data: string;                    // JSON as a string — parse it
  channel_id: 'trydos_notifications';
}
```

### UpdatingMessageEvent

Sent to the other channel members after a **message edit** or a **tag change**. It is the same event used for delete-for-everyone. It is not sent to any device of the user who performed the action.

```ts
// JSON.parse(data.data)
{
  type: 'UpdatingMessageEvent';
  contact_name: string | null;
  message: Message;                // without the reminder field
  prev_message_id: string | null;
  is_private: boolean;
  order_id: number | null;
  order_group_id: string | null;
  parent_order_id: number | null;
}
```

Handling: find the message by `id` and replace it, but keep the local `reminder` value as is.

If the payload is larger than 4KB, a compact version arrives instead; in that case fetch the message from the API:

```ts
{
  type: 'UpdatingMessageEvent';
  compact: true;
  channel_id: number | null;
  message_id: string | number | null;
  message: { id: string | number | null; channel_id: number | null; sender_user_id: number | null };
  contact_name: string | null;
  prev_message_id: string | null;
  is_private: boolean;
}
```

### MessageReminderEvent

Sent to all devices of the reminder's owner when the time comes (up to ~30 seconds late). It has no visible text, so the app must show a local notification.

```ts
// JSON.parse(data.data)
{
  channel_id?: number;             // may be missing for messages without a channel
  message_id: number;
  payload: {
    reminder_id: string;
    remind_at: string;             // ISO8601
    message_type: string;
    message_content: string | null;   // first 200 chars, null if not a text message
    sender_name: string | null;
  };
}
```
