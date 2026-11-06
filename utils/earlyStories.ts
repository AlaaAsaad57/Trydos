// The stories row is the largest paint of the home page. Its photos used to
// start only after hydration, because the list is read by the app's JavaScript,
// and that cost about a second on a phone.
//
// So an inline script reads the list while the page is still parsing and asks
// for the first photos. The app takes the same answer from it when it starts.
// The cards still draw only after hydration, but their photos are then here.
//
// This is a warm-up. If a photo's address here differs from the card's, the card
// loads its photo as it did before. Nothing depends on this script running.

/** The cards on screen at 440 px, and no more: the JS needs the line as well. */
const FIRST_PHOTOS = 3;

/**
 * Runs as the source text of an inline script, so it reads no module-level value
 * and uses only syntax that needs no compiler helper (see utils/lateBlur.ts).
 * The photo rules are those of `toHomeStory` and `getThumb`.
 */
function readStoriesEarly(url: string, photos: number) {
  var page = window as any;
  page.__earlyStories = fetch(url, { credentials: "same-origin" })
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .catch(function () {
      return null;
    });
  page.__earlyStories.then(function (body: any) {
    var list = body && body.data && body.data.data;
    if (!Array.isArray(list)) return;
    for (var i = 0; i < list.length && i < photos; i++) {
      var items = list[i] && list[i].stories;
      if (!Array.isArray(items) || !items.length) continue;
      var media = items[0];
      for (var j = 0; j < items.length; j++) {
        if (items[j] && items[j].is_seen === false) {
          media = items[j];
          break;
        }
      }
      if (!media) continue;
      var video = media.full_video_path;
      var path = video || media.photo_path;
      if (typeof path !== "string" || !path) continue;
      new Image().src = video
        ? path + "?target=snapshot"
        : path.replace("/upload", "/upload/h_194/f_webp/q_100");
    }
  });
}

/** The inline script of the home page. Costs the client bundle nothing. */
export const earlyStoriesScript = (url: string) =>
  `(${readStoriesEarly.toString()})(${JSON.stringify(url)},${FIRST_PHOTOS});`;

/**
 * The answer the inline script read, once: a later visit to the home page must
 * read a fresh list. Null when there is none, as on a tap to the home page. The
 * promise gives null when the read failed, and the caller then reads as usual.
 */
export function takeEarlyStories(): Promise<any> | null {
  const page = window as unknown as { __earlyStories?: Promise<any> };
  const early = page.__earlyStories ?? null;
  delete page.__earlyStories;
  return early;
}
