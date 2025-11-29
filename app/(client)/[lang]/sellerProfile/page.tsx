"use client";

import { useState } from "react";
import ProductsTab from "components/sellerProfile/ProductsTab";

import BoutiquesTab from "components/sellerProfile/BoutiquesTab";

function Page() {
  const [activeTab, setActiveTab] = useState<
    "products" | "stories" | "boutiques"
  >("products");

  // Mock data - replace with actual data fetching
  const sellerData = {
    name: "John Doe",
    avatar: "https://placehold.co/72x72",
    stats: {
      totalProducts: 124,
      totalPurchases: 856,
      interactions: {
        day: 45,
        month: 1234,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 w-full">
      <div className="max-w-[1366px] mx-auto">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
              <img
                src={sellerData.avatar}
                alt={sellerData.name}
                width={96}
                height={96}
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {sellerData.name}
              </h1>
              <p className="text-gray-500">Seller Profile</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Products */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-2">
              Total Products
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {sellerData.stats.totalProducts}
            </p>
          </div>

          {/* Total Purchases */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-2">
              Total Purchases
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {sellerData.stats.totalPurchases}
            </p>
          </div>

          {/* Total Interactions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-2">
              Total Interactions
            </h3>
            <div className="flex gap-4">
              <div>
                <p className="text-sm text-gray-500">Likes</p>
                <p className="text-2xl font-bold text-purple-600">
                  {sellerData.stats.interactions.day}
                </p>
              </div>
              <div className="border-l border-gray-200"></div>
              <div>
                <p className="text-sm text-gray-500">Comments</p>
                <p className="text-2xl font-bold text-purple-600">
                  {sellerData.stats.interactions.month}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Shares</p>
                <p className="text-2xl font-bold text-purple-600">
                  {sellerData.stats.interactions.month}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("products")}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === "products"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab("boutiques")}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === "boutiques"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Boutiques
            </button>
            <button
              onClick={() => setActiveTab("stories")}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === "stories"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Stories
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "products" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Products</h2>

                <ProductsTab sellerId={"8"} />
              </div>
            )}
            {activeTab === "stories" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Stories</h2>
                <p className="text-gray-500">
                  Stories will be displayed here...
                </p>
              </div>
            )}
            {activeTab === "boutiques" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Boutiques</h2>
                <BoutiquesTab sellerId={"8"} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
