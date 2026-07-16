/**
 * Lightweight, dependency-free store for actively subscribed FCM topics.
 *
 * Imported by both `utils/firebaseInitv1` (reads the set to re-subscribe after
 * token rotation) and `services/home` (writes on subscribe / unsubscribe).
 * Keeping it in its own file breaks the circular dependency that would arise
 * from services/home → firebaseInitv1 → services/auth → services/home.
 */
const _subscribedTopics = new Set<string>();

export const trackSubscribedTopic = (topic: string): void => {
  _subscribedTopics.add(topic);
};

export const untrackSubscribedTopic = (topic: string): void => {
  _subscribedTopics.delete(topic);
};

export const getSubscribedTopics = (): ReadonlySet<string> => _subscribedTopics;
