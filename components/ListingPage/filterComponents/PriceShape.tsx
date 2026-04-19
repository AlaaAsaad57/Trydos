import { useEffect, useState, useRef } from "react";

type DataPoint = { mon: number; max: number; count: number };
type SmoothPolygonProps = {
  data: DataPoint[];
  fillColor?: string;
};

export default function SmoothPolygon({
  data,
  fillColor = "#F8F8F8",
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
    return <div ref={containerRef} className="w-full h-[50px]" />;

  const padding = 0;

  const xValues = data.map((d) => (d.mon + d.max) / 2); // center of each bin
  const yValues = data.map((d) => d.count);

  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const maxY = Math.max(...yValues);

  const points = data.map(({ mon, max, count }) => {
    const xCenter = (mon + max) / 2;
    return {
      x:
        padding +
        ((xCenter - minX) / (maxX - minX)) * (size.width - 2 * padding),
      y: size.height - (count / maxY) * (size.height - 2 * padding), // Invert to draw from bottom up
    };
  });

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
    <div className="chart-container absolute w-full bottom-[44px] px-[40px]">
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
