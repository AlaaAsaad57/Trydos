import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Some XD paths are drawn with the even-odd fill rule (`winding: "evenodd"` in
// the XD file). With that rule, a shape inside another shape cuts a hole. The
// icon cutter once wrote these paths without the rule, so the browser used
// non-zero and filled the holes: the verified mark lost its white check, the
// call icons turned solid, and the "+" and download marks were gone.
//
// Each entry names the icon, what the hole shows, and the first point of each
// path (its `M x y`) that must keep `fill-rule="evenodd"`.
const ICONS_WITH_HOLES: { file: string; hole: string; paths: string[] }[] = [
  { file: "productVerified.svg", hole: "the white check mark in the blue verified badge", paths: ["8.91 0.8"] },
  { file: "callIncoming.svg", hole: "the outline phone (not a solid one)", paths: ["1.402743935585022 1.05341899394989"] },
  { file: "callMissed.svg", hole: "the outline phone (not a solid one)", paths: ["1.682124018669128 1.267528295516968"] },
  { file: "callOutgoing.svg", hole: "the outline phone (not a solid one)", paths: ["1.68198025226593 1.267418265342712"] },
  { file: "chatHeaderCall.svg", hole: "the outline phone in the chat header", paths: ["2.427390336990356 1.838679671287537"] },
  { file: "chatHeaderVideo.svg", hole: "the outline phone in the chat header", paths: ["2.427407264709473 1.838692665100098"] },
  { file: "infoDownload.svg", hole: "the white download arrow", paths: ["2 11.99995040893555"] },
  { file: "infoRequest.svg", hole: "the white plus", paths: ["15.3330078125 1.999999761581421"] },
  { file: "txRequest.svg", hole: "the white plus", paths: ["12.66666603088379 1.999999761581421"] },
  {
    file: "usdtMark.svg",
    hole: "the white tether mark and the Tron mark",
    paths: ["4.355713367462158 2.999997615814209", "18.04339790344238 18.07386779785156"],
  },
];

const DIR = join(process.cwd(), "public/assets/demo/xd");

/** The attributes of every <path> whose `d` starts at the point `start`. */
function pathsAt(svg: string, start: string): string[] {
  const found: string[] = [];
  for (const match of svg.matchAll(/<path d="M ?([^"]*)"([^>]*)\/>/g)) {
    if (match[1].startsWith(`${start} `) || match[1].startsWith(`${start.replace(" ", ",")} `)) found.push(match[2]);
  }
  return found;
}

describe("XD icons keep the holes the designer drew", () => {
  for (const icon of ICONS_WITH_HOLES) {
    for (const start of icon.paths) {
      it(`${icon.file} shows ${icon.hole} (path at ${start})`, () => {
        const svg = readFileSync(join(DIR, icon.file), "utf8");
        const found = pathsAt(svg, start);
        expect(found.length > 0, `${icon.file} should have a path that starts at "M ${start}"`).toBe(true);
        for (const attrs of found) {
          expect(attrs, `${icon.file}: the path at "M ${start}" needs fill-rule="evenodd", or it loses ${icon.hole}`).toContain(
            'fill-rule="evenodd"',
          );
        }
      });
    }
  }
});
