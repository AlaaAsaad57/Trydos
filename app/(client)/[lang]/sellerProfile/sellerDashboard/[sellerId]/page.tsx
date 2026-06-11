"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSellerProfile } from "../../SellerProfileContext";
import Spinner from "components/global/Spinner";
import SellerDashboardService from "services/sellerDashboard";
import auth from "services/auth";
import { translateFunction, getConfiguredImage } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";
import RenderOrders from "components/SellerDashboard/orders";
import GalleryTab from "components/SellerDashboard/GalleryTab";
import StoriesTab from "components/SellerDashboard/StoriesTab";
import CommentsTab from "components/SellerDashboard/CommentsTab";
import ExcelUploadTab from "components/SellerDashboard/ExcelUploadTab";
import BackBar from "components/setting/BackBar";
import ShopInfo from "components/SellerDashboard/ShopInfo";

type TabType =
  | "products"
  | "boutiques"
  | "permissions"
  | "users"
  | "orders"
  | "gallery"
  | "stories"
  | "comments"
  | "excel"
  | "shopInfo"
  | "none";

const PERMISSION_GROUPS = {
  PRODUCTS: [
    "READ_PRODUCTS",
    "CREATE_PRODUCT",
    "UPDATE_PRODUCT",
    "CHANGE_PRODUCT_STATUS",
  ],
  BOUTIQUES: [
    "READ_BUTIKS",
    "CREATE_BUTIKS",
    "UPDATE_BUTIKS",
    "DELETE_BUTIKS",
    "CHANGE_BOUTIQUE_STATUS",
  ],
  CATEGORIES: [
    "READ_CATEGORIES",
    "CREATE_CATEGORIES",
    "UPDATE_CATEGORIES",
    "DELETE_CATEGORIES",
    "CHANGE_CATEGORY_STATUS",
  ],
  BRANDS: [
    "READ_BRANDS",
    "CREATE_BRANDS",
    "UPDATE_BRANDS",
    "DELETE_BRANDS",
    "CHANGE_BRAND_STATUS",
  ],
  ORDERS: [
    "READ_ORDERS",
    "UPDATE_ORDER_INFO",
    "CHANGE_ORDER_STATUS",
    "READ_ORDER_PAYMENTS",
    "CONFIRM_ORDER_PAYMENT",
    "REFUND_ORDER_PAYMENT",
    "CANCEL_ORDER",
    "ASSIGN_SHIPPING",
    "UPDATE_TRACKING",
    "CHANGE_ORDER_STATUS_PACKAGED",
    "CHANGE_ORDER_STATUS_CANCELED",
  ],
  EMPLOYEES: [
    "READ_EMPLOYEES",
    "CREATE_EMPLOYEES",
    "UPDATE_EMPLOYEES",
    "DELETE_EMPLOYEES",
  ],
  ROLES: ["READ_ROLES", "CREATE_ROLES", "UPDATE_ROLES", "DELETE_ROLES"],
  JOBTITLES: [
    "READ_JOBTITLES",
    "CREATE_JOBTITLES",
    "UPDATE_JOBTITLES",
    "DELETE_JOBTITLES",
  ],
  OFFICES: [
    "READ_OFFICES",
    "CREATE_OFFICES",
    "UPDATE_OFFICES",
    "DELETE_OFFICES",
  ],
  DEPARTMENTS: [
    "READ_DEPARTMENTS",
    "CREATE_DEPARTMENTS",
    "UPDATE_DEPARTMENTS",
    "DELETE_DEPARTMENTS",
  ],
  WORKFORMS: [
    "READ_WORKFORMS",
    "CREATE_WORKFORMS",
    "UPDATE_WORKFORMS",
    "DELETE_WORKFORMS",
  ],
  LANGUAGES: [
    "READ_LANGUAGES",
    "CREATE_LANGUAGES",
    "UPDATE_LANGUAGES",
    "DELETE_LANGUAGES",
  ],
  CURRENCIES: [
    "READ_CURRENCIES",
    "CREATE_CURRENCIES",
    "UPDATE_CURRENCIES",
    "DELETE_CURRENCIES",
  ],
  SHIPPING: [
    "READ_SHIPPING",
    "CREATE_SHIPPING",
    "UPDATE_SHIPPING",
    "DELETE_SHIPPING",
  ],
  COUNTRIES: [
    "READ_COUNTRIES",
    "CREATE_COUNTRIES",
    "UPDATE_COUNTRIES",
    "DELETE_COUNTRIES",
  ],
  SHOP_INFO: ["READ_SHOP_INFO", "UPDATE_SHOP_INFO"],
  PRODUCT_IMAGES: [
    "READ_PRODUCT_IMAGES",
    "UPLOAD_PRODUCT_IMAGES",
    "DELETE_PRODUCT_IMAGES",
  ],
  STORIES: ["READ_STORY", "CREATE_STORY", "DELETE_STORY"],
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
  return translateFunction(
    permission
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase()),
  );
};

