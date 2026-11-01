import { downloadFile } from "components/Chat/downloadFile";

// Saves incoming chat media on the user's machine by itself, like the
// auto-download in WhatsApp.
//
// RULES
//   - Never by default. The user picks "Always" or "Never" in the chat info
//     drawer (the "Save To Gallery" row).
//   - Only media from someone else. A message you sent never comes through here.
//   - Two ways in:
//       1. LIVE. A message arrives while the page is open. It is saved at once.
//       2. MISSED. The message came while the page was closed. When the user
//          opens that chat, the media that is newer than the last visit is
//          saved, and each photo or video shows blurred until its save ends.
//     Old history is never saved. See "MISSED MEDIA" below.
//   - Photos, videos and files. Voice messages are not saved.
//   - The same file is never saved twice. See "THE LEDGER" below.
//
// WHY THE SETTING LIVES IN localStorage. The save goes to this browser's
// Downloads folder, so the choice belongs to this browser, not to the account.

const ENABLED_KEY = "chat-auto-download";
const LEDGER_KEY = "chat-auto-downloaded";
// chat id -> time (ms) of the newest message the user has looked at.
const SEEN_KEY = "chat-auto-download-seen";
// Only the newest 200 chats are remembered.
const SEEN_LIMIT = 200;

// Only the newest 500 files are remembered, so storage cannot grow forever.
const LEDGER_LIMIT = 500;

// A pause between two saves. Chrome asks "download multiple files?" when a page
// starts many downloads at once. A short gap keeps a burst of files calm.
const GAP_MS = 400;

// MISSED MEDIA saves at most this many files each time a chat is opened.
// Chrome asks "download multiple files?" after a burst of downloads, and a
// long absence must not fill the Downloads folder.
const MISSED_LIMIT = 10;

// A photo or video is never blurred for longer than this, even if its save
// hangs. The blur must never hide the media for good.
const BLUR_MAX_MS = 20_000;

const AUTO_SAVE_TYPES = new Set(["ImageMessage", "VideoMessage", "FileMessage"]);

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Private window, blocked site data, or a server render.
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not saved. The in-memory ledger below still works for this tab.
  }
}

export type AutoDownloadMode = "always" | "never";

export const AUTO_DOWNLOAD_MODES: AutoDownloadMode[] = ["always", "never"];

export function getAutoDownloadMode(): AutoDownloadMode {
  return readStorage(ENABLED_KEY) === "always" ? "always" : "never";
}

export function setAutoDownloadMode(mode: AutoDownloadMode) {
  writeStorage(ENABLED_KEY, mode);
}

export function isAutoDownloadOn(): boolean {
  return getAutoDownloadMode() === "always";
}

// THE LEDGER. The key of a file is its URL, not the message id. So the same
// file is saved once even when:
//   - the push for one message arrives twice (foreground push and service
//     worker push both fire),
//   - the message is forwarded to another chat (same stored file),
//   - the user reloads the page,
//   - a live save and a missed save both find the same message.
// A file is written to the ledger BEFORE its download starts. The second push
// then finds it at once and does nothing.
let ledger: string[] | null = null;

function loadLedger(): string[] {
  if (ledger) return ledger;
  try {
    const parsed = JSON.parse(readStorage(LEDGER_KEY) || "[]");
    ledger = Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    ledger = [];
  }
  return ledger;
}

/** True when this file was already saved (or is being saved now). */
export function wasAutoDownloaded(filePath: string): boolean {
  return loadLedger().includes(filePath);
}

function remember(filePath: string) {
  const list = loadLedger();
  list.push(filePath);
  if (list.length > LEDGER_LIMIT) list.splice(0, list.length - LEDGER_LIMIT);
  writeStorage(LEDGER_KEY, JSON.stringify(list));
}

// WHICH FILES ARE BLURRED RIGHT NOW. Only the MISSED flow blurs. A component
// asks `useIsAutoSaving(url)` (components/Chat/useIsAutoSaving.ts) and draws the blur while the answer is true.
const saving = new Set<string>();
const listeners = new Set<() => void>();

function setSaving(filePath: string, on: boolean) {
  if (saving.has(filePath) === on) return;
  if (on) saving.add(filePath);
  else saving.delete(filePath);
  listeners.forEach((listener) => listener());
}

/** Calls `listener` each time a file starts or stops saving. Returns the unsubscribe. */
export function subscribeToAutoSaving(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** True while this file is waiting for, or going through, its automatic save. */
export function isAutoSaving(filePath: string): boolean {
  return saving.has(filePath);
}

// One save at a time, in arrival order.
let queue: Promise<void> = Promise.resolve();

function enqueue(filePath: string, blur: boolean) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  if (blur) {
    setSaving(filePath, true);
    timer = setTimeout(() => setSaving(filePath, false), BLUR_MAX_MS);
  }
  queue = queue
    .then(() => downloadFile(filePath))
    .catch(() => {})
    .then(() => {
      // The save ended (well or badly). Show the media clearly again.
      if (blur) {
        clearTimeout(timer);
        setSaving(filePath, false);
      }
    })
    .then(() => new Promise<void>((resolve) => setTimeout(resolve, GAP_MS)));
}

