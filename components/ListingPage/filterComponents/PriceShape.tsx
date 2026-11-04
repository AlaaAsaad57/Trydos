import { useEffect, useState, useRef } from "react";

type DataPoint = { mon: number; max: number; count: number };
type SmoothPolygonProps = {
  data: DataPoint[];
  fillColor?: string;
  // The slider's own bounds, so a price sits right under its handle.
  min?: number;
  max?: number;
};

export default function SmoothPolygon({
  data,
  fillColor = "#EEEEEE",
  min,
  max,
}: SmoothPolygonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 400, height: 50 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setSize({ width: w, height: 50 });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  if (!data || data.length === 0 || size.width === 0)
    return (
      <div className="absolute inset-x-0 bottom-full pointer-events-none">
        <div ref={containerRef} className="w-full h-[50px]" />
      </div>
    );

  const padding = 0;

  const yValues = data.map((d) => d.count);

  // Same scale as the slider: min price at the left end, max at the right end.
  const minX = min ?? Math.min(...data.map((d) => d.mon));
  const maxX = max ?? Math.max(...data.map((d) => d.max));
  const spanX = maxX - minX || 1;
  const maxY = Math.max(...yValues);

  const bandPoints = data.map(({ mon, max, count }) => {
    const xCenter = (mon + max) / 2; // center of each bin
    return {
      x: padding + ((xCenter - minX) / spanX) * (size.width - 2 * padding),
      y: size.height - (count / maxY) * (size.height - 2 * padding), // Invert to draw from bottom up
    };
  });

  // Carry the first and last band out to the ends, so the shape covers the whole ruler.
  const points = [
    { x: 0, y: bandPoints[0].y },
    ...bandPoints,
    { x: size.width, y: bandPoints[bandPoints.length - 1].y },
  ];

  function catmullRom2bezier(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return "";

    const d: string[] = [`M${pts[0].x},${pts[0].y}`];

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
    }

    // Fill to bottom baseline
    const last = pts[pts.length - 1];
    const first = pts[0];
    d.push(`L${last.x},${size.height}`);
    d.push(`L${first.x},${size.height}`);
    d.push("Z");

    return d.join(" ");
  }

  const pathData = catmullRom2bezier(points);

  return (
    // Sits on top of the ruler line (rendered inside the ruler box).
    <div className="chart-container absolute inset-x-0 bottom-full pointer-events-none">
      <div ref={containerRef} className="w-full h-[50px] max-w-full">
        <svg
          width={size.width}
          height={size.height}
          style={{ display: "block" }}
        >
          <path d={pathData} fill={fillColor} stroke="none" />
        </svg>
      </div>
    </div>
  );
}
