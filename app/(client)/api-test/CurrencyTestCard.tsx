"use client";

import { useState, useEffect } from "react";
import { RoundPrice } from "utils/functions";

interface Currency {
  id: number;
  name: string;
  symbol: string;
  code: string;
  exchange_rate: number;
  decimal_digits: number;
}

interface Country {
  value: string;
  label: string;
}

const CurrencyTestCard = () => {
  const [price, setPrice] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [roundedPrice, setRoundedPrice] = useState<string | number>("");
  const [returnNumber, setReturnNumber] = useState<boolean>(false);

  const countries: Country[] = [
    { value: "sy", label: "Syria" },
    { value: "tr", label: "Turkey" },
    { value: "lb", label: "Lebanon" },
    { value: "iq", label: "Iraq" },
    // { value: "eg", label: "Egypt" },
  ];

  // Fetch currency when country is selected
  useEffect(() => {
    if (selectedCountry) {
      fetchCurrency(selectedCountry);
    } else {
      setCurrency(null);
      setRoundedPrice("");
    }
  }, [selectedCountry]);

  // Calculate rounded price when price or currency changes
  useEffect(() => {
    if (price && currency) {
      try {
        const result = RoundPrice({
          num: parseFloat(price),
          rate: currency.exchange_rate,
          returnNumber: returnNumber,
          points: currency.decimal_digits,
        });
        setRoundedPrice(result);
      } catch (err) {
        setRoundedPrice("Error calculating price");
      }
    } else {
      setRoundedPrice("");
    }
  }, [price, currency, returnNumber]);

  const fetchCurrency = async (country: string) => {
    setLoading(true);
    setError("");
    setCurrency(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/mobile/home/currency?lang=en&country=${country}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            country: country,
            lang: "en",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data?.data?.currency) {
        setCurrency(data.data.currency);
      } else {
        throw new Error("Invalid currency data received");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch currency");
      console.error("Currency fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPrice(value);
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 max-w-[960px] self-center w-full">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        Currency Price Tester
      </h2>

      <div className="space-y-4">
        {/* Price Input */}
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Enter Price
          </label>
          <input
            id="price"
            type="text"
            value={price}
            onChange={handlePriceChange}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Country Select */}
        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Country
          </label>
          <select
            id="country"
            value={selectedCountry}
            onChange={handleCountryChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">-- Select a country --</option>
            {countries.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>

        {/* Return Number Checkbox */}
        <div className="flex items-center gap-2">
          <input
            id="returnNumber"
            type="checkbox"
            checked={returnNumber}
            onChange={(e) => setReturnNumber(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label
            htmlFor="returnNumber"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            For cart & order prices (returnNumber)
          </label>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-blue-600 text-sm">Loading currency data...</div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Currency Information */}
        {currency && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-md">
            <h3 className="font-semibold text-gray-800 mb-2">
              Currency Details
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-600">Currency Name</p>
                <p className="font-medium text-gray-900">{currency.name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-600">Currency Code</p>
                <p className="font-medium text-gray-900">{currency.code}</p>
              </div>

              <div>
                <p className="text-xs text-gray-600">Symbol</p>
                <p className="font-medium text-gray-900">{currency.symbol}</p>
              </div>

              <div>
                <p className="text-xs text-gray-600">Exchange Rate</p>
                <p className="font-medium text-gray-900">
                  {currency.exchange_rate}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600">Decimal Digits</p>
                <p className="font-medium text-gray-900">
                  {currency.decimal_digits}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rounded Price Result */}
        {roundedPrice !== "" && (
          <div className="p-4 bg-blue-50 rounded-md border-l-4 border-blue-500">
            <h3 className="font-semibold text-blue-900 mb-2">
              RoundPrice Result
            </h3>
            <p className="text-2xl font-bold text-blue-700">
              {roundedPrice}
              {currency && (
                <span className="ml-2 text-lg">{currency.symbol}</span>
              )}
            </p>
            {price && currency && (
              <p className="text-sm text-blue-600 mt-2">
                Original: {price} × Exchange Rate: {currency.exchange_rate} ={" "}
                {(parseFloat(price) * currency.exchange_rate).toFixed(
                  currency.decimal_digits
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyTestCard;
