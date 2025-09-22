import React, { useEffect, useRef, useState } from "react";
import { GetImageUrl } from "utils/tinyUtils";
import { pollinateInput } from "@/utils/tinyUtils";

const AsyncSelectCustom = ({
  placeholder,
  onSearch,
  options,
  onChange,
  onClear,
  isLoading,
  className,
  selectedOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [internalSelectedOption, setInternalSelectedOption] = useState<{
    label: string;
    value: string;
    images: { file_path: string };

    price?: number;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (!internalSelectedOption) {
          setSearchTerm("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [internalSelectedOption]);

  useEffect(() => {
    if (selectedOption) {
      setInternalSelectedOption(selectedOption);
      setSearchTerm(selectedOption.label);
    }
  }, [selectedOption]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = pollinateInput(e.target.value);
    setSearchTerm(value);
    if (value.length > 0) {
      await onSearch(value);
    }
  };

  const handleOptionClick = (option: {
    label: string;
    value: string;
    images: { file_path: string };

    price?: number;
  }) => {
    setInternalSelectedOption(option);
    setSearchTerm(option.label);
    onChange(option);
    setIsOpen(false);
  };

  const handleClear = () => {
    setInternalSelectedOption(null);
    setSearchTerm("");
    onChange(null);
    onClear?.();
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!internalSelectedOption) {
        setSearchTerm("");
      }
    }, 200);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (internalSelectedOption) {
      onSearch(internalSelectedOption.label);
    } else {
      setSearchTerm("");
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-gray-900 placeholder-gray-400 transition-colors"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <div
          className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2"
          data-cy="end-compare"
        >
          {searchTerm && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-blue-500 focus:text-blue-600 transition-colors"
              type="button"
            >
              <svg
                data-cy="end-compare-svg"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6" />
                <path d="M9 9l6 6" />
              </svg>
            </button>
          )}
          {isLoading && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.length > 0 ? (
            options?.map((option) => (
              <div
                key={option?.value}
                className="px-4 py-2 cursor-pointer hover:bg-blue-50 flex items-center gap-3 transition-colors"
                onClick={() => handleOptionClick(option)}
              >
                {option.images?.file_path && (
                  <img
                    src={GetImageUrl(option.images?.file_path)}
                    alt={option.label}
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {option.label}
                  </div>
                  {option?.price && (
                    <div className="text-sm text-gray-600">
                      ${option.price.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500 regular">
              {isLoading ? "Loading..." : "No options found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AsyncSelectCustom;
