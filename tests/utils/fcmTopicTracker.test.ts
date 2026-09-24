import { describe, expect, it } from "vitest";
import {
  trackSubscribedTopic,
  untrackSubscribedTopic,
  getSubscribedTopics,
} from "utils/fcmTopicTracker";

describe("fcmTopicTracker utility", () => {
  it("tracks, deletes, and retrieves FCM subscribed topics", () => {
    trackSubscribedTopic("topic-1");
    trackSubscribedTopic("topic-2");

    const topics = getSubscribedTopics();
    expect(topics.has("topic-1"), "should contain topic-1").toBe(true);
    expect(topics.has("topic-2"), "should contain topic-2").toBe(true);

    untrackSubscribedTopic("topic-1");
    expect(topics.has("topic-1"), "should remove topic-1 after untracking").toBe(false);
  });
});
