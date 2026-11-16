import { describe, expect, it } from "vitest";
import { JOURNEY_SVG } from "components/orderTimeline/journeyMarkup";
import {
  DOTS,
  END_MS,
  TOUCHDOWN,
  TRUCK,
  collectParts,
  manPose,
  renderScene,
  rocketState,
  truckX,
} from "components/orderTimeline/journeyMotion";

describe("order journey motion", () => {
  it("keeps the employee's foot still on the line while it carries his weight", () => {
    // Walk the middle of his walk 4 ms at a time. While a foot is on the line
    // (and before the heel lifts), its ankle must not slide.
    for (const leg of [0, 1]) {
      let worst = 0;
      let checked = 0;
      let prev: { c: number; ax: number } | null = null;
      for (let t = 3700; t < 4900; t += 4) {
        const pose = manPose(t);
        const l = pose.legs[leg];
        const planted = l.stance && l.c < 0.46;
        if (planted && prev && l.c > prev.c) { checked++; worst = Math.max(worst, Math.abs(pose.feet[leg].ax - prev.ax)); }
        prev = planted ? { c: l.c, ax: pose.feet[leg].ax } : null;
      }
      expect(checked > 0, `leg ${leg} never stood on the line during the walk`).toBe(true);
      expect(worst, `leg ${leg} slid ${worst.toFixed(3)} px in one 4 ms frame while it stood on the line`).toBeLessThan(0.15);
    }
  });

  it("lands the rocket exactly on the Delivered dot", () => {
    const landed = rocketState(TOUCHDOWN + 300);
    expect(landed.x, `the rocket landed at x=${landed.x}, not on the Delivered dot (x=${DOTS[3]})`).toBe(DOTS[3]);
  });

  it("starts the truck at the end of the line, backs it up to meet the rocket, and drives it back", () => {
    expect(truckX(0), "the truck does not wait at the end of the line before it moves").toBe(TRUCK.end);
    expect(truckX(TRUCK.goStart - 1), "the truck did not back up to the meeting point next to the rocket").toBe(TRUCK.meet);
    expect(truckX(END_MS), "the truck did not drive back to the end of the line").toBe(TRUCK.end);
  });

  it("draws every frame of the story with no broken (NaN) value", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.innerHTML = JOURNEY_SVG;
    const parts = collectParts(svg);
    const broken: string[] = [];
    for (let t = 0; t <= END_MS; t += 50) {
      renderScene(parts, t, t, null);
      svg.querySelectorAll("*").forEach((el) => {
        for (const a of Array.from(el.attributes)) {
          if (a.value.includes("NaN")) broken.push(`${t} ms: ${el.getAttribute("class")} ${a.name}`);
        }
      });
      if (broken.length) break;
    }
    expect(broken[0], "a part of the stage got a NaN value").toBeUndefined();
  });
});
