import { describe, expect, it } from "vitest";
import { ORDER_REPORT_POINTS } from "utils/orderReportOptions";

describe("ORDER_REPORT_POINTS metadata array", () => {
  it("contains all 4 canonical report categories", () => {
    const keys = ORDER_REPORT_POINTS.map((p) => p.key);
    expect(keys, "should contain 4 report points").toEqual([
      "product_quality",
      "delivery_time",
      "delivery_worker",
      "delivery_car",
    ]);
  });

  it("every report point has valid non-empty options array", () => {
    ORDER_REPORT_POINTS.forEach((point) => {
      expect(point.titleLabel, "title label should not be empty").toBeTruthy();
      expect(point.options.length > 0, "options array should not be empty").toBe(true);
      point.options.forEach((opt) => {
        expect(opt.value, "option value should exist").toBeTruthy();
        expect(opt.label, "option label should exist").toBeTruthy();
      });
    });
  });
});
