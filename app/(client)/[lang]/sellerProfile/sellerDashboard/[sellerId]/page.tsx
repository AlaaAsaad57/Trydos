"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
import { useSellerProfile } from "../../SellerProfileContext";
import Spinner from "components/global/Spinner";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, getConfiguredImage } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";

type TabType = "products" | "boutiques" | "permissions";

const PERMISSION_GROUPS = {
  PRODUCTS: ["READ_PRODUCTS", "CREATE_PRODUCT", "UPDATE_PRODUCT", "CHANGE_PRODUCT_STATUS"],
  BOUTIQUES: ["READ_BUTIKS", "CREATE_BUTIKS", "UPDATE_BUTIKS", "DELETE_BUTIKS", "CHANGE_BOUTIQUE_STATUS"],
  CATEGORIES: ["READ_CATEGORIES", "CREATE_CATEGORIES", "UPDATE_CATEGORIES", "DELETE_CATEGORIES", "CHANGE_CATEGORY_STATUS"],
  BRANDS: ["READ_BRANDS", "CREATE_BRANDS", "UPDATE_BRANDS", "DELETE_BRANDS", "CHANGE_BRAND_STATUS"],
  EMPLOYEES: ["READ_EMPLOYEES", "CREATE_EMPLOYEES", "UPDATE_EMPLOYEES", "DELETE_EMPLOYEES"],
  ROLES: ["READ_ROLES", "CREATE_ROLES", "UPDATE_ROLES", "DELETE_ROLES"],
  JOBTITLES: ["READ_JOBTITLES", "CREATE_JOBTITLES", "UPDATE_JOBTITLES", "DELETE_JOBTITLES"],
  OFFICES: ["READ_OFFICES", "CREATE_OFFICES", "UPDATE_OFFICES", "DELETE_OFFICES"],
  DEPARTMENTS: ["READ_DEPARTMENTS", "CREATE_DEPARTMENTS", "UPDATE_DEPARTMENTS", "DELETE_DEPARTMENTS"],
  WORKFORMS: ["READ_WORKFORMS", "CREATE_WORKFORMS", "UPDATE_WORKFORMS", "DELETE_WORKFORMS"],
  LANGUAGES: ["READ_LANGUAGES", "CREATE_LANGUAGES", "UPDATE_LANGUAGES", "DELETE_LANGUAGES"],
  CURRENCIES: ["READ_CURRENCIES", "CREATE_CURRENCIES", "UPDATE_CURRENCIES", "DELETE_CURRENCIES"],
  SHIPPING: ["READ_SHIPPING", "CREATE_SHIPPING", "UPDATE_SHIPPING", "DELETE_SHIPPING"],
  COUNTRIES: ["READ_COUNTRIES", "CREATE_COUNTRIES", "UPDATE_COUNTRIES", "DELETE_COUNTRIES"],
  ADMIN: ["SUPER_ADMIN", "USER_MANAGEMENT_ACCESS"],
};

const getPermissionGroup = (permission: string): string => {
  for (const [group, permissions] of Object.entries(PERMISSION_GROUPS)) {
    if (permissions.includes(permission)) {
      return group;
    }
  }
  return "OTHER";
};

