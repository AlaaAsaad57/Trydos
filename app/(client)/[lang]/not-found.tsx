"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";

export default function NotFound() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "gb-en";
  const isArabic = lang?.split("-")[1] === "ar";

  useEffect(() => {
    const { setIsNavigating } = useAppStore.getState();
    setIsNavigating(null);

    // If no lang param, redirect to default
    if (!params?.lang) {
      const storedCountry = localStorage.getItem("country") || "gb";
      const storedLang = localStorage.getItem("lang") || "en";
      router.replace(`/${storedCountry}-${storedLang}`);
    }
  }, [params, router]);

  const content = {
    "gb-en": {
      title: "404",
      subtitle: "Oops! Page Not Found",
      description:
        "We couldn't find the page you're looking for. It might have been moved or doesn't exist.",
      buttonText: "Back to Home",
      searchTip: "Try searching for what you need or explore our categories",
    },
    "sa-ar": {
      title: "404",
      subtitle: "عذراً! الصفحة غير موجودة",
      description:
        "لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم نقلها أو أنها غير موجودة.",
      buttonText: "العودة إلى الرئيسية",
      searchTip: "جرب البحث عما تحتاجه أو تصفح فئاتنا",
    },
    "ae-en": {
      title: "404",
      subtitle: "Oops! Page Not Found",
      description:
        "We couldn't find the page you're looking for. It might have been moved or doesn't exist.",
      buttonText: "Back to Home",
      searchTip: "Try searching for what you need or explore our categories",
    },
    "ae-ar": {
      title: "404",
      subtitle: "عذراً! الصفحة غير موجودة",
      description:
        "لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم نقلها أو أنها غير موجودة.",
      buttonText: "العودة إلى الرئيسية",
      searchTip: "جرب البحث عما تحتاجه أو تصفح فئاتنا",
    },
  };

  const currentContent = content[lang] || content["gb-en"];

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Icon/Illustration */}
        <div className="mb-8 relative">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gray-100 mb-4">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Large 404 Text */}
          <h1 className="text-8xl font-bold text-gray-200 absolute top-0 left-1/2 transform -translate-x-1/2 -z-10">
            {currentContent.title}
          </h1>
        </div>

        {/* Error Message */}
        <h2 className="text-3xl font-semibold text-gray-800 mb-4 font-quicksand-semibold">
          {currentContent.subtitle}
        </h2>

        <p className="text-lg text-gray-600 mb-8 font-quicksand-regular max-w-lg mx-auto">
          {currentContent.description}
        </p>

        {/* Search Tip */}
        <p className="text-sm text-gray-500 mb-8 font-quicksand-light">
          {currentContent.searchTip}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center justify-center px-8 py-4 text-white bg-black hover:bg-gray-800 rounded-full transition-all duration-300 font-quicksand-medium text-lg min-w-[200px] group"
          >
            <svg
              className={`w-5 h-5 ${
                isArabic
                  ? "ml-2 group-hover:translate-x-1"
                  : "mr-2 group-hover:-translate-x-1"
              } transition-transform`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isArabic ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
              />
            </svg>
            {currentContent.buttonText}
          </Link>

        </div>

        {/* Popular Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4 font-quicksand-regular">
            {isArabic ? "روابط شائعة:" : translateFunction("Popular Links:")}
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href={`/${lang}/featured`}
              className="text-gray-600 hover:text-black transition-colors font-quicksand-regular"
            >
              {isArabic ? "المنتجات المميزة" : translateFunction("Featured Products")}
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href={`/${lang}/flashDeals`}
              className="text-gray-600 hover:text-black transition-colors font-quicksand-regular"
            >
              {isArabic ? "العروض السريعة" : translateFunction("Flash Deals")}
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href={`/${lang}/filters/boutiques`}
              className="text-gray-600 hover:text-black transition-colors font-quicksand-regular"
            >
              {isArabic ? "البوتيكات" : translateFunction("Boutiques")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
