// PostHog-only event stream for chat & stories.
//
// Routing rule (see funnels/chat-stories-funnels.md): events that already exist
// in utils/GAEvents.ts:GA_EVENT_NAMES fire through GAevent() (GA + PostHog
// fan-out). NEW events that have no GA counterpart — like the chat/stories ones
// below — must NOT be added to GA_EVENT_NAMES; they go to PostHog only via
// trackPosthog() so we don't pollute the GA taxonomy.
//
// trackPosthog() attaches the same global context block GAevent attaches to its
// PostHog fan-out (globalProps from utils/gtag.ts) — bare posthogCapture() would
// drop screen / country / device / user_id. Like every analytics wrapper here it
// no-ops outside production / off the client and never throws.
import { globalProps } from "./gtag";
import { posthogCapture } from "./posthog";

// Stories — names live here, NOT in GA_EVENT_NAMES.
export const STORY_EVENTS = {
  STORY_PRODUCT_CLICKED: "story_product_clicked",
  STORY_LINK_CLICKED: "story_link_clicked",
  STORY_UPLOADED: "story_uploaded",
} as const;

// Chat — names live here, NOT in GA_EVENT_NAMES.
export const CHAT_EVENTS = {
  CHAT_OPENED: "chat_opened",
  CHAT_MESSAGE_SENT: "chat_message_sent",
  CHAT_PRODUCT_SHARED: "chat_product_shared",
} as const;

export const trackPosthog = (
  event: string,
  props?: Record<string, unknown>,
): void => {
  try {
    // globalProps() first so explicit call props can override context if needed.
    posthogCapture(event, { ...globalProps(), ...props });
  } catch {
    // Analytics must never break the app.
  }
};
