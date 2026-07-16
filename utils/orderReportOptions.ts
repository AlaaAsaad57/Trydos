// Canonical report points + options. The `value`s here are the frozen wire
// contract shared with the backend (see docs/api-requirements/order-product-report.md
// and the design spec §5). `label`/`titleLabel` are English source strings fed
// to translateFunction at render time — safe to reword; values are not.

export type ReportOption = { value: string; label: string };

export type ReportPoint = {
  key: string;
  titleLabel: string;
  options: ReportOption[];
};

export type ReportPointSelection = { point: string; values: string[] };

export const ORDER_REPORT_POINTS: ReportPoint[] = [
  {
    key: "product_quality",
    titleLabel: "Product Quality",
    options: [
      { value: "damaged", label: "Damaged" },
      { value: "not_as_described", label: "Not as described" },
      { value: "poor_material", label: "Poor material / quality" },
      { value: "wrong_item", label: "Wrong item received" },
      { value: "expired", label: "Expired / spoiled" },
    ],
  },
  {
    key: "delivery_time",
    titleLabel: "Delivery Time",
    options: [
      { value: "too_late", label: "Arrived too late" },
      { value: "missed_window", label: "Missed the delivery window" },
      { value: "no_eta", label: "No clear ETA" },
      { value: "faster_than_expected", label: "Faster than expected" },
    ],
  },
  {
    key: "delivery_worker",
    titleLabel: "Delivery Worker",
    options: [
      { value: "rude", label: "Rude behavior" },
      { value: "unprofessional", label: "Unprofessional" },
      { value: "no_show", label: "Did not show up" },
      { value: "asked_extra_fee", label: "Asked for an extra fee" },
      { value: "polite", label: "Polite & helpful" },
    ],
  },
  {
    key: "delivery_car",
    titleLabel: "Delivery Car",
    options: [
      { value: "dirty_vehicle", label: "Dirty vehicle" },
      { value: "no_cooling", label: "No cooling / improper temperature" },
      { value: "unsafe_handling", label: "Unsafe handling" },
      { value: "no_vehicle", label: "No proper vehicle" },
    ],
  },
];
