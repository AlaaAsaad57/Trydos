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
import { DashIcon, IconName } from "components/SellerDashboard/ui/icons";
import {
  DashCard,
  SectionHeader,
  DashButton,
  LoadingState,
  EmptyState,
  ErrorState,
  AccessDenied,
  InlineAlert,
  Pagination,
  DashField,
  dashInputClass,
  Monogram,
} from "components/SellerDashboard/ui";

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
    if (permissionsLoading)
      return (
        <LoadingState label={translateFunction("Checking permissions...")} />
      );

    if (!canViewProducts)
      return (
        <AccessDenied
          message={translateFunction(
            "You don't have permission to view products",
          )}
        />
      );

    if (loading && sellerProducts.length === 0)
      return <LoadingState label={translateFunction("Loading products...")} />;

    if (error && sellerProducts.length === 0)
      return <ErrorState message={error} onRetry={() => getSellerProducts(1)} />;

    if (sellerProducts.length === 0)
      return (
        <EmptyState
          icon="products"
          title={translateFunction("No products found")}
          subtitle={translateFunction(
            "Products added to this shop will appear here.",
          )}
        />
      );

    return (
      <>
        <SectionHeader
          icon="products"
          title={translateFunction("Products")}
          count={productsMeta?.total ?? sellerProducts.length}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {sellerProducts.map((product: any) => (
            <div
              key={product.product_id || product.id}
              className="group bg-white rounded-[16px] overflow-hidden border border-[#ededed] hover:border-transparent hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative w-full aspect-[4/5] bg-[#f0f0f0] overflow-hidden">
                {product.images?.[0] ? (
                  <img
                    src={getConfiguredImage({
                      src: GetImageUrl(
                        typeof product.images[0] === "string"
                          ? product.images[0]
                          : product.images[0]?.file_path || product.images[0],
                      ),
                      width: 240,
                      height: 300,
                      q: 75,
                    })}
                    alt={product.name || "Product"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#c4c2c2] gap-1.5">
                    <DashIcon name="gallery" size={30} strokeWidth={1.4} />
                    <span className="text-[11px]">
                      {translateFunction("No Image")}
                    </span>
                  </div>
                )}
                {product.status !== undefined && (
                  <span
                    className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] semibold backdrop-blur-md ${
                      product.status === 1
                        ? "bg-white/85 text-[#2ea84f]"
                        : "bg-white/85 text-[#8e8e8e]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        product.status === 1 ? "bg-[#2ea84f]" : "bg-[#c4c2c2]"
                      }`}
                    />
                    {product.status === 1
                      ? translateFunction("Active")
                      : translateFunction("Inactive")}
                  </span>
                )}
              </div>
              <div className="p-3.5">
                {product.categories?.[0]?.name && (
                  <p className="text-[10px] uppercase tracking-[0.08em] medium text-[#8e8e8e] mb-1 truncate">
                    {product.categories[0].name}
                  </p>
                )}
                <h3 className="text-[13px] semibold text-[#3c3c3c] leading-snug mb-2.5 line-clamp-2 min-h-[34px]">
                  {product.name || translateFunction("Unnamed Product")}
                </h3>
                <div className="flex items-end justify-between gap-2 pt-2.5 border-t border-[#f4f4f4]">
                  {product.unit_price !== undefined &&
                  product.unit_price !== null ? (
                    <p className="text-[16px] bold text-[#3c3c3c] leading-none">
                      {Number(product.unit_price).toFixed(2)}
                      <span className="text-[10px] text-[#8e8e8e] ml-1 regular">
                        USD
                      </span>
                    </p>
                  ) : (
                    <span />
                  )}
                  {product.current_stock !== undefined && (
                    <span
                      className={`shrink-0 inline-flex items-center px-2 py-1 rounded-full text-[10px] semibold ${
                        product.current_stock === 0
                          ? "bg-[#fff1f1] text-[#f85555]"
                          : product.current_stock <= 5
                            ? "bg-[#fbf6e6] text-[#b8860b]"
                            : "bg-[#f4f4f4] text-[#8e8e8e]"
                      }`}
                    >
                      {product.current_stock === 0
                        ? translateFunction("Out of stock")
                        : `${product.current_stock} ${translateFunction("in stock")}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {productsMeta && productsMeta.last_page > 1 && (
          <Pagination
            current={productsMeta.current_page || currentPage}
            last={productsMeta.last_page}
            disabled={loading}
            onPrev={() => getSellerProducts(currentPage - 1)}
            onNext={() => getSellerProducts(currentPage + 1)}
          />
        )}
      </>
    );
  };

  const renderBoutiques = () => {
    if (!canViewBoutiques)
      return (
        <AccessDenied
          message={translateFunction(
            "You don't have permission to view boutiques",
          )}
        />
      );

    if (loading && (!sellerBoutiques || sellerBoutiques.length === 0))
      return <LoadingState label={translateFunction("Loading boutiques...")} />;

    if (error && (!sellerBoutiques || sellerBoutiques.length === 0))
      return <ErrorState message={error} onRetry={getSellerBoutiques} />;

    if (!sellerBoutiques || sellerBoutiques.length === 0)
      return (
        <EmptyState
          icon="boutiques"
          title={translateFunction("No boutiques found")}
          subtitle={translateFunction(
            "Boutiques created for this shop will appear here.",
          )}
        />
      );

    return (
      <>
        <SectionHeader
          icon="boutiques"
          title={translateFunction("Boutiques")}
          count={sellerBoutiques.length}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
          {sellerBoutiques.map((boutique: any) => (
            <div
              key={boutique.id}
              className="group bg-white rounded-[16px] overflow-hidden border border-[#ededed] hover:border-transparent hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative w-full h-[160px] bg-[#f0f0f0] overflow-hidden">
                {boutique.icon ? (
                  <img
                    src={getConfiguredImage({
                      src: GetImageUrl(boutique.icon),
                      width: 400,
                      height: 160,
                      q: 75,
                    })}
                    alt={boutique.name || "Boutique"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#c4c2c2] gap-1.5">
                    <DashIcon name="boutiques" size={30} strokeWidth={1.4} />
                    <span className="text-[11px]">
                      {translateFunction("No Image")}
                    </span>
                  </div>
                )}
                {/* Scrim + overlaid title */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />
                {boutique.status !== undefined && (
                  <span
                    className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] semibold backdrop-blur-md ${
                      boutique.status === 1
                        ? "bg-white/85 text-[#2ea84f]"
                        : "bg-white/85 text-[#8e8e8e]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        boutique.status === 1 ? "bg-[#2ea84f]" : "bg-[#c4c2c2]"
                      }`}
                    />
                    {boutique.status === 1
                      ? translateFunction("Active")
                      : translateFunction("Inactive")}
                  </span>
                )}
                <h3 className="absolute inset-x-0 bottom-0 p-3.5 text-[15px] bold text-white line-clamp-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                  {boutique.name || translateFunction("Unnamed Boutique")}
                </h3>
              </div>
              <div className="p-4 space-y-2.5">
                {boutique.description ? (
                  <p className="text-[12px] text-[#8e8e8e] leading-relaxed line-clamp-2 min-h-[34px]">
                    {boutique.description
                      .replace(/<[^>]*>/g, "")
                      .substring(0, 100)}
                    {boutique.description.replace(/<[^>]*>/g, "").length > 100 &&
                      "..."}
                  </p>
                ) : (
                  <p className="text-[12px] text-[#c4c2c2] italic min-h-[34px]">
                    {translateFunction("No description")}
                  </p>
                )}
                {boutique.slug && (
                  <span className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-full bg-[#388CFF]/[0.08] text-[#388CFF] text-[11px] medium">
                    <DashIcon name="link" size={12} />
                    <span className="truncate">/{boutique.slug}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };
  
  const [currentRole,setCurrentRole]=useState(shopes.find((s)=>s.seller_id?.toString()===sellerId)?.shop_role);

  const showRoleInfo = () => {
    const isSuperAdmin = sellerPermissions.includes("SUPER_ADMIN");

    if (isSuperAdmin) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-[15px] mb-6 bg-[#5d5d5d] text-white">
          <span className="shrink-0">
            <DashIcon name="star" size={24} />
          </span>
          <div>
            <h3 className="text-[16px] bold">
              {translateFunction("Super Admin")}
            </h3>
            <p className="text-[12px] opacity-90">
              {translateFunction("You have full access to all features")}
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 p-4 rounded-[15px] mb-6 bg-[#f8f8f8] border border-[#ededed]">
        <span className="shrink-0 text-[#5d5d5d]">
          <DashIcon name="role" size={22} />
        </span>
        <div>
          <h3 className="text-[16px] semibold text-[#3c3c3c]">{currentRole}</h3>
          <p className="text-[12px] text-[#8e8e8e]">
            {translateFunction("Your role in this shop")}
          </p>
        </div>
      </div>
    );
  };
  const renderPermissions = () => {
    if (loading && sellerPermissions.length === 0)
      return (
        <LoadingState label={translateFunction("Loading permissions...")} />
      );

    if (error && sellerPermissions.length === 0)
      return <ErrorState message={error} onRetry={getSellerPermissions} />;

    if (sellerPermissions.length === 0)
      return (
        <EmptyState
          icon="permissions"
          title={translateFunction("No permissions assigned")}
        />
      );

    return (
      <div className="space-y-5">
        {!currentRole ? (
          <div className="flex flex-1 items-center justify-center py-6">
            <Spinner />
          </div>
        ) : (
          showRoleInfo()
        )}

        {Object.entries(groupedPermissions).map(([group, permissions]) => (
          <DashCard key={group}>
            <h3 className="text-[15px] semibold text-[#3c3c3c] mb-4 pb-3 border-b border-[#ededed] flex items-center gap-2">
              <span className="text-[#5d5d5d]">
                <DashIcon name="permissions" size={18} />
              </span>
              {translateFunction(group.replace(/_/g, " "))}
            </h3>
            <div className="flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <span
                  key={permission}
                  className="px-3 py-1.5 rounded-full bg-[#388CFF]/[0.08] text-[#388CFF] border border-[#388CFF]/20 text-[12px] medium"
                >
                  {formatPermissionName(permission)}
                </span>
              ))}
            </div>
          </DashCard>
        ))}
      </div>
    );
  };

  const renderUsers = () => {
    if (permissionsLoading)
      return (
        <LoadingState label={translateFunction("Checking permissions...")} />
      );

    if (!canManageUsers)
      return (
        <AccessDenied
          message={translateFunction(
            "You don't have permission to manage users",
          )}
        />
      );

    return (
      <div className="space-y-5">
        {/* Add User Form */}
        <DashCard>
          <SectionHeader
            icon="plus"
            title={translateFunction("Add User to Shop")}
          />

          {addUserSuccess && (
            <InlineAlert tone="success">
              {translateFunction("User added successfully!")}
            </InlineAlert>
          )}

          {error && activeTab === "users" && (
            <InlineAlert tone="error">{error}</InlineAlert>
          )}

          <form onSubmit={handleAddUser} className="space-y-4">
            <DashField
              label={translateFunction("Phone Number")}
              hint={translateFunction(
                "Format: +(country_code)XXX (e.g., +9611234567)",
              )}
            >
              <input
                type="text"
                value={addUserForm.phone}
                onChange={(e) =>
                  setAddUserForm({ ...addUserForm, phone: e.target.value })
                }
                placeholder={translateFunction("+(country_code)XXX")}
                className={dashInputClass}
                required
              />
            </DashField>

            <DashField label={translateFunction("Role")}>
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
                  className={dashInputClass}
                  aria-autocomplete="list"
                />

                {rolesDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#ededed] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] max-h-48 overflow-auto">
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
                            className="px-4 py-2.5 text-[13px] text-[#3c3c3c] hover:bg-[#f5f5f5] cursor-pointer"
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
                              className="px-3 py-1.5 text-[12px] medium text-[#388CFF] bg-white border border-[#388CFF] rounded-[10px] hover:bg-[#388CFF]/[0.06]"
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
            </DashField>

            <DashField label={translateFunction("Seller ID")}>
              <input
                type="number"
                value={addUserForm.seller_id}
                onChange={(e) =>
                  setAddUserForm({
                    ...addUserForm,
                    seller_id: parseInt(e.target.value) || 0,
                  })
                }
                className={`${dashInputClass} bg-[#f2f2f2] text-[#8e8e8e]`}
                readOnly
                disabled
              />
            </DashField>

            <DashButton
              type="submit"
              fullWidth
              icon="plus"
              loading={addUserLoading}
              disabled={!addUserForm.phone || !addUserForm.role_id}
            >
              {addUserLoading
                ? translateFunction("Adding User...")
                : translateFunction("Add User")}
            </DashButton>
          </form>
        </DashCard>

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
          <DashCard>
            <SectionHeader
              icon="users"
              title={translateFunction("Users")}
              count={usersMeta?.total ?? users.length}
            />

            {usersLoading && users.length === 0 ? (
              <LoadingState label={translateFunction("Loading users...")} />
            ) : users.length === 0 ? (
              <EmptyState
                icon="users"
                title={translateFunction("No users found")}
              />
            ) : (
              <div className="overflow-auto mb-[100px]">
                <table className="w-full text-left mb-[300px]">
                  <thead>
                    <tr>
                      <th className="py-3 px-3 text-[12px] semibold text-[#8e8e8e]">
                        {translateFunction("Name / Phone")}
                      </th>
                      <th className="py-3 px-3 text-[12px] semibold text-[#8e8e8e]">{translateFunction("Role")}</th>
                      <th className="py-3 px-3 text-[12px] semibold text-[#8e8e8e]">
                        {translateFunction("Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="p-2">
                    {users.map((user: any) => (
                      <tr key={user.id} className="border-t border-[#ededed]">
                        <td className="py-3 px-3 text-[14px] text-[#3c3c3c] align-top">{user.name || user.phone}</td>
                        <td className="py-3 px-3 text-[14px] text-[#3c3c3c] align-top">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] text-[#505050]">
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
                                  className="px-2.5 py-1 text-[12px] medium text-[#388CFF] border border-[#388CFF] rounded-[10px] hover:bg-[#388CFF]/[0.06]"
                                >
                                  {translateFunction("Change Role")}
                                </button>

                                {rolesForChangeOpenUserId ===
                                  String(user.id) && (
                                  <div
                                    ref={rolesForChangeRef}
                                    className="absolute z-50 right-0 mt-1 w-56 bg-white border border-[#ededed] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] max-h-48 overflow-auto"
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
                                      className="w-full px-3 py-2.5 text-[13px] text-[#3c3c3c] border-b border-[#ededed] outline-none placeholder:text-[#b8b8b8]"
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
                                            className="px-4 py-2.5 text-[13px] text-[#3c3c3c] hover:bg-[#f5f5f5] cursor-pointer"
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
                                              className="px-3 py-1.5 text-[12px] medium text-[#388CFF] bg-white border border-[#388CFF] rounded-[10px] hover:bg-[#388CFF]/[0.06]"
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
                        <td className="py-3 px-3 text-[14px] text-[#3c3c3c] align-top">
                          <div className="flex items-center gap-2">
                            {hasPermission("SUPER_ADMIN") && (
                              <DashButton
                                variant="danger"
                                size="sm"
                                icon="trash"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                {translateFunction("Delete")}
                              </DashButton>
                            )}
                            {String(user.id) === String(currentUserId) && (
                              <DashButton
                                variant="ghost"
                                size="sm"
                                icon="logout"
                                onClick={handleLeaveShop}
                              >
                                {translateFunction("Leave Shop")}
                              </DashButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {usersMeta?.has_more_pages && (
                  <div className="flex justify-center mt-4">
                    <DashButton
                      variant="secondary"
                      onClick={() => getUsers(usersPage + 1)}
                      loading={usersLoadingMore}
                    >
                      {translateFunction("Load more")}
                    </DashButton>
                  </div>
                )}
              </div>
            )}

            {usersError && (
              <div className="mt-3">
                <InlineAlert tone="error">{usersError}</InlineAlert>
              </div>
            )}
          </DashCard>
        )}
      </div>
    );
  };

  const sectionTiles: {
    tab: TabType;
    icon: IconName;
    label: string;
    desc: string;
    show: boolean;
  }[] = [
    {
      tab: "products",
      icon: "products",
      label: translateFunction("Products"),
      desc: translateFunction("Browse and manage your catalogue"),
      show: canViewProducts,
    },
    {
      tab: "boutiques",
      icon: "boutiques",
      label: translateFunction("Boutiques"),
      desc: translateFunction("Storefronts under this shop"),
      show: canViewBoutiques,
    },
    {
      tab: "orders",
      icon: "orders",
      label: translateFunction("Orders"),
      desc: translateFunction("Track and fulfil customer orders"),
      show: canViewOrders,
    },
    {
      tab: "gallery",
      icon: "gallery",
      label: translateFunction("Gallery"),
      desc: translateFunction("Upload and reuse product images"),
      show: canViewGallery,
    },
    {
      tab: "stories",
      icon: "stories",
      label: translateFunction("Stories"),
      desc: translateFunction("Share photo & video stories"),
      show: canViewStories,
    },
    {
      tab: "excel",
      icon: "excel",
      label: translateFunction("Upload Excel File"),
      desc: translateFunction("Bulk-import products by template"),
      show: canUploadExcel,
    },
    {
      tab: "comments",
      icon: "comments",
      label: translateFunction("Customers Comments"),
      desc: translateFunction("Reply to reviews and FAQ"),
      show: isAdmin,
    },
    {
      tab: "users",
      icon: "users",
      label: translateFunction("Users"),
      desc: translateFunction("Manage team members and roles"),
      show: canViewUsers,
    },
    {
      tab: "permissions",
      icon: "permissions",
      label: translateFunction("Permissions"),
      desc: translateFunction("Review your access in this shop"),
      show: true,
    },
    {
      tab: "shopInfo",
      icon: "shopInfo",
      label: translateFunction("Shop Info"),
      desc: translateFunction("Edit shop name, contact & media"),
      show: canViewShopInfo,
    },
  ];

  const renderHome = () => {
    if (permissionsLoading || (loading && sellerPermissions.length === 0))
      return (
        <LoadingState label={translateFunction("Preparing your dashboard...")} />
      );

    const tiles = sectionTiles.filter((t) => t.show);
    return (
      <div>
        <div className="mb-5">
          <h2 className="text-[18px] bold text-[#1d1d1d]">
            {translateFunction("Welcome back")}
          </h2>
          <p className="text-[14px] text-[#8e8e8e] mt-0.5">
            {translateFunction("Choose a section to get started.")}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {tiles.map((t) => (
            <button
              key={t.tab}
              onClick={() => setActiveTab(t.tab)}
              className="group flex items-center gap-3.5 p-4 rounded-[15px] bg-[#f8f8f8] border border-transparent hover:bg-white hover:border-[#ededed] hover:shadow-[0_3px_10px_rgba(0,0,0,0.08)] transition-all active:scale-[0.99] text-left"
            >
              <span className="w-11 h-11 shrink-0 rounded-[12px] bg-[#5d5d5d]/10 text-[#5d5d5d] flex items-center justify-center group-hover:bg-[#5d5d5d] group-hover:text-white transition-colors">
                <DashIcon name={t.icon} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] semibold text-[#3c3c3c] truncate">
                  {t.label}
                </p>
                <p className="text-[12px] text-[#8e8e8e] truncate">{t.desc}</p>
              </div>
              <span className="shrink-0 text-[#c4c2c2] group-hover:text-[#5d5d5d] transition-colors">
                <DashIcon
                  name={isRtl ? "chevronLeft" : "chevronRight"}
                  size={18}
                />
              </span>
            </button>
          ))}
        </div>
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
      <div
        className="bg-white rounded-[15px] p-5 lg:p-6 mb-6"
        style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
      >
        {/* Navigation Menu */}
        <div className="relative" ref={menuRef}>
          {/* Hamburger Menu Button */}

          {/* Overlay */}
          {menuOpen && (
            <div
              className="fixed inset-0 bg-[#0000006a] z-[9999999998] transition-opacity duration-300"
              onClick={() => setMenuOpen(false)}
            />
          )}

          {/* Sliding Menu */}
          <div
            className={`fixed left-0 top-0 h-screen w-64 shadow-2xl z-[9999999999] transition-transform duration-300 ease-in-out overflow-y-auto bg-white ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Menu Header */}
            <div className="px-5 py-5 border-b border-[#ededed] flex items-center gap-2.5">
              <span className="text-[#5d5d5d]">
                <DashIcon name="shopInfo" size={22} />
              </span>
              <h2 className="text-[#3c3c3c] text-[16px] semibold">
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
                  className={`w-full text-left px-5 py-3.5 flex items-center gap-3 transition-colors border-l-[3px] ${
                    activeTab === "products"
                      ? "border-[#5d5d5d] bg-[#5d5d5d]/[0.07] text-[#5d5d5d] semibold"
                      : "border-transparent text-[#505050] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <DashIcon name="products" size={20} />
                  <span>{translateFunction("Products")}</span>
                  <span className="rounded-full min-w-[22px] h-[22px] px-1.5 flex items-center justify-center ml-auto text-[11px] semibold bg-[#5d5d5d]/10 text-[#5d5d5d]">
                    {loadingSideBar ? <Spinner /> : sellerProducts?.length}
                  </span>
                  {activeTab === "products" && (
                    <span className="ml-auto text-[#5d5d5d]">
                      <DashIcon name="check" size={16} />
                    </span>
                  )}
                </button>
              )}
              {canViewBoutiques && (
                <button
                  onClick={() => {
                    setActiveTab("boutiques");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 flex items-center gap-3 transition-colors border-l-[3px] ${
                    activeTab === "boutiques"
                      ? "border-[#5d5d5d] bg-[#5d5d5d]/[0.07] text-[#5d5d5d] semibold"
                      : "border-transparent text-[#505050] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <DashIcon name="boutiques" size={20} />
                  <span>{translateFunction("Boutiques")}</span>
                  <span className="rounded-full min-w-[22px] h-[22px] px-1.5 flex items-center justify-center ml-auto text-[11px] semibold bg-[#5d5d5d]/10 text-[#5d5d5d]">
                    {loadingSideBar ? <Spinner /> : sellerBoutiques?.length}
                  </span>
                  {activeTab === "boutiques" && (
                    <span className="ml-auto text-[#5d5d5d]">
                      <DashIcon name="check" size={16} />
                    </span>
                  )}
                </button>
              )}

              {canViewOrders && (
                <button
                  onClick={() => {
                    setActiveTab("orders");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 flex items-center gap-3 transition-colors border-l-[3px] ${
                    activeTab === "orders"
                      ? "border-[#5d5d5d] bg-[#5d5d5d]/[0.07] text-[#5d5d5d] semibold"
                      : "border-transparent text-[#505050] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <DashIcon name="orders" size={20} />
                  <span>{translateFunction("Orders")}</span>
                  {activeTab === "orders" && (
                    <span className="ml-auto text-[#5d5d5d]">
                      <DashIcon name="check" size={16} />
                    </span>
                  )}
                </button>
              )}
              {
                <button
                  onClick={() => {
                    setActiveTab("permissions");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 flex items-center gap-3 transition-colors border-l-[3px] ${
                    activeTab === "permissions"
                      ? "border-[#5d5d5d] bg-[#5d5d5d]/[0.07] text-[#5d5d5d] semibold"
                      : "border-transparent text-[#505050] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <DashIcon name="permissions" size={20} />
                  <span>{translateFunction("Permissions")}</span>
                  {activeTab === "permissions" && (
                    <span className="ml-auto text-[#5d5d5d]">
                      <DashIcon name="check" size={16} />
                    </span>
                  )}
                </button>
              }
              {canViewUsers && (
                <button
                  onClick={() => {
                    setActiveTab("users");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 flex items-center gap-3 transition-colors border-l-[3px] ${
                    activeTab === "users"
                      ? "border-[#5d5d5d] bg-[#5d5d5d]/[0.07] text-[#5d5d5d] semibold"
                      : "border-transparent text-[#505050] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <DashIcon name="users" size={20} />
                  <span>{translateFunction("Users")}</span>
                  {activeTab === "users" && (
                    <span className="ml-auto text-[#5d5d5d]">
                      <DashIcon name="check" size={16} />
                    </span>
                  )}
                </button>
              )}
              {canViewGallery && (
                <button
                  onClick={() => {
                    setActiveTab("gallery");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 flex items-center gap-3 transition-colors border-l-[3px] ${
                    activeTab === "gallery"
                      ? "border-[#5d5d5d] bg-[#5d5d5d]/[0.07] text-[#5d5d5d] semibold"
                      : "border-transparent text-[#505050] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <DashIcon name="gallery" size={20} />
                  <span>{translateFunction("Gallery")}</span>
                  {activeTab === "gallery" && (
                    <span className="ml-auto text-[#5d5d5d]">
                      <DashIcon name="check" size={16} />
                    </span>
                  )}
                </button>
              )}
              {canViewStories && (
                <button
                  onClick={() => {
                    setActiveTab("stories");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 flex items-center gap-3 transition-colors border-l-[3px] ${
                    activeTab === "stories"
                      ? "border-[#5d5d5d] bg-[#5d5d5d]/[0.07] text-[#5d5d5d] semibold"
                      : "border-transparent text-[#505050] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <DashIcon name="stories" size={20} />
                  <span>{translateFunction("Stories")}</span>
                  {activeTab === "stories" && (
                    <span className="ml-auto text-[#5d5d5d]">
                      <DashIcon name="check" size={16} />
                    </span>
                  )}
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    setActiveTab("comments");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 flex items-center gap-3 transition-colors border-l-[3px] ${
                    activeTab === "comments"
                      ? "border-[#5d5d5d] bg-[#5d5d5d]/[0.07] text-[#5d5d5d] semibold"
                      : "border-transparent text-[#505050] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <DashIcon name="comments" size={20} />
                  <span>{translateFunction("Customers Comments")}</span>
                  {activeTab === "comments" && (
                    <span className="ml-auto text-[#5d5d5d]">
                      <DashIcon name="check" size={16} />
                    </span>
                  )}
                </button>
              )}
              {canUploadExcel && (
                <button
                  onClick={() => {
                    setActiveTab("excel");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 flex items-center gap-3 transition-colors border-l-[3px] ${
                    activeTab === "excel"
                      ? "border-[#5d5d5d] bg-[#5d5d5d]/[0.07] text-[#5d5d5d] semibold"
                      : "border-transparent text-[#505050] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <DashIcon name="excel" size={20} />
                  <span>{translateFunction("Upload Excel File")}</span>
                  {activeTab === "excel" && (
                    <span className="ml-auto text-[#5d5d5d]">
                      <DashIcon name="check" size={16} />
                    </span>
                  )}
                </button>
              )}
              {canViewShopInfo && (
                <button
                  onClick={() => {
                    setActiveTab("shopInfo");
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 flex items-center gap-3 transition-colors border-l-[3px] ${
                    activeTab === "shopInfo"
                      ? "border-[#5d5d5d] bg-[#5d5d5d]/[0.07] text-[#5d5d5d] semibold"
                      : "border-transparent text-[#505050] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <DashIcon name="shopInfo" size={20} />
                  <span>{translateFunction("Shop Info")}</span>
                  {activeTab === "shopInfo" && (
                    <span className="ml-auto text-[#5d5d5d]">
                      <DashIcon name="check" size={16} />
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Menu Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#ededed] bg-[#fafafa]">
              <div className="text-[12px] text-center">
                <p className="text-[#8e8e8e]">{translateFunction("Seller ID")}</p>
                <p className="semibold text-[#3c3c3c] mt-1">{sellerId}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 lg:gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={translateFunction("Dashboard Menu")}
            className={`shrink-0 flex flex-col gap-1.5 p-3 rounded-[12px] transition-all duration-300 active:scale-[0.96] ${
              menuOpen
                ? "bg-[#5d5d5d] text-white"
                : "bg-[#f4f4f4] text-[#3c3c3c] hover:bg-[#ededed]"
            }`}
          >
            <span
              className={`w-5 h-0.5 bg-current transition-all duration-300 ${
                menuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            ></span>
            <span
              className={`w-5 h-0.5 bg-current transition-all duration-300 ${
                menuOpen ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`w-5 h-0.5 bg-current transition-all duration-300 ${
                menuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            ></span>
          </button>

          <Monogram name={currentShop?.shop_name} size={52} />

          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] bold text-[#1d1d1d] truncate">
              {currentShop?.shop_name || translateFunction("Seller Dashboard")}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] semibold ${
                  isAdmin
                    ? "bg-[#5d5d5d]/10 text-[#5d5d5d]"
                    : "bg-[#f4f4f4] text-[#505050]"
                }`}
              >
                <DashIcon name={isAdmin ? "star" : "role"} size={13} />
                {isAdmin
                  ? translateFunction("Super Admin")
                  : currentShop?.shop_role ||
                    translateFunction("Member")}
              </span>
              <span className="text-[12px] text-[#8e8e8e]">
                {translateFunction("Seller ID:")}{" "}
                <span className="medium text-[#505050]">{sellerId}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="bg-white rounded-[15px] pt-4 px-4 min-h-[400px] pb-[150px]!"
        style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
      >
        {activeTab === "none" && renderHome()}
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
