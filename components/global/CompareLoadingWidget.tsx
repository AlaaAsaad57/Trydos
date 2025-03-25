import React from "react";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";

const CompareLoadingWidget = () => {
  const { lang } = useParams();
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8 max-w-lg text-center px-4">
        {/* Full Logo SVG */}

        {/* Loading Animation */}
        <div className="relative animate-fade-in">
          <svg className="animate-spin h-16 w-16" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="#f64f64"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>

          {/* Compare Icon Animation */}

          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="25"
            height="25"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-red-500"
            viewBox="0 0 25 25"
          >
            <g
              id="Mask_Group_364"
              data-name="Mask Group 364"
              clipPath="url(#clipPath)"
            >
              <g
                id="Group_3489"
                data-name="Group 3489"
                transform="translate(3.75 0)"
              >
                <g id="Group_3488" data-name="Group 3488">
                  <g
                    id="Rectangle_4149"
                    data-name="Rectangle 4149"
                    fill="none"
                    stroke="#404040"
                    strokeWidth="0.625"
                  >
                    <rect width="17.5" height="12.5" rx="2.5" stroke="none" />
                    <rect
                      x="0.313"
                      y="0.313"
                      width="16.875"
                      height="11.875"
                      rx="2.188"
                      fill="none"
                    />
                  </g>
                  <rect
                    id="Rectangle_4150"
                    data-name="Rectangle 4150"
                    width="5"
                    height="7.5"
                    rx="1.25"
                    transform="translate(6.25 2.5)"
                    fill="#8e8e8e"
                  />
                </g>
                <g
                  id="Group_3486"
                  data-name="Group 3486"
                  transform="translate(0 12.5)"
                >
                  <g
                    id="Rectangle_4148"
                    data-name="Rectangle 4148"
                    fill="none"
                    stroke="#404040"
                    strokeWidth="0.625"
                  >
                    <rect width="17.5" height="12.5" rx="2.5" stroke="none" />
                    <rect
                      x="0.313"
                      y="0.313"
                      width="16.875"
                      height="11.875"
                      rx="2.188"
                      fill="none"
                    />
                  </g>
                  <rect
                    id="Rectangle_4151"
                    data-name="Rectangle 4151"
                    width="5"
                    height="7.5"
                    rx="1.25"
                    transform="translate(6.25 2.5)"
                    fill="#8e8e8e"
                  />
                </g>
              </g>
            </g>
          </svg>
        </div>

        {/* Description */}
        <div className="space-y-3 animate-fade-in">
          <h2 className="text-2xl font-semibold text-gray-800">
            {translateFunction(
              "Product Comparison",
              lang?.toString().split("-")[1]
            )}
          </h2>
          <p className="text-gray-600">
            {translateFunction(
              "Loading your selected products for a detailed side-by-side comparison. This will help you make an informed decision by comparing features, prices, and specifications.",
              lang?.toString().split("-")[1]
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompareLoadingWidget;
