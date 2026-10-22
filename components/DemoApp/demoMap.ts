/**
 * The small map a location message shows: a window of `w` x `h` px, centred
 * on a point, made of the 256 px tiles of the public OpenStreetMap map at one
 * zoom. Nothing here touches the DOM: it only says which tiles to fetch and
 * where each one lies in the window, so the block can draw them as plain
 * images and the maths can be tested on its own.
 *
 * When the real chat is wired in, the backend may hand a map picture of its
 * own; then only `mapsUrl` is still needed.
 */

export const TILE = 256;

/** The zoom a location message shows: streets and their names, a few blocks across. */
export const MAP_ZOOM = 16;

export type Tile = {
  z: number;
  x: number;
  y: number;
  /** Where the tile's top-left corner lies in the window, in px. */
  left: number;
  top: number;
};

/** A tile's picture. */
export const tileUrl = (t: Tile) =>
  `https://tile.openstreetmap.org/${t.z}/${t.x}/${t.y}.png`;

/** The point's place on the world map at `zoom`, in px (Web Mercator). */
export function worldPx(lat: number, lng: number, zoom = MAP_ZOOM) {
  const n = 2 ** zoom * TILE;
  // Web Mercator stops short of the poles.
  const clamped = Math.max(-85.0511, Math.min(85.0511, lat));
  const rad = (clamped * Math.PI) / 180;
  const x = ((lng + 180) / 360) * n;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return { x, y };
}

/**
 * The tiles that cover a `w` x `h` window centred on the point, each with
 * its place in the window. Tiles past the map's edge (over the poles) are
 * left out; the window then shows its background there.
 */
export function tilesFor(
  lat: number,
  lng: number,
  w: number,
  h: number,
  zoom = MAP_ZOOM,
): Tile[] {
  const { x, y } = worldPx(lat, lng, zoom);
  const n = 2 ** zoom;
  const left = x - w / 2;
  const top = y - h / 2;
  const tiles: Tile[] = [];
  for (let ty = Math.floor(top / TILE); ty * TILE < top + h; ty += 1) {
    if (ty < 0 || ty >= n) continue;
    for (let tx = Math.floor(left / TILE); tx * TILE < left + w; tx += 1) {
      // The map wraps round the date line.
      const wrapped = ((tx % n) + n) % n;
      tiles.push({
        z: zoom,
        x: wrapped,
        y: ty,
        left: Math.round(tx * TILE - left),
        top: Math.round(ty * TILE - top),
      });
    }
  }
  return tiles;
}

/** Where a tap on the message goes: the point in the phone's maps app or on the web. */
export const mapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

/** "33.5138, 36.2765" — the point as the card prints it. */
export const coordsLabel = (lat: number, lng: number) =>
  `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