function SellerDashBoard() {
  const params = useParams();
  const sellerId = params.sellerId as string;
  const local = params.lang?.toString() || "";
  const [, language] = local.split("-");
  const isRtl = language === "ar" || language === "ku";
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

  const [permissionsLoading, setPermissionsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("none");
  const [error, setError] = useState<string | null>(null);
  const [productsMeta, setProductsMeta] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [roles, setRoles] = useState<any[]>([]);
  const [rolesMeta, setRolesMeta] = useState<any | null>(null);
  const [rolesPage, setRolesPage] = useState<number>(1);
  const [rolesLoadingMore, setRolesLoadingMore] = useState<boolean>(false);
  const [rolesQuery, setRolesQuery] = useState<string>("");
  const [rolesSearching, setRolesSearching] = useState<boolean>(false);

  // Separate dataset for the per-user change-role control
  const [rolesForChange, setRolesForChange] = useState<any[]>([]);
  const [rolesForChangeMeta, setRolesForChangeMeta] = useState<any | null>(
    null,
  );
  const [rolesForChangePage, setRolesForChangePage] = useState<number>(1);
  const [rolesForChangeLoadingMore, setRolesForChangeLoadingMore] =
    useState<boolean>(false);
  const [rolesForChangeQuery, setRolesForChangeQuery] = useState<string>("");
  const [rolesForChangeSearching, setRolesForChangeSearching] =
    useState<boolean>(false);
  const [rolesForChangeOpenUserId, setRolesForChangeOpenUserId] = useState<
    string | number | null
  >(null);

  const [rolesDropdownOpen, setRolesDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [usersMeta, setUsersMeta] = useState<any | null>(null);
  const [usersPage, setUsersPage] = useState<number>(1);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [usersLoadingMore, setUsersLoadingMore] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [addUserForm, setAddUserForm] = useState({
    phone: "",
    role_id: "",
    seller_id: parseInt(sellerId) || 0,
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserSuccess, setAddUserSuccess] = useState(false);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [selectedOrderStatuses, setSelectedOrderStatuses] = useState<
    Record<string, string>
  >({});
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(
    null,
  );
  const rolesForChangeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentShop = useMemo(() => {
    return shopes.find((shop) => shop.seller_id?.toString() === sellerId);
  }, [shopes, sellerId]);

  const hasPermission = (permission: string): boolean => {
    return (
      sellerPermissions.includes(permission) ||
      sellerPermissions.includes("SUPER_ADMIN")
    );
  };
  const canViewProducts = PERMISSION_GROUPS.PRODUCTS.some((p: string) =>
    hasPermission(p),
  );
  const canViewBoutiques = PERMISSION_GROUPS.BOUTIQUES.some((p: string) =>
    hasPermission(p),
  );
  const canViewPermissions = [
    ...PERMISSION_GROUPS.ADMIN,
    ...PERMISSION_GROUPS.ROLES,
    ...PERMISSION_GROUPS.EMPLOYEES,
  ].some((p: string) => hasPermission(p));
  const canManageUsers =
    hasPermission("USER_MANAGEMENT_ACCESS") || hasPermission("SUPER_ADMIN");
  const canViewUsers =
    PERMISSION_GROUPS.EMPLOYEES.some((p: string) => hasPermission(p)) ||
    canManageUsers;
  const canViewUsersList =
    sellerPermissions.includes("READ_EMPLOYEES") ||
    sellerPermissions.includes("SUPER_ADMIN") ||
    sellerPermissions.includes("USER_MANAGEMENT_ACCESS");
  const canViewOrders = PERMISSION_GROUPS.ORDERS.some((p: string) =>
    hasPermission(p),
  );
  const canViewGallery = hasPermission("READ_PRODUCT_IMAGES");
  const canUploadProductImages = hasPermission("UPLOAD_PRODUCT_IMAGES");
  const canDeleteProductImages = hasPermission("DELETE_PRODUCT_IMAGES");
  const canViewStories = hasPermission("READ_STORY");
  const canCreateStory = hasPermission("CREATE_STORY");
  const canDeleteStory = hasPermission("DELETE_STORY");
  const canViewShopInfo = hasPermission("READ_SHOP_INFO");
  const canUpdateShopInfo = hasPermission("UPDATE_SHOP_INFO");
  // Excel bulk upload is gated on product create/update (SUPER_ADMIN included via hasPermission)
  const canUploadExcel =
    hasPermission("CREATE_PRODUCT") || hasPermission("UPDATE_PRODUCT");
  const isAdmin = hasPermission("SUPER_ADMIN");

  const currentUserId = auth.UserID ? auth.UserID() : null;

  const getSellerProducts = async (page: number = 1) => {
    if (!canViewProducts) return;
    try {
      setLoading(true);
      setError(null);
      const res = await SellerDashboardService.getSellerProducts(
        sellerId,
        page,
      );
      // API returns { data: { products: [...], meta: {...} } }
      const products = res.data?.products || res.data || [];
      setSellerProducts(products);
      setProductsMeta(res.data?.meta || null);
      setCurrentPage(page);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setError(error?.message || translateFunction("Failed to load products"));
    } finally {
      setLoading(false);
    }
  };

  const getSellerBoutiques = async () => {
    if (!canViewBoutiques) return;
    try {
      setLoading(true);
      setError(null);
      const res = await SellerDashboardService.getSellerBoutiques(sellerId);
      // API returns { data: { boutiques: [...], meta: {...} } }
      const boutiques = res.data?.boutiques || res.data || [];
      setSellerBoutiques(Array.isArray(boutiques) ? boutiques : []);
    } catch (error: any) {
      console.error("Error fetching boutiques:", error);
      setError(error?.message || translateFunction("Failed to load boutiques"));
    } finally {
      setLoading(false);
    }
  };

  const getRoles = async (page: number = 1, search: string = "") => {
    try {
      if (page === 1) {
        // If searching, use dedicated searching flag to avoid overriding global loading
        if (search) setRolesSearching(true);
        else setLoading(true);
      } else {
        setRolesLoadingMore(true);
      }
      setError(null);
      const res = await SellerDashboardService.getRoles(sellerId, page, search);
      const rolesData = res.data?.shop_roles || res.data || [];
      if (page > 1) {
        setRoles((prev) => [
          ...prev,
          ...(Array.isArray(rolesData) ? rolesData : []),
        ]);
      } else {
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      }
      setRolesMeta(res.data?.meta || null);
      setRolesPage(page);
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      setError(error?.message || translateFunction("Failed to load roles"));
    } finally {
      if (page === 1) {
        if (search) setRolesSearching(false);
        else setLoading(false);
      } else setRolesLoadingMore(false);
    }
  };

  const getRolesForChange = async (page: number = 1, search: string = "") => {
    try {
      if (page === 1) {
        if (search) setRolesForChangeSearching(true);
        else setLoading(true);
      } else {
        setRolesForChangeLoadingMore(true);
      }
      setError(null);
      const res = await SellerDashboardService.getRoles(sellerId, page, search);
      const rolesData = res.data?.shop_roles || res.data || [];
      if (page > 1) {
        setRolesForChange((prev) => [
          ...prev,
          ...(Array.isArray(rolesData) ? rolesData : []),
        ]);
      } else {
        setRolesForChange(Array.isArray(rolesData) ? rolesData : []);
      }
      setRolesForChangeMeta(res.data?.meta || null);
      setRolesForChangePage(page);
    } catch (error: any) {
      console.error("Error fetching roles for change:", error);
      setError(error?.message || translateFunction("Failed to load roles"));
    } finally {
      if (page === 1) {
        if (search) setRolesForChangeSearching(false);
        else setLoading(false);
      } else setRolesForChangeLoadingMore(false);
    }
  };

  const getUsers = async (page: number = 1) => {
    try {
      if (!canViewUsersList) return;
      if (page === 1) setUsersLoading(true);
      else setUsersLoadingMore(true);
      setUsersError(null);
      // extract language from path like `en-us` or `ar` segment
      const langSegment =
        (window.location.pathname.split("/")[1] || "").split("-")[1] ||
        (window.location.pathname.split("/")[1] || "").split("-")[0];
      const res = await SellerDashboardService.getUsers(
        sellerId,
        page,
        langSegment,
      );
      const usersData = res.data?.users || res.data || [];
      if (page > 1) {
        setUsers((prev) => [
          ...prev,
          ...(Array.isArray(usersData) ? usersData : []),
        ]);
      } else {
        setUsers(Array.isArray(usersData) ? usersData : []);
      }
      setUsersMeta(res.data?.meta || null);
      setUsersPage(page);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setUsersError(
        error?.message || translateFunction("Failed to load users"),
      );
    } finally {
      if (page === 1) setUsersLoading(false);
      else setUsersLoadingMore(false);
    }
  };

  const handleDeleteUser = async (userId: number | string) => {
    try {
      setUsersError(null);
      await SellerDashboardService.deleteUser(userId, sellerId);
      setUsers((prev) => prev.filter((u) => String(u.id) !== String(userId)));
    } catch (error: any) {
      console.error("Error deleting user:", error);
      setUsersError(
        error?.message || translateFunction("Failed to delete user"),
      );
    }
  };

  const handleUpdateUserRole = async (
    userId: number | string,
    roleId: number,
  ) => {
    try {
      setUsersError(null);
      await SellerDashboardService.updateUserRole(
        { user_id: Number(userId), role_id: Number(roleId) },
        sellerId,
      );
      // Update local users array with new role info (name from roles list)
      const roleObj = roles.find((r) => Number(r.id) === Number(roleId));
      setUsers((prev) =>
        prev.map((u) =>
          String(u.id) === String(userId)
            ? {
                ...u,
                role_id: Number(roleId),
                role: roleObj ? { id: roleObj.id, name: roleObj.name } : u.role,
                role_name: roleObj?.name || u.role?.name || u.role_name,
              }
            : u,
        ),
      );
    } catch (error: any) {
      console.error("Error updating user role:", error);
      setUsersError(
        error?.message || translateFunction("Failed to update user role"),
      );
    }
  };

  const handleLeaveShop = async () => {
    try {
      await SellerDashboardService.leaveShop(sellerId);
      // client-side behavior after leaving shop is not defined here; trigger a refresh or redirect if needed
    } catch (error: any) {
      console.error("Error leaving shop:", error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserForm.phone || !addUserForm.role_id) {
      setError(translateFunction("Please fill in all fields"));
      return;
    }

    try {
      setAddUserLoading(true);
      setError(null);
      setAddUserSuccess(false);

      const res = await SellerDashboardService.addUserToShop({
        phone: addUserForm.phone,
        role_id: parseInt(addUserForm.role_id as string),
        seller_id: sellerId,
      });

      if (res.success || res.isSuccessful) {
        setAddUserSuccess(true);
        setAddUserForm({
          phone: "",
          role_id: "",
          seller_id: parseInt(sellerId) || 0,
        });
        getUsers();
        setTimeout(() => setAddUserSuccess(false), 3000);
      } else {
        throw new Error(res.message || translateFunction("Failed to add user"));
      }
    } catch (error: any) {
      console.error("Error adding user:", error);
      setError(
        error?.message || translateFunction("Failed to add user to shop"),
      );
    } finally {
      setAddUserLoading(false);
    }
  };

  const getSellerPermissions = async () => {
    try {
      setPermissionsLoading(true);
      setLoading(true);
      setError(null);
      // First try to use permissions from currentShop (from context)
      if (currentShop?.permissions && currentShop.permissions.length > 0) {
        setSellerPermissions(currentShop.permissions);
        setPermissionsLoading(false);
        setLoading(false);
        return;
      }
      // Fallback: fetch from API
      const res = await SellerDashboardService.getSellerPermissions(sellerId);
      // API returns array of shops: [{ seller_id, shop_name, permissions: [...] }]
      const shopData = Array.isArray(res.data)
        ? res.data.find((shop: any) => shop.seller_id?.toString() === sellerId)
        : null;
      const permissions =
        shopData?.permissions || currentShop?.permissions || [];
      setSellerPermissions(Array.isArray(permissions) ? permissions : []);
    } catch (error: any) {
      console.error("Error fetching permissions:", error);
      setError(
        error?.message || translateFunction("Failed to load permissions"),
      );
      // Fallback to currentShop permissions if available
      if (currentShop?.permissions) {
        setSellerPermissions(currentShop.permissions);
      }
    } finally {
      setPermissionsLoading(false);
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
      // getSellerProducts();
      // getSellerBoutiques();
      // getRoles();
      // getUsers();
      // Only fetch permissions if not already available from currentShop
      if (!currentShop?.permissions || currentShop.permissions.length === 0) {
        getSellerPermissions();
      }
    }
  }, [sellerId]);

  useEffect(() => {
    if (activeTab === "users" && canManageUsers) {
      if (roles.length === 0) getRoles();
      if (users.length === 0) getUsers();
    }
  }, [activeTab, canManageUsers]);

  // Debounced server-side search for roles (add user)
  useEffect(() => {
    if (activeTab === "users" && canManageUsers) {
      const handler = setTimeout(() => {
        // reset to page 1 whenever search changes
        getRoles(1, rolesQuery);
      }, 400);
      return () => clearTimeout(handler);
    }
  }, [rolesQuery, sellerId]);

  // Debounced server-side search for roles (change role)
  useEffect(() => {
    if (activeTab === "users" && canManageUsers) {
      const handler = setTimeout(() => {
        getRolesForChange(1, rolesForChangeQuery);
      }, 400);
      return () => clearTimeout(handler);
    }
  }, [rolesForChangeQuery, sellerId]);

  // Close per-user roles dropdown on outside click or Escape
  useEffect(() => {
    if (!rolesForChangeOpenUserId) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!rolesForChangeRef.current) return;
      const target = e.target as Node;
      if (!rolesForChangeRef.current.contains(target)) {
        setRolesForChangeOpenUserId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRolesForChangeOpenUserId(null);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [rolesForChangeOpenUserId]);

  // Close menu on outside click or Escape
  useEffect(() => {

    if (!menuOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!menuRef.current) return;
      const target = e.target as Node;
      if (!menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (
      activeTab === "products" &&
      canViewProducts &&
      sellerProducts.length === 0
    ) {
      getSellerProducts();
    }
  }, [activeTab, canViewProducts, sellerId]);

  useEffect(() => {
    if (
      activeTab === "boutiques" &&
      canViewBoutiques &&
      sellerBoutiques.length === 0
    ) {
      getSellerBoutiques();
    }
  }, [activeTab, canViewBoutiques, sellerId]);

  useEffect(() => {
    if (
      activeTab === "permissions" &&
      canViewPermissions &&
      sellerPermissions.length === 0
    ) {
      getSellerPermissions();
    }
  }, [activeTab, canViewPermissions, sellerId]);
  const [loadingSideBar, setLoadingSideBar] = useState(false);
  const initializeData = async () => {
    setLoadingSideBar(true);
   let [productsRes,BoutiqueRes,ShopesRes]= await Promise.all([getSellerProducts(), getSellerBoutiques(),SellerDashboardService.getShopes(true)]);
     const isSuperAdmin = sellerPermissions.includes("SUPER_ADMIN");
   if(isSuperAdmin){
      setCurrentRole("Super Admin");
   }else {
   setCurrentRole(ShopesRes.data?.find((s: any) => s.seller_id?.toString() === sellerId)?.shop_role);}
  setLoadingSideBar(false);
  };
  useEffect(() => {
    if (menuOpen) initializeData();
  }, [menuOpen]);
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

  const renderProducts = () => {
    if (permissionsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <span className="ml-3 text-[#3c3c3c]">
            {translateFunction("Checking permissions...")}
          </span>
        </div>
      );
    }

    if (!canViewProducts) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-[16px] font-medium text-[#1d1d1d] mb-2">
              {translateFunction("Access Denied")}
            </p>
            <p className="text-[14px] text-[#8D8D8D]">
              {translateFunction("You don't have permission to view products")}
            </p>
          </div>
        </div>
      );
    }
    if (loading && sellerProducts.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <span className="ml-3 text-[#3c3c3c]">
            {translateFunction("Loading products...")}
          </span>
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
            {translateFunction("Retry")}
          </button>
        </div>
      );
    }

    if (sellerProducts.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-[#8D8D8D]">
            {translateFunction("No products found")}
          </p>
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
                          : product.images[0]?.file_path || product.images[0],
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
    if (!canViewBoutiques) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-[16px] font-medium text-[#1d1d1d] mb-2">
              {translateFunction("Access Denied")}
            </p>
            <p className="text-[14px] text-[#8D8D8D]">
              {translateFunction("You don't have permission to view boutiques")}
            </p>
          </div>
        </div>
      );
    }
    if (loading && (!sellerBoutiques || sellerBoutiques.length === 0)) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <span className="ml-3 text-[#3c3c3c]">
            {translateFunction("Loading boutiques...")}
          </span>
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
            {translateFunction("Retry")}
          </button>
        </div>
      );
    }

    if (!sellerBoutiques || sellerBoutiques.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-[#8D8D8D]">
            {translateFunction("No boutiques found")}
          </p>
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
                  {boutique.description
                    .replace(/<[^>]*>/g, "")
                    .substring(0, 100)}
                  {boutique.description.replace(/<[^>]*>/g, "").length > 100 &&
                    "..."}
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
  
  const [currentRole,setCurrentRole]=useState(shopes.find((s)=>s.seller_id?.toString()===sellerId)?.shop_role);

  const showRoleInfo=()=>{
     const isSuperAdmin = sellerPermissions.includes("SUPER_ADMIN");
     
    if(isSuperAdmin){
    
      return(
           <div className="bg-linear-to-r from-blue-500 to-purple-500 text-white p-4 rounded-[15px] mb-6">
          <div className="flex items-center gap-2">
          <span className="text-[20px]">⭐</span>
          <div>
          <h3 className="text-[18px] font-bold">
          {translateFunction("Super Admin")}
          </h3>
          <p className="text-[12px] opacity-90">
          {translateFunction("You have full access to all features")}
          </p>
          </div>
          </div>
          </div>
      )
    }
    return (<div className="bg-white border border-[#e0e0e0] p-4 rounded-[15px] mb-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-[20px]">🔖</span>
              <div>
                <h3 className="text-[18px] font-bold text-[#1d1d1d]">
                  {currentRole}
                </h3>
                <p className="text-[12px] text-[#8D8D8D]">
                  
                </p>
              </div>
            </div>
          </div>)

  }
  const renderPermissions = () => {

    if (loading && sellerPermissions.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <span className="ml-3 text-[#3c3c3c]">
            {translateFunction("Loading permissions...")}
          </span>
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
            {translateFunction("Retry")}
          </button>
        </div>
      );
    }

    if (sellerPermissions.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-[#8D8D8D]">
            {translateFunction("No permissions assigned")}
          </p>
        </div>
      );
    }

    const isSuperAdmin = sellerPermissions.includes("SUPER_ADMIN");
    const shopRoleName =
      typeof currentShop?.shop_role === "string"
        ? currentShop.shop_role
        : ""
    return (
      <div className="space-y-6">
        {!currentRole?
        <div className="flex flex-1 items-center justify-center"><Spinner/></div>:
        showRoleInfo()}
        
        {Object.entries(groupedPermissions).map(([group, permissions]) => (
          <div key={group} className="bg-white rounded-[15px] shadow-md p-6">
            <h3 className="text-[16px] font-semibold text-[#1d1d1d] mb-4 pb-2 border-b border-[#f0f0f0]">
              {translateFunction(group.replace(/_/g, " "))}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {permissions.map((permission) => {
                const permissionType = permission.includes("READ")
                  ? "read"
                  : permission.includes("CREATE")
                    ? "create"
                    : permission.includes("UPDATE") ||
                        permission.includes("CHANGE")
                      ? "update"
                      : permission.includes("DELETE")
                        ? "delete"
                        : "other";

                const typeColors = {
                  read: "bg-blue-100 text-blue-700 border-blue-200",
                  create: "bg-blue-100 text-blue-700 border-blue-200",
                  update: "bg-blue-100 text-blue-700 border-blue-200",
                  delete: "bg-blue-100 text-blue-700 border-blue-200",
                  other: "bg-blue-100 text-blue-700 border-blue-200",
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

  const renderUsers = () => {
    if (permissionsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <span className="ml-3 text-[#3c3c3c]">
            {translateFunction("Checking permissions...")}
          </span>
        </div>
      );
    }

    if (!canManageUsers) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-[16px] font-medium text-[#1d1d1d] mb-2">
              {translateFunction("Access Denied")}
            </p>
            <p className="text-[14px] text-[#8D8D8D]">
              {translateFunction("You don't have permission to manage users")}
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {/* Add User Form */}
        <div className="bg-white rounded-[15px] shadow-md p-6">
          <h2 className="text-[20px] font-bold text-[#1d1d1d] mb-4">
            {translateFunction("Add User to Shop")}
          </h2>

          {addUserSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-700 text-[14px]">
              {translateFunction("User added successfully!")}
            </div>
          )}

          {error && activeTab === "users" && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-[14px]">
              {error}
            </div>
          )}

          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-[14px] font-medium text-[#1d1d1d] mb-2">
                {translateFunction("Phone Number")}
              </label>
              <input
                type="text"
                value={addUserForm.phone}
                onChange={(e) =>
                  setAddUserForm({ ...addUserForm, phone: e.target.value })
                }
                placeholder={translateFunction("+(country_code)XXX")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-[14px]"
                required
              />
              <p className="text-[12px] text-[#8D8D8D] mt-1">
                {translateFunction(
                  "Format: +(country_code)XXX (e.g., +9611234567)",
                )}
              </p>
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#1d1d1d] mb-2">
                {translateFunction("Role")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={rolesQuery}
                  onChange={(e) => {
                    setRolesQuery(e.target.value);
                    // clear selected role id when user types
                    setAddUserForm({ ...addUserForm, role_id: "" });
                    setRolesPage(1);
                  }}
                  onFocus={() => setRolesDropdownOpen(true)}
                  onBlur={() =>
                    setTimeout(() => setRolesDropdownOpen(false), 150)
                  }
                  placeholder={translateFunction("Search roles...")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-[14px] mb-2"
                  aria-autocomplete="list"
                />

                {rolesDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-sm max-h-48 overflow-auto">
                    {rolesSearching && roles.length === 0 ? (
                      <div className="flex items-center gap-2 p-3">
                        <Spinner />
                        <span className="text-[14px] text-[#8D8D8D]">
                          {translateFunction("Searching roles...")}
                        </span>
                      </div>
                    ) : loading && roles.length === 0 ? (
                      <div className="flex items-center gap-2 p-3">
                        <Spinner />
                        <span className="text-[14px] text-[#8D8D8D]">
                          {translateFunction("Loading roles...")}
                        </span>
                      </div>
                    ) : roles.length === 0 ? (
                      <div className="p-3 text-[14px] text-[#8D8D8D]">
                        {translateFunction("No roles found")}
                      </div>
                    ) : (
                      <>
                        {roles.map((role: any) => (
                          <div
                            key={role.id}
                            onMouseDown={() => {
                              // use onMouseDown to avoid losing click to blur
                              setAddUserForm({
                                ...addUserForm,
                                role_id: String(role.id),
                              });
                              setRolesQuery(role.name);
                              setRolesDropdownOpen(false);
                            }}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                          >
                            {role.name} : {role.description}
                          </div>
                        ))}

                        {rolesMeta?.has_more_pages && (
                          <div className="flex justify-end p-2 border-t">
                            <button
                              onMouseDown={() =>
                                getRoles(rolesPage + 1, rolesQuery)
                              }
                              className="px-3 py-1 bg-white border rounded-sm"
                              disabled={rolesLoadingMore}
                            >
                              {rolesLoadingMore ? (
                                <Spinner />
                              ) : (
                                translateFunction("Load more roles")
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Hidden select for form validation (keeps required behavior) */}
                <select
                  value={addUserForm.role_id}
                  onChange={(e) =>
                    setAddUserForm({ ...addUserForm, role_id: e.target.value })
                  }
                  className="hidden"
                  required
                >
                  <option value="">{translateFunction("Select a role")}</option>
                  {roles.map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.name} : {role.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#1d1d1d] mb-2">
                {translateFunction("Seller ID")}
              </label>
              <input
                type="number"
                value={addUserForm.seller_id}
                onChange={(e) =>
                  setAddUserForm({
                    ...addUserForm,
                    seller_id: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-[14px] bg-gray-50"
                readOnly
                disabled
              />
            </div>

            <button
              type="submit"
              disabled={
                addUserLoading || !addUserForm.phone || !addUserForm.role_id
              }
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[14px]"
            >
              {addUserLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  {translateFunction("Adding User...")}
                </span>
              ) : (
                translateFunction("Add User")
              )}
            </button>
          </form>
        </div>

        {/* Available Roles List
        <div className="bg-white rounded-[15px] shadow-md p-6">
          <h2 className="text-[20px] font-bold text-[#1d1d1d] mb-4">
            Available Roles
          </h2>
          {loading && roles.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
              <span className="ml-3 text-[#3c3c3c]">{translateFunction("Loading roles...")}</span>
            </div>
          ) : roles.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-[#8D8D8D]">{translateFunction("No roles available")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role: any) => (
                  <div
                    key={role.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-[16px] font-semibold text-[#1d1d1d] mb-1">
                      {role.name}
                    </h3>
                    <p className="text-[12px] text-[#8D8D8D]">
                      {role.description}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div> */}
        {/* Users list */}
        {canViewUsersList && (
          <div className="mt-6 bg-white rounded-[15px] shadow-md">
            <h2 className="text-[20px] font-bold text-[#1d1d1d] mb-4 p-6">
              {translateFunction("Users")}
            </h2>

            {usersLoading && users.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
                <span className="ml-3 text-[#3c3c3c]">
                  {translateFunction("Loading users...")}
                </span>
              </div>
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-[#8D8D8D]">
                  {translateFunction("No users found")}
                </p>
              </div>
            ) : (
              <div className="overflow-auto mb-[100px]">
                <table className="w-full text-left mb-[300px]">
                  <thead>
                    <tr>
                      <th className="py-2 px-3">
                        {translateFunction("Name / Phone")}
                      </th>
                      <th className="py-2 px-3">{translateFunction("Role")}</th>
                      <th className="py-2 px-3">
                        {translateFunction("Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="p-2">
                    {users.map((user: any) => (
                      <tr key={user.id} className="border-t">
                        <td className="py-3 px-3">{user.name || user.phone}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] text-[#8D8D8D]">
                              {user.role?.name ||
                                user.role_name ||
                                (typeof user.role === "string"
                                  ? user.role
                                  : "-")}
                            </span>
                            {hasPermission("SUPER_ADMIN") && (
                              <div className="relative ml-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const uid = String(user.id);
                                    if (rolesForChangeOpenUserId === uid) {
                                      setRolesForChangeOpenUserId(null);
                                      return;
                                    }
                                    setRolesForChangeOpenUserId(uid);
                                    setRolesForChangeQuery("");
                                    if (rolesForChange.length === 0)
                                      getRolesForChange();
                                  }}
                                  className="px-2 py-1 border rounded-sm"
                                >
                                  {translateFunction("Change Role")}
                                </button>

                                {rolesForChangeOpenUserId ===
                                  String(user.id) && (
                                  <div
                                    ref={rolesForChangeRef}
                                    className="absolute z-50 right-0 mt-1 w-56 bg-white border border-gray-200 rounded-sm max-h-48 overflow-auto"
                                  >
                                    <input
                                      type="text"
                                      value={rolesForChangeQuery}
                                      onChange={(e) => {
                                        setRolesForChangeQuery(e.target.value);
                                        setRolesForChangePage(1);
                                      }}
                                      onFocus={() => {
                                        if (rolesForChange.length === 0)
                                          getRolesForChange(
                                            1,
                                            rolesForChangeQuery,
                                          );
                                      }}
                                      className="w-full px-3 py-2 border-b border-gray-200"
                                      placeholder={translateFunction(
                                        "Search roles...",
                                      )}
                                    />

                                    {rolesForChangeSearching &&
                                    rolesForChange.length === 0 ? (
                                      <div className="flex items-center gap-2 p-3">
                                        <Spinner />
                                        <span className="text-[14px] text-[#8D8D8D]">
                                          {translateFunction(
                                            "Searching roles...",
                                          )}
                                        </span>
                                      </div>
                                    ) : loading &&
                                      rolesForChange.length === 0 ? (
                                      <div className="flex items-center gap-2 p-3">
                                        <Spinner />
                                        <span className="text-[14px] text-[#8D8D8D]">
                                          {translateFunction(
                                            "Loading roles...",
                                          )}
                                        </span>
                                      </div>
                                    ) : rolesForChange.length === 0 ? (
                                      <div className="p-3 text-[14px] text-[#8D8D8D]">
                                        {translateFunction("No roles found")}
                                      </div>
                                    ) : (
                                      <>
                                        {rolesForChange.map((r: any) => (
                                          <div
                                            key={r.id}
                                            onMouseDown={() => {
                                              handleUpdateUserRole(
                                                user.id,
                                                Number(r.id),
                                              );
                                              setRolesForChangeOpenUserId(null);
                                            }}
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                          >
                                            {r.name} : {r.description}
                                          </div>
                                        ))}

                                        {rolesForChangeMeta?.has_more_pages && (
                                          <div className="flex justify-end p-2 border-t">
                                            <button
                                              onMouseDown={() =>
                                                getRolesForChange(
                                                  rolesForChangePage + 1,
                                                  rolesForChangeQuery,
                                                )
                                              }
                                              className="px-3 py-1 bg-white border rounded-sm"
                                              disabled={
                                                rolesForChangeLoadingMore
                                              }
                                            >
                                              {rolesForChangeLoadingMore ? (
                                                <Spinner />
                                              ) : (
                                                "Load more"
                                              )}
                                            </button>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {hasPermission("SUPER_ADMIN") && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-sm disabled:opacity-50"
                              >
                                {translateFunction("Delete")}
                              </button>
                            )}
                            {String(user.id) === String(currentUserId) && (
                              <button
                                onClick={handleLeaveShop}
                                className="px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-sm"
                              >
                                {translateFunction("Leave Shop")}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {usersMeta?.has_more_pages && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => getUsers(usersPage + 1)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      disabled={usersLoadingMore}
                    >
                      {usersLoadingMore ? (
                        <Spinner />
                      ) : (
                        translateFunction("Load more")
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {usersError && (
              <div className="mt-3 text-red-500">{usersError}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1366px] mx-auto setting-screen">
      <div className="mb-3 bg-white">
        <BackBar
          isRtl={isRtl}
          local={local}
          name={translateFunction("Seller Dashboard", language)}
          preivous_page={`/${local}/sellerProfile`}
          DataCy="seller-dashboard-screen"
        />
      </div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Navigation Menu */}
        <div className="relative" ref={menuRef}>
          {/* Hamburger Menu Button */}

          {/* Overlay */}
          {menuOpen && (
            <div
              className="fixed inset-0 bg-[#0000006a] z-30 transition-opacity duration-300"
              onClick={() => setMenuOpen(false)}
            />
          )}

          {/* Sliding Menu */}
          <div
            className={`fixed left-0 top-0 h-screen w-64 shadow-2xl z-40 transition-transform duration-300 ease-in-out overflow-y-auto bg-white ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Menu Header */}
            <div className="p-6 border-b border-blue-500">
              <h2 className="text-white text-[20px] font-bold">
                {translateFunction("Dashboard Menu")}
              </h2>
            </div>

            {/* Menu Items */}
            <div className="py-4">
              {canViewProducts && (
                <button
                  onClick={() => {
                    setActiveTab("products");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-all duration-200 border-l-4 ${
                    activeTab === "products"
                      ? "border-white bg-blue-500 text-white font-semibold"
                      : "border-transparent text-black hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  <span className="text-[20px]">📦</span>
                  <span>{translateFunction("Products")}</span>
                  <span className="rounded-4xl w-[25px] h-[25px] flex items-center justify-center m-2 bg-blue-200 text-blue-600">
                    {loadingSideBar ? <Spinner /> : sellerProducts?.length}
                  </span>
                  {activeTab === "products" && (
                    <span className="ml-auto text-white">✓</span>
                  )}
                </button>
              )}
              {canViewBoutiques && (
                <button
                  onClick={() => {
                    setActiveTab("boutiques");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-all duration-200 border-l-4 ${
                    activeTab === "boutiques"
                      ? "border-white bg-blue-500 text-white font-semibold"
                      : "border-transparent text-black hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  <span className="text-[20px]">🏪</span>
                  <span>{translateFunction("Boutiques")}</span>
                  <span className="rounded-4xl w-[25px] h-[25px] flex items-center justify-center m-2 bg-blue-200 text-blue-600">
                    {loadingSideBar ? <Spinner /> : sellerBoutiques?.length}
                  </span>
                  {activeTab === "boutiques" && (
                    <span className="ml-auto text-white">✓</span>
                  )}
                </button>
              )}

              {canViewOrders && (
                <button
                  onClick={() => {
                    setActiveTab("orders");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-all duration-200 border-l-4 ${
                    activeTab === "orders"
                      ? "border-white bg-blue-500 text-white font-semibold"
                      : "border-transparent text-black hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  <span className="text-[20px]">📊</span>
                  <span>{translateFunction("Orders")}</span>
                  {activeTab === "orders" && (
                    <span className="ml-auto text-white">✓</span>
                  )}
                </button>
              )}
              {
                <button
                  onClick={() => {
                    setActiveTab("permissions");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-all duration-200 border-l-4 ${
                    activeTab === "permissions"
                      ? "border-white bg-blue-500 text-white font-semibold"
                      : "border-transparent text-black hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  <span className="text-[20px]">🔐</span>
                  <span>{translateFunction("Permissions")}</span>
                  {activeTab === "permissions" && (
                    <span className="ml-auto text-white">✓</span>
                  )}
                </button>
              }
              {canViewUsers && (
                <button
                  onClick={() => {
                    setActiveTab("users");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-all duration-200 border-l-4 ${
                    activeTab === "users"
                      ? "border-white bg-blue-500 text-white font-semibold"
                      : "border-transparent text-black hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  <span className="text-[20px]">👥</span>
                  <span>{translateFunction("Users")}</span>
                  {activeTab === "users" && (
                    <span className="ml-auto text-white">✓</span>
                  )}
                </button>
              )}
              {canViewGallery && (
                <button
                  onClick={() => {
                    setActiveTab("gallery");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-all duration-200 border-l-4 ${
                    activeTab === "gallery"
                      ? "border-white bg-blue-500 text-white font-semibold"
                      : "border-transparent text-black hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  <span className="text-[20px]">🖼️</span>
                  <span>{translateFunction("Gallery")}</span>
                  {activeTab === "gallery" && (
                    <span className="ml-auto text-white">✓</span>
                  )}
                </button>
              )}
              {canViewStories && (
                <button
                  onClick={() => {
                    setActiveTab("stories");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-all duration-200 border-l-4 ${
                    activeTab === "stories"
                      ? "border-white bg-blue-500 text-white font-semibold"
                      : "border-transparent text-black hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  <span className="text-[20px]">📖</span>
                  <span>{translateFunction("Stories")}</span>
                  {activeTab === "stories" && (
                    <span className="ml-auto text-white">✓</span>
                  )}
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    setActiveTab("comments");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-all duration-200 border-l-4 ${
                    activeTab === "comments"
                      ? "border-white bg-blue-500 text-white font-semibold"
                      : "border-transparent text-black hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  <span className="text-[20px]">💬</span>
                  <span>{translateFunction("Customers Comments")}</span>
                  {activeTab === "comments" && (
                    <span className="ml-auto text-white">✓</span>
                  )}
                </button>
              )}
              {canUploadExcel && (
                <button
                  onClick={() => {
                    setActiveTab("excel");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-all duration-200 border-l-4 ${
                    activeTab === "excel"
                      ? "border-white bg-blue-500 text-white font-semibold"
                      : "border-transparent text-black hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  <span className="text-[20px]">📊</span>
                  <span>{translateFunction("Upload Excel File")}</span>
                  {activeTab === "excel" && (
                    <span className="ml-auto text-white">✓</span>
                  )}
                </button>
              )}
              {canViewShopInfo && (
                <button
                  onClick={() => {
                    setActiveTab("shopInfo");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-all duration-200 border-l-4 ${
                    activeTab === "shopInfo"
                      ? "border-white bg-blue-500 text-white font-semibold"
                      : "border-transparent text-black hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  <span className="text-[20px]">🏠</span>
                  <span>{translateFunction("Shop Info")}</span>
                  {activeTab === "shopInfo" && (
                    <span className="ml-auto text-white">✓</span>
                  )}
                </button>
              )}
            </div>

            {/* Menu Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-500 bg-blue-800">
              <div className="text-blue-100 text-[12px] text-center">
                <p>{translateFunction("Seller ID")}</p>
                <p className="font-semibold text-white mt-1">{sellerId}</p>
              </div>
            </div>
          </div>
        </div>
        <h1 className="text-[24px] font-bold text-[#1d1d1d] mb-2 flex items-center gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex flex-col gap-1.5 p-2 rounded-lg transition-all duration-300 ${
              menuOpen
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-[#1d1d1d] hover:bg-gray-50 shadow-md"
            }`}
          >
            <span
              className={`w-6 h-0.5 bg-current transition-all duration-300 ${
                menuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            ></span>
            <span
              className={`w-6 h-0.5 bg-current transition-all duration-300 ${
                menuOpen ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`w-6 h-0.5 bg-current transition-all duration-300 ${
                menuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            ></span>
          </button>{" "}
          {currentShop?.shop_name || translateFunction("Seller Dashboard")}
        </h1>
        <p className="text-[14px] text-[#8D8D8D]">
          {translateFunction("Seller ID:")} {sellerId}
        </p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-md p-6 min-h-[400px]">
        {activeTab === "products" && renderProducts()}
        {activeTab === "boutiques" && renderBoutiques()}
        {activeTab === "permissions" && renderPermissions()}
        {activeTab === "users" && renderUsers()}
        {activeTab === "orders" && (
          <RenderOrders
            canViewOrders={canViewOrders}
            sellerId={sellerId}
            activeTab={activeTab}
          />
        )}
        {activeTab === "gallery" && canViewGallery && (
          <GalleryTab
            sellerId={sellerId}
            canUpload={canUploadProductImages}
            canDelete={canDeleteProductImages}
          />
        )}
        {activeTab === "stories" && canViewStories && (
          <StoriesTab
            sellerId={sellerId}
            userId={currentUserId}
            canCreate={canCreateStory}
            canDelete={canDeleteStory}
          />
        )}
        {activeTab === "comments" && isAdmin && (
          <CommentsTab sellerId={sellerId} language={language} isRtl={isRtl} />
        )}
        {activeTab === "excel" && canUploadExcel && (
          <ExcelUploadTab sellerId={sellerId} language={language} />
        )}
        {activeTab === "shopInfo" && canViewShopInfo && (
          <ShopInfo
            sellerId={sellerId}
            language={language}
            canUpdate={canUpdateShopInfo}
          />
        )}
      </div>
    </div>
  );
}

export default SellerDashBoard;
