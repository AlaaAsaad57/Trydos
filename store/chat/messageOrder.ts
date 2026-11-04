// The one order for a chat's messages: oldest first, by `created_at`, then by
// id. The chat backend orders by `created_at` alone, and it keeps whole
// seconds, so messages sent in the same second come back in any order. The id
// settles them. A local "sending" copy (`m…`) has no number for an id, so it
// keeps its place among messages from the same second.

const timeOf = (message: any): number | null => {
  const time = Date.parse(message?.created_at);
  return Number.isNaN(time) ? null : time;
};

const idOf = (message: any): number | null => {
  const id = Number(message?.id);
  return message?.id === "" || message?.id == null || Number.isNaN(id) ? null : id;
};

const compareMessages =(a: any, b: any): number => {
  const timeA = timeOf(a);
  const timeB = timeOf(b);
  if (timeA !== null && timeB !== null && timeA !== timeB) return timeA - timeB;
  const idA = idOf(a);
  const idB = idOf(b);
  if (idA !== null && idB !== null) return idA - idB;
  return 0;
};

/** A sorted copy, oldest first. Never changes the list it is given: that list
 *  can be a backend answer another caller holds too. */
export const sortMessages = <T>(messages: T[] | null | undefined): T[] =>
  [...(messages || [])].sort(compareMessages);
