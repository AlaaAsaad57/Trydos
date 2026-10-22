import { describe, expect, it } from "vitest";
import {
  MAP_ZOOM,
  TILE,
  coordsLabel,
  mapsUrl,
  tileUrl,
  tilesFor,
  worldPx,
} from "components/DemoApp/demoMap";

// The location message draws a window of the OpenStreetMap tiles centred on
// the point (components/DemoApp/demoMap.ts). These check the tile maths with
// no browser: which tiles are asked for, and where each lies in the window.

describe("demo map — the point on the world map", () => {
  it("puts 0°, 0° in the middle of the map", () => {
    const { x, y } = worldPx(0, 0, MAP_ZOOM);
    const middle = (2 ** MAP_ZOOM * TILE) / 2;
    expect(x, "longitude 0 is not the map's middle column").toBeCloseTo(middle, 6);
    expect(y, "latitude 0 is not the map's middle row").toBeCloseTo(middle, 6);
  });

  it("moves east for a bigger longitude and south for a smaller latitude", () => {
    const damascus = worldPx(33.5138, 36.2765);
    const istanbul = worldPx(41.0082, 28.9784);
    expect(damascus.x > istanbul.x, "Damascus is not east of Istanbul on the map").toBe(true);
    expect(damascus.y > istanbul.y, "Damascus is not south of Istanbul on the map").toBe(true);
  });
});

describe("demo map — the tiles of a window", () => {
  it("covers a 300 x 160 window with tiles that start at or before its edges and reach past them", () => {
    const tiles = tilesFor(33.5138, 36.2765, 300, 160);
    expect(tiles.length > 0, "no tile covers the window").toBe(true);
    const left = Math.min(...tiles.map((t) => t.left));
    const top = Math.min(...tiles.map((t) => t.top));
    const right = Math.max(...tiles.map((t) => t.left + TILE));
    const bottom = Math.max(...tiles.map((t) => t.top + TILE));
    expect(left <= 0, `the first tile starts ${left} px inside the window's left edge`).toBe(true);
    expect(top <= 0, `the first tile starts ${top} px inside the window's top edge`).toBe(true);
    expect(right >= 300, `the tiles end ${300 - right} px before the window's right edge`).toBe(true);
    expect(bottom >= 160, `the tiles end ${160 - bottom} px before the window's bottom edge`).toBe(true);
  });

  it("keeps the point in the middle of the window", () => {
    const lat = 33.5138;
    const lng = 36.2765;
    const { x, y } = worldPx(lat, lng);
    const tiles = tilesFor(lat, lng, 300, 160);
    // The tile that holds the point: its place in the window plus the point's
    // place in the tile is the window's centre.
    const own = tiles.find((t) => t.x === Math.floor(x / TILE) && t.y === Math.floor(y / TILE));
    expect(own, "the tile that holds the point is not in the window").toBeDefined();
    expect(own!.left + (x % TILE), "the point is not on the window's middle column").toBeCloseTo(150, 0);
    expect(own!.top + (y % TILE), "the point is not on the window's middle row").toBeCloseTo(80, 0);
  });

  it("asks the public tile server at the message's zoom", () => {
    const [tile] = tilesFor(0, 0, 300, 160);
    expect(tileUrl(tile), "the tile URL is not the OpenStreetMap one at the message's zoom").toBe(
      `https://tile.openstreetmap.org/${MAP_ZOOM}/${tile.x}/${tile.y}.png`,
    );
  });
});

describe("demo map — what a tap and the card say", () => {
  it("opens the point in a maps app by its coordinates", () => {
    expect(mapsUrl(33.5138, 36.2765), "the maps link does not carry the point").toBe(
      "https://www.google.com/maps?q=33.513800,36.276500",
    );
  });

  it("prints the point with four decimals", () => {
    expect(coordsLabel(33.51384, 36.27651), "the card's numbers are not four decimals").toBe("33.5138, 36.2765");
  });
});
