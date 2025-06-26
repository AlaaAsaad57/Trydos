import React from "react";

function ProductsLabels({
  labels,
  isProduct,
}: {
  labels?: string[];
  isProduct?: boolean;
}) {
  const classesArray = [
    "bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-2 rounded-lg shadow-lg ",
    "bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-lg shadow-lg ",
    "bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-2 rounded-lg shadow-lg ",
    "bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg shadow-lg ",
    "bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-2 rounded-lg shadow-lg ",
    "bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-2 rounded-lg shadow-lg ",
    "bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-2 rounded-lg shadow-lg ",
    "bg-gradient-to-r from-teal-500 to-blue-500 text-white px-3 py-2 rounded-lg shadow-lg ",
  ];

  const LabelIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 animate-pulse"
    >
      <path
        d="M20.59 13.41L13.42 20.58C13.21 20.79 12.94 20.9 12.66 20.9H2C1.45 20.9 1 20.45 1 19.9V9.24C1 8.96 1.11 8.69 1.32 8.48L8.49 1.31C8.7 1.1 8.97 0.99 9.25 0.99H19.91C20.46 0.99 20.91 1.44 20.91 1.99V12.65C20.91 12.93 20.8 13.2 20.59 13.41ZM19.91 2.99H9.66L2.99 9.66V19.9H12.25L19.91 12.24V2.99ZM15.91 6.99C15.36 6.99 14.91 6.54 14.91 5.99C14.91 5.44 15.36 4.99 15.91 4.99C16.46 4.99 16.91 5.44 16.91 5.99C16.91 6.54 16.46 6.99 15.91 6.99Z"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <div
      className={`flex ${
        isProduct ? "flex-row " : "flex-col origin-top-right scale-[1.3]"
      } gap-1 items-end mr-[3px] `}
    >
      {labels?.map((label, index) => (
        <div key={index} className={classesArray[index % classesArray.length]}>
          <div className="flex items-center gap-1.5 mb-1">
            <LabelIcon />
            <span className="text-xs font-bold uppercase tracking-wide">
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductsLabels;
