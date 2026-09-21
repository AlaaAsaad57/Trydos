// Which chat attachments the app accepts, and how a sent file becomes a message
// type.
//
// These rules used to sit inline in ConversationContainer.tsx. They are here so
// they can be read and tested on their own: the container is a 1100-line
// component, and there is no way to ask it "would you accept this .avi?"
// without mounting a whole conversation.
//
// THE RULE THAT MATTERS. The picker decides the message type from the FILE
// NAME, but the media server decides the stored Content-Type from the BYTES
// (MediaServing/src/utils/byteSniffer.js). When the two disagree the message is
// broken beyond repair: an .avi is sent as a VideoMessage, stored as
// application/octet-stream, and served with `Content-Disposition: attachment`.
// The <video> tag in VideoMessage.tsx then points at an attachment, so it shows
// no frame, plays nothing, and does not even download.
//
// So this file only calls a video a video when a browser can really open the
// container. The sniffer recognises exactly three video containers — mp4, mov
// (quicktime) and webm/matroska — and everything else falls through to
// octet-stream.

/** Image names the chat opens in the crop/preview widget. */
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|bmp|svg|ico|heic|heif)$/i;

// Video containers the chat accepts, and nothing else. This list is the same
// three containers MediaServing's byte sniffer recognises, written as the
// extensions a user actually sees: mp4 (with its m4v and 3gp relatives, which
// are the same ISO container), mov, and webm.
//
// .avi, .mkv, .flv and .wmv are deliberately absent. The sniffer stores them as
// application/octet-stream, and the chat cannot play an attachment.
const VIDEO_EXTENSIONS = /\.(mp4|mov|m4v|3gp|webm)$/i;

// The declared types that go with them. Needed because a recorded clip has no
// file name to read: the camera hands over a MediaRecorder blob whose type is
// something like "video/webm;codecs=vp8".
//
// The file name is NOT enough on its own, and the declared type is NOT enough
// either — an .avi arrives as "video/x-msvideo", which is why a plain
// `type.includes("video")` check used to let every broken container through.
const SUPPORTED_VIDEO_TYPES = /^video\/(mp4|quicktime|webm|3gpp|x-m4v)$/i;

/**
 * The `accept` string for the media-only picker button.
 *
 * Only ever a hint: `accept` filters the dialog, it does not stop a determined
 * user picking "All files". The checks below are what actually decide.
 */
export const MEDIA_INPUT_ACCEPT =
  "image/*,video/mp4,video/quicktime,video/webm,video/3gpp,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.heic,.heif,.mp4,.mov,.m4v,.3gp,.webm";

export function isImageFile(file: File): boolean {
  return file.type.includes("image") || IMAGE_EXTENSIONS.test(file.name);
}

export function isSupportedVideoFile(file: File): boolean {
  if (VIDEO_EXTENSIONS.test(file.name)) return true;
  // "video/webm;codecs=vp8" is one of these, so the parameters come off first.
  const declared = (file.type || "").split(";")[0].trim();
  return SUPPORTED_VIDEO_TYPES.test(declared);
}

/**
 * The gate on the media-only picker: anything else is refused before upload.
 *
 * It asks the same two questions the send path asks, so the picker and the send
 * path can never disagree about one file.
 */
export function isImageOrVideoFile(file: File): boolean {
  return isImageFile(file) || isSupportedVideoFile(file);
}

// Containers a user plainly meant as a video, but that no browser will play.
// Used only to choose the wording of the refusal, so the sender is told the
// format is the problem rather than "only image and video files are allowed",
// which is confusing when they just picked a video.
const UNPLAYABLE_VIDEO_EXTENSIONS =
  /\.(avi|mkv|flv|wmv|mpe?g|m2ts|mts|ts|ogv|vob|rm|rmvb|divx|asf)$/i;

/**
 * Did the sender pick a video the chat cannot show?
 *
 * Two ways to tell: a name we know is a video container, or a declared type in
 * the video family that is not one of the supported ones.
 */
export function isUnsupportedVideoFile(file: File): boolean {
  if (isSupportedVideoFile(file)) return false;
  if (UNPLAYABLE_VIDEO_EXTENSIONS.test(file.name)) return true;
  return /^video\//i.test(file.type || "");
}

export type ChatMessageType =
  | "ImageMessage"
  | "VoiceMessage"
  | "VideoMessage"
  | "FileMessage";

/** Which bubble a chosen file becomes. */
export function pickMessageType(file: File): ChatMessageType {
  if (isImageFile(file)) return "ImageMessage";
  if (file.type.includes("audio")) return "VoiceMessage";
  if (isSupportedVideoFile(file)) return "VideoMessage";
  return "FileMessage";
}

/**
 * The same attachment URL, asked for as a download.
 *
 * The media server serves a recognised video with `Content-Disposition: inline`
 * so it can play in the page. When the browser cannot decode it there is
 * nothing to play, and an `<a download>` will not help either — the media
 * server is a different origin, and the `download` attribute is ignored
 * cross-origin. `?download=1` makes the server send `attachment` instead.
 */
export function toDownloadUrl(url: string): string {
  if (!url) return url;
  return `${url}${url.includes("?") ? "&" : "?"}download=1`;
}
