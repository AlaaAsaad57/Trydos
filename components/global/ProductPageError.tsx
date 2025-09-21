"use client";

import { useParams, useRouter } from "next/navigation";
import { translateFunction } from "utils/functions";
import { useState } from "react";
import NextLink from "./NextLink";

const ProductPageError = () => {
  const router = useRouter();
  const { lang } = useParams();
  // @ts-ignore
  const languageVariable = lang.split("-")[1];
  const [isRetrying, setIsRetrying] = useState(false);

  const translate = (key: string) => {
    return translateFunction(key, languageVariable);
  };

  const handleBackToHome = () => {
    router.push(`/${lang}`);
  };

  const handleTryAgain = () => {
    setIsRetrying(true);
    // Reload the current page
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Animated Error Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Main circle with pulse animation */}
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Floating dots animation */}
            <div
              className="absolute -top-2 -right-2 w-4 h-4 bg-red-400 rounded-full animate-bounce"
              style={{ animationDelay: "0s" }}
            ></div>
            <div
              className="absolute -bottom-2 -left-2 w-3 h-3 bg-red-300 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="absolute -top-1 -left-1 w-2 h-2 bg-red-200 rounded-full animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        </div>

        {/* Error Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 regular">
            {translate("Product Not Found")}
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed light">
            {translate(
              "Sorry, we couldn't load this product. It might have been removed or is temporarily unavailable."
            )}
          </p>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <p className="text-gray-500 text-sm light">
              {translate(
                "Don't worry, you can try again or browse our other amazing products."
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <NextLink
            href={`/${lang}`}
            data={{
              href: `/${lang}`,
              is_full_home: true,
            }}
          >
            <button
              //   onClick={handleBackToHome}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl regular"
            >
              {translate("Back to Home")}
            </button>
          </NextLink>

          <button
            onClick={handleTryAgain}
            disabled={isRetrying}
            className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed regular"
          >
            {isRetrying ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {translate("Retrying...")}
              </div>
            ) : (
              translate("Try Again")
            )}
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="mt-12 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
          <div
            className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProductPageError;