const formatPermissionName = (permission: string): string => {
  return permission
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

function SellerDashBoard() {
  const params = useParams();
  const sellerId = params.sellerId as string;
  const {
    loading,
    setLoading,
    sellerProducts,
    setSellerProducts,
    sellerBoutiques,
    setSellerBoutiques,
    sellerPermissions,
    setSellerPermissions,
    shopes,
  } = useSellerProfile();

  const [activeTab, setActiveTab] = useState<TabType>("products");
  const [error, setError] = useState<string | null>(null);
  const [productsMeta, setProductsMeta] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const currentShop = useMemo(() => {
    return shopes.find((shop) => shop.seller_id.toString() === sellerId);
  }, [shopes, sellerId]);

  const getSellerProducts = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await SellerDashboardService.getSellerProducts(sellerId, page);
      // API returns { data: { products: [...], meta: {...} } }
      const products = res.data?.products || res.data || [];
      setSellerProducts(products);
      setProductsMeta(res.data?.meta || null);
      setCurrentPage(page);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setError(error?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const getSellerBoutiques = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await SellerDashboardService.getSellerBoutiques(sellerId);
      // API returns { data: { boutiques: [...], meta: {...} } }
      const boutiques = res.data?.boutiques || res.data || [];
      setSellerBoutiques(Array.isArray(boutiques) ? boutiques : []);
    } catch (error: any) {
      console.error("Error fetching boutiques:", error);
      setError(error?.message || "Failed to load boutiques");
    } finally {
      setLoading(false);
    }
  };

  const getSellerPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      // First try to use permissions from currentShop (from context)
      if (currentShop?.permissions && currentShop.permissions.length > 0) {
        setSellerPermissions(currentShop.permissions);
        setLoading(false);
        return;
      }
      // Fallback: fetch from API
      const res = await SellerDashboardService.getSellerPermissions(sellerId);
      // API returns array of shops: [{ seller_id, shop_name, permissions: [...] }]
      const shopData = Array.isArray(res.data) 
        ? res.data.find((shop: any) => shop.seller_id?.toString() === sellerId)
        : null;
      const permissions = shopData?.permissions || currentShop?.permissions || [];
      setSellerPermissions(Array.isArray(permissions) ? permissions : []);
    } catch (error: any) {
      console.error("Error fetching permissions:", error);
      setError(error?.message || "Failed to load permissions");
      // Fallback to currentShop permissions if available
      if (currentShop?.permissions) {
        setSellerPermissions(currentShop.permissions);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sync permissions from currentShop when available
  useEffect(() => {
    if (currentShop?.permissions && currentShop.permissions.length > 0) {
      setSellerPermissions(currentShop.permissions);
    }
  }, [currentShop]);

  useEffect(() => {
    if (sellerId) {
      getSellerProducts();
      getSellerBoutiques();
      // Only fetch permissions if not already available from currentShop
      if (!currentShop?.permissions || currentShop.permissions.length === 0) {
        getSellerPermissions();
      }
    }
  }, [sellerId]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, string[]> = {};
    sellerPermissions.forEach((permission) => {
      const group = getPermissionGroup(permission);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(permission);
    });
    return groups;
  }, [sellerPermissions]);

  const hasPermission = (permission: string): boolean => {
    return sellerPermissions.includes(permission) || sellerPermissions.includes("SUPER_ADMIN");
  };

  const renderProducts = () => {
    if (loading && sellerProducts.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <span className="ml-3 text-[#3c3c3c]">Loading products...</span>
        </div>
      );
    }

    if (error && sellerProducts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => getSellerProducts(1)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      );
    }

    if (sellerProducts.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-[#8D8D8D]">No products found</p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sellerProducts.map((product: any) => (
            <div
              key={product.product_id || product.id}
              className="bg-white rounded-[15px] shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative w-full h-[200px] bg-[#f8f8f8]">
                {product.images?.[0] ? (
                  <img
                    src={getConfiguredImage({
                      src: GetImageUrl(
                        typeof product.images[0] === "string"
                          ? product.images[0]
                          : product.images[0]?.file_path || product.images[0]
                      ),
                      width: 200,
                      height: 200,
                      q: 75,
                    })}
                    alt={product.name || "Product"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8D8D8D]">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-[14px] font-medium text-[#1d1d1d] mb-2 line-clamp-2">
                  {product.name || "Unnamed Product"}
                </h3>
                {product.categories?.[0]?.name && (
                  <p className="text-[12px] text-[#8D8D8D] mb-2">
                    {product.categories[0].name}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    {product.unit_price && (
                      <p className="text-[16px] font-semibold text-[#1d1d1d]">
                        {product.unit_price.toFixed(2)}
                      </p>
                    )}
                    {product.current_stock !== undefined && (
                      <p className="text-[12px] text-[#8D8D8D]">
                        Stock: {product.current_stock}
                      </p>
                    )}
                  </div>
                  {product.status !== undefined && (
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-medium ${
                        product.status === 1
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {product.status === 1 ? "Active" : "Inactive"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Pagination */}
        {productsMeta && productsMeta.last_page > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => getSellerProducts(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[#1d1d1d] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-[14px] text-[#8D8D8D]">
              Page {productsMeta.current_page} of {productsMeta.last_page}
            </span>
            <button
              onClick={() => getSellerProducts(currentPage + 1)}
              disabled={currentPage >= productsMeta.last_page || loading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[#1d1d1d] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  };

  const renderBoutiques = () => {
    if (loading && (!sellerBoutiques || sellerBoutiques.length === 0)) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <span className="ml-3 text-[#3c3c3c]">Loading boutiques...</span>
        </div>
      );
    }

    if (error && (!sellerBoutiques || sellerBoutiques.length === 0)) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={getSellerBoutiques}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!sellerBoutiques || sellerBoutiques.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-[#8D8D8D]">No boutiques found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sellerBoutiques.map((boutique: any) => (
          <div
            key={boutique.id}
            className="bg-white rounded-[15px] shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative w-full h-[150px] bg-[#f8f8f8]">
              {boutique.icon ? (
                <img
                  src={getConfiguredImage({
                    src: GetImageUrl(boutique.icon),
                    width: 200,
                    height: 150,
                    q: 75,
                  })}
                  alt={boutique.name || "Boutique"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#8D8D8D]">
                  No Image
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-[16px] font-semibold text-[#1d1d1d] flex-1">
                  {boutique.name || "Unnamed Boutique"}
                </h3>
                {boutique.status !== undefined && (
                  <span
                    className={`px-2 py-1 rounded text-[10px] font-medium ml-2 ${
                      boutique.status === 1
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {boutique.status === 1 ? "Active" : "Inactive"}
                  </span>
                )}
              </div>
              {boutique.description && (
                <p className="text-[12px] text-[#8D8D8D] line-clamp-2 mb-2">
                  {boutique.description.replace(/<[^>]*>/g, "").substring(0, 100)}
                  {boutique.description.replace(/<[^>]*>/g, "").length > 100 && "..."}
                </p>
              )}
              {boutique.slug && (
                <p className="text-[10px] text-[#8D8D8D]">/{boutique.slug}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPermissions = () => {
    if (loading && sellerPermissions.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <span className="ml-3 text-[#3c3c3c]">Loading permissions...</span>
        </div>
      );
    }

    if (error && sellerPermissions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={getSellerPermissions}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      );
    }

    if (sellerPermissions.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-[#8D8D8D]">No permissions assigned</p>
        </div>
      );
    }

    const isSuperAdmin = sellerPermissions.includes("SUPER_ADMIN");

    return (
      <div className="space-y-6">
        {isSuperAdmin && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-[15px] mb-6">
            <div className="flex items-center gap-2">
              <span className="text-[20px]">⭐</span>
              <div>
                <h3 className="text-[18px] font-bold">Super Admin</h3>
                <p className="text-[12px] opacity-90">
                  You have full access to all features
                </p>
              </div>
            </div>
          </div>
        )}

        {Object.entries(groupedPermissions).map(([group, permissions]) => (
          <div key={group} className="bg-white rounded-[15px] shadow-md p-6">
            <h3 className="text-[16px] font-semibold text-[#1d1d1d] mb-4 pb-2 border-b border-[#f0f0f0]">
              {group.replace(/_/g, " ")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {permissions.map((permission) => {
                const permissionType = permission.includes("READ")
                  ? "read"
                  : permission.includes("CREATE")
                  ? "create"
                  : permission.includes("UPDATE")
                  ? "update"
                  : permission.includes("DELETE")
                  ? "delete"
                  : "other";

                const typeColors = {
                  read: "bg-blue-100 text-blue-700 border-blue-200",
                  create: "bg-green-100 text-green-700 border-green-200",
                  update: "bg-yellow-100 text-yellow-700 border-yellow-200",
                  delete: "bg-red-100 text-red-700 border-red-200",
                  other: "bg-gray-100 text-gray-700 border-gray-200",
                };

                return (
                  <div
                    key={permission}
                    className={`px-3 py-2 rounded-lg border text-[12px] font-medium ${typeColors[permissionType]}`}
                  >
                    {formatPermissionName(permission)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1366px] mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-[24px] font-bold text-[#1d1d1d] mb-2">
          {currentShop?.shop_name || "Seller Dashboard"}
        </h1>
        <p className="text-[14px] text-[#8D8D8D]">
          Seller ID: {sellerId}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex flex-row border-b border-[#f0f0f0]">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === "products"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-[#8D8D8D] hover:text-[#1d1d1d]"
            }`}
          >
            Products ({sellerProducts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("boutiques")}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === "boutiques"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-[#8D8D8D] hover:text-[#1d1d1d]"
            }`}
          >
            Boutiques ({sellerBoutiques?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("permissions")}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === "permissions"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-[#8D8D8D] hover:text-[#1d1d1d]"
            }`}
          >
            Permissions ({sellerPermissions?.length || 0})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-md p-6 min-h-[400px]">
        {activeTab === "products" && renderProducts()}
        {activeTab === "boutiques" && renderBoutiques()}
        {activeTab === "permissions" && renderPermissions()}
      </div>
    </div>
  );
}

export default SellerDashBoard;
