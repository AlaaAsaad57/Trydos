export const ProductLabelsAnimated = ({ labels }) => {
  if (!labels || labels.length === 0) return null;

  const labelCount = labels.length;
  const itemHeight = 14; // Matching h-[14px]

  if (labelCount === 1) {
    return (
      <div className="relative h-[14px] overflow-hidden select-none flex items-center">
        <span className="text-[9px] text-[#388CFF] leading-[14px]">
          {labels[0]}
        </span>
      </div>
    );
  }

  // Create steps for the animation
  // Each label gets a chunk of the 100% timeline
  const stepSize = 100 / labelCount;
  const pausePercentage = stepSize * 0.8; // Spend 80% of the time sitting still

  const keyframes = labels
    .map((_, i) => {
      const start = i * stepSize;
      const end = (i + 1) * stepSize;
      return `
      ${start}% { transform: translateY(-${i * itemHeight}px); }
      ${start + pausePercentage}% { transform: translateY(-${
        i * itemHeight
      }px); }
    `;
    })
    .join("");

  return (
    <div className="h-[14px] relative overflow-hidden select-none">
      <style>{`
        @keyframes scrollStep {
          ${keyframes}
          100% { transform: translateY(-${labelCount * itemHeight}px); }
        }
        .animate-scroll-step {
          animation: scrollStep ${
            labelCount * 2
          }s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }
      `}</style>

      <div className="flex flex-col animate-scroll-step items-start">
        {/* Original Labels */}
        {labels.map((label, index) => (
          <div key={index} className="h-[14px] flex items-start shrink-0">
            <span className="text-[9px] text-[#388CFF] leading-[14px] whitespace-nowrap">
              {label}
            </span>
          </div>
        ))}
        {/* The Clone for infinite loop */}
        <div className="h-[14px] flex items-center shrink-0">
          <span className="text-[9px] text-[#388CFF] leading-[14px] whitespace-nowrap">
            {labels[0]}
          </span>
        </div>
      </div>
    </div>
  );
};
