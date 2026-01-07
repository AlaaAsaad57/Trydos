"use client";

import { useParams } from "next/navigation";
import { translateFunction } from "utils/functions";

const CartErrorIllustration = ({
  className = "w-48 h-48",
}: {
  className?: string;
}) => {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient
          id="cartErrorGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#fee2e2" />
          <stop offset="100%" stopColor="#fecaca" />
        </linearGradient>
        <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3f4f6" />
          <stop offset="100%" stopColor="#e5e7eb" />
        </linearGradient>
      </defs>

      <circle
        cx="100"
        cy="100"
        r="90"
        fill="url(#cartErrorGradient)"
        opacity="0.3"
      />

      {/* Shopping Cart */}
      <g transform="translate(70, 80)">
        {/* Cart body */}
        <rect
          x="0"
          y="20"
          width="60"
          height="40"
          rx="4"
          fill="url(#cartGradient)"
          stroke="#6b7280"
          strokeWidth="2"
        />

        {/* Cart wheels */}
        <circle cx="15" cy="65" r="8" fill="#6b7280" />
        <circle cx="45" cy="65" r="8" fill="#6b7280" />

        {/* Cart handle */}
        <path
          d="M10 25 L10 15 Q10 10 15 10 L45 10 Q50 10 50 15 L50 25"
          stroke="#6b7280"
          strokeWidth="2"
          fill="none"
        />

        {/* Cart items (with error X) */}
        <rect
          x="10"
          y="25"
          width="15"
          height="15"
          rx="2"
          fill="#ef4444"
          opacity="0.8"
        />
        <path
          d="M15 30 L25 40 M25 30 L15 40"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <rect
          x="35"
          y="25"
          width="15"
          height="15"
          rx="2"
          fill="#ef4444"
          opacity="0.8"
        />
        <path
          d="M40 30 L50 40 M50 30 L40 40"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Floating error indicators */}
      <circle cx="45" cy="60" r="6" fill="#ef4444" opacity="0.6">
        <animate
          attributeName="cy"
          values="60;50;60"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="155" cy="70" r="4" fill="#f97316" opacity="0.6">
        <animate
          attributeName="cy"
          values="70;60;70"
          dur="2.5s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="40" cy="140" r="5" fill="#ef4444" opacity="0.5">
        <animate
          attributeName="r"
          values="5;7;5"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
};

const CartErrorComponent = ({ errorMessage, onRetry }) => {
  const { lang } = useParams();
  // @ts-ignore
  let language = lang.split("-")[1];
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[400px] bg-gradient-to-br from-red-50 via-white to-pink-50 rounded-lg z-[999999998]">
      {/* Error Illustration */}
      <div className="mb-6">
        <CartErrorIllustration className="w-48 h-48" />
      </div>

      {/* Error Content */}
      <div className="text-center max-w-md mx-auto mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 regular">
          {translateFunction("Cart Loading Error", language)}
        </h2>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-red-100">
          <p className="text-gray-600 mb-4 leading-relaxed regular">
            {translateFunction(
              "We encountered an error while loading your cart. Don't worry, we'll fix this issue for you.",
              language
            )}
          </p>

          {errorMessage && (
            <div className="bg-red-50 rounded-md p-3 mb-4">
              <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
            </div>
          )}
        </div>
      </div>

      {/* Retry Button */}
      <button
        onClick={onRetry}
        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2 min-w-[200px] transform hover:scale-105 active:scale-95 regular"
        aria-label={
          translateFunction("Try Again", language) || "Retry loading cart"
        }
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {translateFunction("Try Again", language)}
      </button>
    </div>
  );
};

export default CartErrorComponent;