/**
 * The files of one message that may be saved: it is from someone else, it is a
 * photo, video or file, it is not deleted, and the ledger has not seen the file.
 */
function newFilesOf(
  message: any,
  currentUserId: string | number | null | undefined,
): string[] {
  if (!message) return [];

  const senderId = message.sender_user?.id ?? message.sender_user_id;
  if (senderId != null && String(senderId) === String(currentUserId)) return [];

  if (!AUTO_SAVE_TYPES.has(message.message_type?.name)) return [];
  // The sender already deleted it for everyone.
  if (message.deleted_by_user_id != null) return [];
  // The user deleted it for themselves.
  if (message.auth_message_status?.is_deleted === 1) return [];

  const files: string[] = [];
  for (const file of message.message_files ?? []) {
    const filePath: string | undefined = file?.file_path;
    if (filePath && !wasAutoDownloaded(filePath) && !files.includes(filePath)) {
      files.push(filePath);
    }
  }
  return files;
}

/**
 * LIVE. Call this for each incoming chat message. It decides by itself whether
 * to save anything.
 *
 * @returns the file URLs it started to save (for tests and logs).
 */
export function autoSaveIncomingMedia(
  message: any,
  currentUserId: string | number | null | undefined,
): string[] {
  if (typeof window === "undefined" || !isAutoDownloadOn()) return [];

  const started = newFilesOf(message, currentUserId);
  for (const filePath of started) {
    remember(filePath);
    enqueue(filePath, false);
  }
  return started;
}

// MISSED MEDIA. "Missed" means: newer than the last time the user looked at this
// chat. We keep, per chat, the time of the newest message the user has seen
// (SEEN_KEY). Two rules keep the first look safe:
//   - The first time we see a chat there is no earlier visit. Nothing counts as
//     missed, so turning "Always" on never saves old history.
//   - While "Never" is chosen, the chat is still marked as seen. Switching to
//     "Always" later does not save what came before the switch.
//
// WHY THE START TIME IS HELD IN MEMORY. Messages load in steps when a chat
// opens, so this runs more than once. If each run used the stored time, the
// first (stale) run would move it forward and the next run would miss files.
// So the stored time is read once per page load, and later runs reuse it.
const lookedSince = new Map<string, number>();
const missedSaved = new Map<string, number>();

function readSeen(): Record<string, number> {
  try {
    const parsed = JSON.parse(readStorage(SEEN_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function writeSeen(seen: Record<string, number>) {
  // A chat that is looked at again is deleted and added back (see the caller),
  // so the first keys are the least recently seen. Chat ids are not numbers,
  // so the keys keep the order they were added in.
  const keys = Object.keys(seen);
  for (const key of keys.slice(0, Math.max(0, keys.length - SEEN_LIMIT))) {
    delete seen[key];
  }
  writeStorage(SEEN_KEY, JSON.stringify(seen));
}

/**
 * MISSED. Call this when a chat is open, each time its messages change. It
 * saves the media that came while the page was closed, and blurs it until the
 * save ends.
 *
 * @returns the file URLs it started to save (for tests and logs).
 */
export function autoSaveMissedMedia(
  chatId: string | number | null | undefined,
  messages: any[] | null | undefined,
  currentUserId: string | number | null | undefined,
): string[] {
  if (typeof window === "undefined" || chatId == null) return [];
  if (!Array.isArray(messages) || messages.length === 0) return [];

  const key = String(chatId);
  const times = messages
    .map((message) => Date.parse(message?.created_at))
    .filter((time) => Number.isFinite(time));
  if (times.length === 0) return [];
  const newest = Math.max(...times);

  const seen = readSeen();
  const on = isAutoDownloadOn();

  if (!lookedSince.has(key)) {
    // -1 = this chat was never seen. MAX = "Never" is chosen: nothing is missed.
    lookedSince.set(key, on ? (seen[key] ?? -1) : Number.MAX_SAFE_INTEGER);
  }

  if (newest > (seen[key] ?? -1)) {
    // Delete first, so the chat moves to the end of the list (the newest).
    delete seen[key];
    seen[key] = newest;
    writeSeen(seen);
  }

  const since = lookedSince.get(key) as number;
  if (!on || since < 0) return [];

  const budget = MISSED_LIMIT - (missedSaved.get(key) ?? 0);
  if (budget <= 0) return [];

  // Newest first, so a long absence keeps the most recent files.
  const newer = messages
    .filter((message) => Date.parse(message?.created_at) > since)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  const picked: string[] = [];
  for (const message of newer) {
    for (const filePath of newFilesOf(message, currentUserId)) {
      if (picked.length < budget && !picked.includes(filePath)) {
        picked.push(filePath);
      }
    }
  }

  // Save in the order the files were sent.
  picked.reverse();
  for (const filePath of picked) {
    remember(filePath);
    enqueue(filePath, true);
  }
  missedSaved.set(key, (missedSaved.get(key) ?? 0) + picked.length);
  return picked;
}

/** Test helper: forget everything held in memory. */
export function resetAutoDownloadMemory() {
  ledger = null;
  queue = Promise.resolve();
  lookedSince.clear();
  missedSaved.clear();
  saving.clear();
  listeners.forEach((listener) => listener());
}
