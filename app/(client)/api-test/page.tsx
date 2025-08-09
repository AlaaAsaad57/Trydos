"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";

interface Header {
  key: string;
  value: string;
  id: string;
}

interface Response {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  time: number;
}

interface ApiEndpoint {
  name: string;
  url: string;
  method: string;
  server: ServerType;
  description?: string;
}

type ServerType = "market" | "elastic" | "chat" | "stories";

export default function ApiTestPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [server, setServer] = useState<ServerType>("market");
  const [language, setLanguage] = useState("en");
  const [country, setCountry] = useState("sy");
  const [headers, setHeaders] = useState<Header[]>([]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"headers" | "body">("headers");
  const [responseTab, setResponseTab] = useState<"body" | "headers">("body");
  const [selectedEndpoint, setSelectedEndpoint] = useState("");

  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

  const languages = [
    { value: "en", label: "English" },
    { value: "ar", label: "العربية" },
    { value: "tr", label: "Türkçe" },
    { value: "ku", label: "کوردی" },
  ];

  const countries = [
    { value: "sy", label: "Syria" },
    { value: "tr", label: "Turkey" },
    { value: "lb", label: "Lebanon" },
    { value: "jo", label: "Jordan" },
    { value: "eg", label: "Egypt" },
  ];

  const servers: { value: ServerType; label: string; baseUrl: string }[] = [
    {
      value: "market",
      label: "Market API",
      baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "",
    },
    {
      value: "elastic",
      label: "Elastic API",
      baseUrl: process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL || "",
    },
    {
      value: "chat",
      label: "Chat API",
      baseUrl: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL || "",
    },
    {
      value: "stories",
      label: "Stories API",
      baseUrl: process.env.NEXT_PUBLIC_STORIES_BACKEND_URL || "",
    },
  ];

  const apiEndpoints: ApiEndpoint[] = [
    // Market API endpoints
    {
      name: "Home Boutiques",
      url: "/api/home/boutiques",
      method: "GET",
      server: "elastic",
    },
    {
      name: "product meta",
      url: "/web/product/product-meta/{slug}",
      method: "GET",
      server: "market",
    },
    {
      name: "Main Categories",
      url: "/api/home/mainCategories",
      method: "GET",
      server: "elastic",
    },
    {
      name: "Starting Settings",
      url: "/web/home/startingSettings",
      method: "GET",
      server: "market",
    },
    {
      name: "Customer Info",
      url: "/customer/info",
      method: "GET",
      server: "market",
    },
    {
      name: "Currency",
      url: "/mobile/home/currency",
      method: "GET",
      server: "market",
    },
    {
      name: "Product Search",
      url: "/api/products/searchInCatalog",
      method: "GET",
      server: "elastic",
    },
    {
      name: "Popular Search",
      url: "/api/products/popular-search",
      method: "GET",
      server: "market",
    },
    {
      name: "Featured Products",
      url: "/api/products/featured",
      method: "GET",
      server: "elastic",
    },
    {
      name: "Boutique Details",
      url: "/web/boutique/simpleDetails/{id}",
      method: "GET",
      server: "market",
    },
    {
      name: "Product Details",
      url: "/web/product/simpleDetails/{id}",
      method: "GET",
      server: "market",
    },
    {
      name: "Orders List",
      url: "/customer/order/list",
      method: "GET",
      server: "market",
    },
    {
      name: "Cart Checkout",
      url: "/customer/order/checkout/{payment_method}",
      method: "POST",
      server: "market",
    },
    {
      name: "Address List",
      url: "/customer/address/list",
      method: "GET",
      server: "market",
    },
    {
      name: "Add Address",
      url: "/customer/address/add",
      method: "POST",
      server: "market",
    },
    {
      name: "Update Profile",
      url: "/customer/update-profile",
      method: "POST",
      server: "market",
    },
    {
      name: "Notifications",
      url: "/user-notifications/get",
      method: "GET",
      server: "market",
    },

    // Chat API endpoints
    {
      name: "Chat Login",
      url: "/api/v1/users/login",
      method: "POST",
      server: "chat",
    },
    {
      name: "My Channels",
      url: "/api/v2/channels/my_channels",
      method: "GET",
      server: "chat",
    },
    {
      name: "My Contacts",
      url: "/api/v1/users/my_contacts",
      method: "GET",
      server: "chat",
    },
    {
      name: "Send Message",
      url: "/api/v1/messages/send",
      method: "POST",
      server: "chat",
    },
    {
      name: "Channel Messages",
      url: "/api/v1/messages/messages_of_channel/{id}",
      method: "GET",
      server: "chat",
    },
    {
      name: "My Calls",
      url: "/api/v1/channels/my_calls",
      method: "GET",
      server: "chat",
    },
    {
      name: "Video Call",
      url: "/api/v1/messages/video_call",
      method: "POST",
      server: "chat",
    },
    {
      name: "Voice Call",
      url: "/api/v1/messages/voice_call",
      method: "POST",
      server: "chat",
    },
    {
      name: "End Call",
      url: "/api/v1/end_call",
      method: "POST",
      server: "chat",
    },
    {
      name: "Search Users",
      url: "/api/v1/users/search/",
      method: "GET",
      server: "chat",
    },

    // Stories API endpoints
    {
      name: "Stories Login",
      url: "/api/v1/users/login",
      method: "POST",
      server: "stories",
    },
    {
      name: "User Stories",
      url: "/api/v1/stories/users_stories",
      method: "GET",
      server: "stories",
    },
    {
      name: "Upload Story",
      url: "/api/v1/stories/upload_story",
      method: "POST",
      server: "stories",
    },
    {
      name: "Product Stories",
      url: "/api/v1/stories/product_stories/{id}",
      method: "GET",
      server: "stories",
    },
    {
      name: "Increase Viewers",
      url: "/api/v1/stories/increase_viewers/{id}",
      method: "POST",
      server: "stories",
    },

    // Additional Market API - Products
    {
      name: "Product Views",
      url: "/api/products/view",
      method: "POST",
      server: "market",
    },
    {
      name: "Product Global Details",
      url: "/web/product/globalDetails/{slug}",
      method: "GET",
      server: "market",
    },
    {
      name: "Product Qty Price Details",
      url: "/web/product/qtyPriceDetails/{slug}",
      method: "GET",
      server: "market",
    },
    {
      name: "Product Likes Details",
      url: "/web/product/likesDetails/{slug}",
      method: "GET",
      server: "market",
    },
    {
      name: "Product Comments Shares",
      url: "/web/product/CommentsSharesDetails/{slug}",
      method: "GET",
      server: "market",
    },
    {
      name: "Product Like Store",
      url: "/product_likes/store",
      method: "POST",
      server: "market",
    },
    {
      name: "Product Like Delete",
      url: "/product_likes/delete",
      method: "POST",
      server: "market",
    },
    {
      name: "Product Comment",
      url: "/customer/product_comment",
      method: "POST",
      server: "market",
    },

    // Additional Market API - Cart
    {
      name: "Cart Add",
      url: "/cart/add",
      method: "POST",
      server: "market",
    },
    {
      name: "Cart Update",
      url: "/cart/update",
      method: "POST",
      server: "market",
    },
    {
      name: "Cart Remove",
      url: "/cart/remove",
      method: "POST",
      server: "market",
    },
    {
      name: "Cart Convert to Old",
      url: "/cart/convert_to_old",
      method: "POST",
      server: "market",
    },
    {
      name: "Cart Shipping",
      url: "/cart/cart_shipping",
      method: "GET",
      server: "market",
    },
    {
      name: "Cart Overview",
      url: "/cart/cart_overview",
      method: "GET",
      server: "market",
    },
    {
      name: "Old Cart Get",
      url: "/old-cart/get_old_cart",
      method: "GET",
      server: "market",
    },
    {
      name: "Old Cart Hide",
      url: "/old-cart/hide",
      method: "POST",
      server: "market",
    },

    // Additional Market API - Orders & Addresses
    {
      name: "Orders by Group ID",
      url: "/customer/order/getOrdersByOrderGroupID",
      method: "GET",
      server: "market",
    },
    {
      name: "Orders by Cart Group ID",
      url: "/customer/order/getOrdersByCartGroupID",
      method: "GET",
      server: "market",
    },
    {
      name: "Address Update",
      url: "/customer/address/update",
      method: "POST",
      server: "market",
    },
    {
      name: "Address Delete",
      url: "/customer/address/delete",
      method: "POST",
      server: "market",
    },
    {
      name: "Address Set Default",
      url: "/customer/address/set-default",
      method: "POST",
      server: "market",
    },
    {
      name: "Get Provinces by ISO",
      url: "/api/addresses/get-provinces-by-iso",
      method: "GET",
      server: "market",
    },
    {
      name: "Get Address by Text",
      url: "/api/addresses/get-address-by-text",
      method: "GET",
      server: "market",
    },
    {
      name: "Country Boundary",
      url: "/api/addresses/CountryBoundaryByIso/{country}",
      method: "GET",
      server: "market",
    },

    // Additional Market API - User Management
    {
      name: "Customer Update Name",
      url: "/customer/update-name",
      method: "POST",
      server: "market",
    },
    {
      name: "Customer Wallet List",
      url: "/customer/wallet/list",
      method: "GET",
      server: "market",
    },
    {
      name: "Countries",
      url: "/countries",
      method: "GET",
      server: "market",
    },

    // Additional Market API - Coupons & Notifications
    {
      name: "Apply Coupon",
      url: "/coupon/apply",
      method: "GET",
      server: "market",
    },
    {
      name: "Notification Types",
      url: "/web/notification_types/customer-notification-to-choose",
      method: "GET",
      server: "market",
    },

    // Market API - Firebase Device Tokens
    {
      name: "Firebase Device Tokens",
      url: "/firebase_device_tokens",
      method: "POST",
      server: "market",
    },
    {
      name: "Firebase Subscribe Topic",
      url: "/firebase_device_tokens/subscribe_topic",
      method: "POST",
      server: "market",
    },
    {
      name: "Firebase Unsubscribe Topic",
      url: "/firebase_device_tokens/unsubscribe_topic",
      method: "POST",
      server: "market",
    },
    {
      name: "Firebase Change Country Language",
      url: "/firebase_device_tokens/change_country_language",
      method: "POST",
      server: "market",
    },
    {
      name: "Firebase Boutique Created",
      url: "/firebase_device_tokens/send_boutique_created",
      method: "POST",
      server: "market",
    },
    {
      name: "Firebase Product Cart Expiration",
      url: "/firebase_device_tokens/send_product_cart_expiration",
      method: "POST",
      server: "market",
    },
    {
      name: "Firebase Product Availability",
      url: "/firebase_device_tokens/send_product_availability",
      method: "POST",
      server: "market",
    },
    {
      name: "Firebase Product Comment",
      url: "/firebase_device_tokens/send_product_comment",
      method: "POST",
      server: "market",
    },
    {
      name: "Firebase Product Discount",
      url: "/firebase_device_tokens/send_product_discount",
      method: "POST",
      server: "market",
    },
    {
      name: "Firebase Category Created",
      url: "/firebase_device_tokens/send_category_created",
      method: "POST",
      server: "market",
    },
    {
      name: "Firebase Product Before Stock Out",
      url: "/firebase_device_tokens/send_product_before_stock_out",
      method: "POST",
      server: "market",
    },
    {
      name: "Firebase Product Price Change",
      url: "/firebase_device_tokens/send_product_when_change_in_price",
      method: "POST",
      server: "market",
    },

    // Market API - Storage & Error Logging
    {
      name: "Storage Upload",
      url: "/storage/storage-upload",
      method: "POST",
      server: "market",
    },
    {
      name: "Mobile Error Log",
      url: "/mobile_error_log/store",
      method: "POST",
      server: "market",
    },

    // Additional Elastic API
    {
      name: "Shared Product Count",
      url: "/api/v2/elastic/shared_count/{id}",
      method: "GET",
      server: "elastic",
    },
    {
      name: "Share Product on Apps",
      url: "/api/v2/elastic/share_product_on_apps",
      method: "POST",
      server: "elastic",
    },
    {
      name: "Channel Search",
      url: "/api/v2/elastic/channelSearch",
      method: "POST",
      server: "elastic",
    },

    // Additional Chat API - Users & Channels
    {
      name: "User Update",
      url: "/api/v1/users/update",
      method: "POST",
      server: "chat",
    },
    {
      name: "User Get by ID",
      url: "/api/v1/users/{id}",
      method: "GET",
      server: "chat",
    },
    {
      name: "Channel Get Date Time",
      url: "/api/v1/channels/get_date_time",
      method: "GET",
      server: "chat",
    },
    {
      name: "Channel Watched",
      url: "/api/v1/channels/{id}/watched",
      method: "POST",
      server: "chat",
    },
    {
      name: "Channel Received",
      url: "/api/v1/channels/{id}/received",
      method: "POST",
      server: "chat",
    },
    {
      name: "Channel Destroy",
      url: "/api/v1/channels/destroy",
      method: "POST",
      server: "chat",
    },
    {
      name: "Channel Media",
      url: "/api/v2/channels/{id}/media",
      method: "GET",
      server: "chat",
    },
    {
      name: "Channel Agora Token",
      url: "/api/v1/channels/{id}/agora_token",
      method: "POST",
      server: "chat",
    },

    // Additional Chat API - Messages & Calls
    {
      name: "Messages Destroy",
      url: "/api/v1/messages/destroy",
      method: "POST",
      server: "chat",
    },
    {
      name: "Share Product",
      url: "/api/v1/messages/share_product",
      method: "POST",
      server: "chat",
    },
    {
      name: "Refuse Call",
      url: "/api/v1/messages/refuse_call/{id}",
      method: "POST",
      server: "chat",
    },
    {
      name: "Answer Call",
      url: "/api/v1/messages/answer_call/{id}",
      method: "POST",
      server: "chat",
    },
    {
      name: "Call Users",
      url: "/api/v1/messages/{id}/users",
      method: "GET",
      server: "chat",
    },
    {
      name: "In Another Call",
      url: "/api/v1/messages/in_another_call/{id}",
      method: "POST",
      server: "chat",
    },
    {
      name: "Start Talking",
      url: "/api/v1/messages/start_talking/{id}",
      method: "POST",
      server: "chat",
    },
    {
      name: "Firebase Tokens",
      url: "/api/v1/firebase_tokens",
      method: "POST",
      server: "chat",
    },

    // Additional Stories API
    {
      name: "Stories User Update",
      url: "/api/v1/users/update",
      method: "POST",
      server: "stories",
    },
    {
      name: "Stories User Get by ID",
      url: "/api/v1/users/{id}",
      method: "GET",
      server: "stories",
    },
  ];

  // Initialize headers with default lang and country
  useEffect(() => {
    const defaultHeaders: Header[] = [
      { key: "lang", value: language, id: "lang" },
      { key: "country", value: country, id: "country" },
      { key: "accept", value: "application/json", id: "accept" },
      { key: "", value: "", id: Date.now().toString() },
    ];
    setHeaders(defaultHeaders);
  }, [language, country]);

  // Update headers when language or country changes
  useEffect(() => {
    setHeaders((prev) =>
      prev.map((header) => {
        if (header.key === "lang") return { ...header, value: language };
        if (header.key === "country") return { ...header, value: country };
        return header;
      })
    );
  }, [language, country]);

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "", id: Date.now().toString() }]);
  };

  const removeHeader = (id: string) => {
    // Prevent removal of default headers
    if (
      ["lang", "country", "accept"].includes(
        headers.find((h) => h.id === id)?.key || ""
      )
    ) {
      return;
    }
    setHeaders(headers.filter((h) => h.id !== id));
  };

  const updateHeader = (id: string, field: "key" | "value", value: string) => {
    setHeaders(
      headers.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    );
  };
  const test = async () => {
    try {
      let data = await getProductsAndFiltersFromElastic({
        country: "tr",
        language_code: "ar",
        filters: {
          boutiques: ["jiber-22"],
          categories: ["running-wear-85"],
        },
        is_from_browser: true,
        limit: 10,
      });
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    test();
  }, []);
  const handleEndpointSelect = (endpointUrl: string) => {
    if (!endpointUrl) {
      setUrl("");
      setSelectedEndpoint("");
      return;
    }

    const endpoint = apiEndpoints.find((ep) => ep.url === endpointUrl);
    if (endpoint) {
      const serverConfig = servers.find((s) => s.value === endpoint.server);
      const fullUrl = serverConfig
        ? serverConfig.baseUrl + endpoint.url
        : endpoint.url;

      setUrl(fullUrl);
      setMethod(endpoint.method);
      setServer(endpoint.server);
      setSelectedEndpoint(endpointUrl);
    }
  };

  const sendRequest = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    const startTime = Date.now();

    try {
      // Build headers object
      const requestHeaders: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key && h.value) {
          requestHeaders[h.key] = h.value;
        }
      });

      // Prepare request options
      const options: RequestInit = {
        method,
        headers: requestHeaders,
      };

      // Add body for methods that support it
      if (["POST", "PUT", "PATCH"].includes(method) && body) {
        options.body = body;
        if (!requestHeaders["Content-Type"]) {
          requestHeaders["Content-Type"] = "application/json";
        }
      }

      const res = await fetch(url, options);
      const responseTime = Date.now() - startTime;

      // Get response headers
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse response body
      let responseBody;
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        responseBody = await res.json();
      } else {
        responseBody = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: responseTime,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return data;
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-600";
    if (status >= 300 && status < 400) return "text-yellow-600";
    if (status >= 400 && status < 500) return "text-orange-600";
    return "text-red-600";
  };

  const filteredEndpoints = apiEndpoints.filter((ep) => ep.server === server);
  const [elasticTestParams, setElasticTestParams] = useState({
    limit: 10,
    filters_offset: 1,
    country: "sy",
    language_code: "en",
    is_from_browser: true,
    search_after: [],
    filters: {
      boutiques: [] as string[],
      categories: [] as string[],
      brands: [] as string[],
      colors: [] as string[],
      sizes: [] as string[],
      search_text: "",
      priceRange: [0, 1000] as [number, number],
      tags_names: [] as string[],
      featured: false,

      flashdeal: false,
    },
  });
  const [elasticResponse, setElasticResponse] = useState<any>(null);
  const [elasticLoading, setElasticLoading] = useState(false);
  const [elasticError, setElasticError] = useState("");

  // Add new function to handle elastic search test
  const handleElasticTest = async () => {
    setElasticLoading(true);
    setElasticError("");
    setElasticResponse(null);

    try {
      const result = await getProductsAndFiltersFromElastic(elasticTestParams);
      setElasticResponse(result);
    } catch (error) {
      setElasticError(
        error instanceof Error ? error.message : "An error occurred"
      );
    } finally {
      setElasticLoading(false);
    }
  };

  // Add new function to update elastic test params
  const updateElasticParams = (
    field: string,
    value: any,
    isFilter: boolean = false
  ) => {
    setElasticTestParams((prev) => {
      if (isFilter) {
        return {
          ...prev,
          filters: {
            ...prev.filters,
            [field]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 *:text-[#383838]">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">API Tester</h1>

        {/* Quick Select Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Quick Select</h2>

          {/* Server and Language/Country Selection */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Server
              </label>
              <select
                value={server}
                onChange={(e) => {
                  setServer(e.target.value as ServerType);
                  setSelectedEndpoint("");
                  setUrl("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {servers.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {countries.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base URL
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600">
                {servers.find((s) => s.value === server)?.baseUrl ||
                  "Not configured"}
              </div>
            </div>
          </div>

          {/* Endpoint Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Endpoint
            </label>
            <select
              value={selectedEndpoint}
              onChange={(e) => handleEndpointSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an endpoint...</option>
              {filteredEndpoints.map((endpoint, index) => (
                <option key={index} value={endpoint.url}>
                  {endpoint.method} - {endpoint.name} ({endpoint.url})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Request Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Request</h2>

          <div className="flex gap-4 mb-6">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {methods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter request URL or select from endpoints above"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={sendRequest}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("headers")}
                className={`pb-2 px-4 font-medium ${
                  activeTab === "headers"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Headers
              </button>
              <button
                onClick={() => setActiveTab("body")}
                className={`pb-2 px-4 font-medium ${
                  activeTab === "body"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Body
              </button>
            </div>
          </div>

          {/* Headers Section */}
          {activeTab === "headers" && (
            <div className="space-y-2">
              {headers.map((header) => {
                const isDefaultHeader = ["lang", "country", "accept"].includes(
                  header.key
                );
                return (
                  <div key={header.id} className="flex gap-2">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) =>
                        updateHeader(header.id, "key", e.target.value)
                      }
                      placeholder="Header name"
                      disabled={isDefaultHeader}
                      className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDefaultHeader ? "bg-gray-100" : ""
                      }`}
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) =>
                        updateHeader(header.id, "value", e.target.value)
                      }
                      placeholder="Header value"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeHeader(header.id)}
                      disabled={isDefaultHeader}
                      className={`px-3 py-2 rounded-md transition-colors ${
                        isDefaultHeader
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      {isDefaultHeader ? "Required" : "Remove"}
                    </button>
                  </div>
                );
              })}
              <button
                onClick={addHeader}
                className="mt-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                + Add Header
              </button>
            </div>
          )}

          {/* Body Section */}
          {activeTab === "body" && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Request body (JSON)"
              className="w-full h-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Response Section */}
        {response && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Response</h2>
              <div className="flex gap-4 text-sm">
                <span
                  className={`font-medium ${getStatusColor(response.status)}`}
                >
                  {response.status} {response.statusText}
                </span>
                <span className="text-gray-600">{response.time}ms</span>
              </div>
            </div>

            {/* Response Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setResponseTab("body")}
                  className={`pb-2 px-4 font-medium ${
                    responseTab === "body"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Body
                </button>
                <button
                  onClick={() => setResponseTab("headers")}
                  className={`pb-2 px-4 font-medium ${
                    responseTab === "headers"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Headers
                </button>
              </div>
            </div>

            {/* Response Body */}
            {responseTab === "body" && (
              <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96 text-sm">
                {typeof response.body === "object"
                  ? formatJson(response.body)
                  : response.body}
              </pre>
            )}

            {/* Response Headers */}
            {responseTab === "headers" && (
              <div className="space-y-1">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-2 py-1">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Elastic Search Test</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Limit
            </label>
            <input
              type="number"
              value={elasticTestParams.limit}
              onChange={(e) =>
                updateElasticParams("limit", parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filters Offset
            </label>
            <input
              type="number"
              value={elasticTestParams.filters_offset}
              onChange={(e) =>
                updateElasticParams("filters_offset", parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={elasticTestParams.country}
              onChange={(e) => updateElasticParams("country", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {countries.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={elasticTestParams.language_code}
              onChange={(e) =>
                updateElasticParams("language_code", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Text
          </label>
          <input
            type="text"
            value={elasticTestParams.filters.search_text}
            onChange={(e) =>
              updateElasticParams("search_text", e.target.value, true)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter search text..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={elasticTestParams.filters.priceRange[0]}
                onChange={(e) =>
                  updateElasticParams(
                    "priceRange",
                    [
                      parseInt(e.target.value),
                      elasticTestParams.filters.priceRange[1],
                    ],
                    true
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Min"
              />
              <input
                type="number"
                value={elasticTestParams.filters.priceRange[1]}
                onChange={(e) =>
                  updateElasticParams(
                    "priceRange",
                    [
                      elasticTestParams.filters.priceRange[0],
                      parseInt(e.target.value),
                    ],
                    true
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Max"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories (comma separated)
            </label>
            <input
              type="text"
              value={elasticTestParams.filters.categories.join(",")}
              onChange={(e) =>
                updateElasticParams(
                  "categories",
                  e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  true
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. category-1, category-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brands (comma separated)
            </label>
            <input
              type="text"
              value={elasticTestParams.filters.brands.join(",")}
              onChange={(e) =>
                updateElasticParams(
                  "brands",
                  e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  true
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. brand-1, brand-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Boutiques (comma separated)
            </label>
            <input
              type="text"
              value={elasticTestParams.filters.boutiques.join(",")}
              onChange={(e) =>
                updateElasticParams(
                  "boutiques",
                  e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  true
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. boutique-1, boutique-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sizes (comma separated)
            </label>
            <input
              type="text"
              value={elasticTestParams.filters.sizes.join(",")}
              onChange={(e) =>
                updateElasticParams(
                  "sizes",
                  e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  true
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. S, M, L, XL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Offset (comma separated)
            </label>
            <input
              type="text"
              value={elasticTestParams.search_after.join(",")}
              onChange={(e) =>
                updateElasticParams(
                  "search_after",
                  e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  false
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. S, M, L, XL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={elasticTestParams.filters.tags_names.join(",")}
              onChange={(e) =>
                updateElasticParams(
                  "tags_names",
                  e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  true
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. tag1, tag2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colors (comma separated)
            </label>
            <input
              type="text"
              value={elasticTestParams.filters.colors.join(",")}
              onChange={(e) =>
                updateElasticParams(
                  "colors",
                  e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  true
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. tag1, tag2"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={elasticTestParams.filters.featured}
                onChange={(e) =>
                  updateElasticParams("featured", e.target.checked, true)
                }
                className="rounded border-gray-300"
              />
              Featured
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={elasticTestParams.filters.flashdeal}
                onChange={(e) =>
                  updateElasticParams("flashdeal", e.target.checked, true)
                }
                className="rounded border-gray-300"
              />
              Flash Deal
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleElasticTest}
            disabled={elasticLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {elasticLoading ? "Testing..." : "Test Elastic Search"}
          </button>
        </div>

        {elasticError && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            {elasticError}
          </div>
        )}

        {elasticResponse && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Response:</h3>
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96 text-sm">
              {JSON.stringify(elasticResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
