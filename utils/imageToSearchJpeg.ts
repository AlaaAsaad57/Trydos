// Makes the picture a photo search sends: a JPEG, longest side 1024 px,
// quality 0.85.
//
// Why: a phone photo is often over the 4 MB cap of the search routes, so it
// was refused. And the catalogue photos were embedded at 1024 px. Measured on
// staging: a 1024 px JPEG of a product photo scored cosine 0.98 against the
// stored vector; at 256 px it fell to 0.93. So this size keeps the match and
// makes the upload small.

const SEARCH_IMAGE_MAX_SIDE = 1024;
const SEARCH_IMAGE_QUALITY = 0.85;

/** The size to draw at: the same shape, longest side at most `maxSide`. */
export function fitWithin(width: number, height: number, maxSide = SEARCH_IMAGE_MAX_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** A picture that has not loaded by then goes as it is. Some engines (and
 *  jsdom in the unit suite) never fire `load` or `error` at all. */
const LOAD_TIMEOUT_MS = 5000;

const loadImage = (file: Blob) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const done = (fn: () => void) => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      fn();
    };
    const timer = setTimeout(
      () => done(() => reject(new Error("the image took too long to load"))),
      LOAD_TIMEOUT_MS,
    );
    img.onload = () => done(() => resolve(img));
    img.onerror = () =>
      done(() => reject(new Error("the browser could not read the image")));
    img.src = url;
  });

/** The JPEG to send. If the browser cannot draw the picture (for example HEIC
 *  outside Safari), the original file goes, and the server decides. */
export async function imageToSearchJpeg(file: File): Promise<File> {
  try {
    const img = await loadImage(file);
    const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // A transparent PNG would turn black in a JPEG; white is what a product
    // photo background usually is.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", SEARCH_IMAGE_QUALITY),
    );
    if (!blob) return file;
    return new File([blob], "search.jpg", { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
