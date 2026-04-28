import React, { useRef, useEffect, useState } from "react";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import Image from "next/image";
import NextLink from "components/global/NextLink";
import { useAppStore } from "store";
import { useParams } from "next/navigation";
import { GetImageUrl } from "utils/tinyUtils";
import { wishlistService, WishlistItem } from "services/wishlist";
import { showSuccessNotification } from "@/store/notifications/reducer";

const WishListPanel = ({ onClose }) => {
  const wishListRef = useRef<HTMLDivElement>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Handle document scroll lock
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPosition = window.getComputedStyle(document.body).position;
    const originalTop = window.getComputedStyle(document.body).top;
    const originalWidth = window.getComputedStyle(document.body).width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, parseInt(originalTop || "0") * -1);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wishListRef.current &&
        !wishListRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        setLoading(true);
        const items = await wishlistService.getWishlist();
        setWishlistItems(items);
      } catch (error) {
        console.error("Error loading wishlist:", error);
      } finally {
        setLoading(false);
      }
    };
    loadWishlist();
  }, []);

  const handleDeleteItem = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await wishlistService.removeFromWishlist(productId);
      setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
      showSuccessNotification(translateFunction("Removed from checklist"));
    } catch (error) {
      console.error("Error removing from CheckList:", error);
    }
  };
  return (
    <div
      data-cy="wishList-card"
      ref={wishListRef}
      style={{
        position: "fixed",
        top: 10,
        right: 0,
        maxHeight: "600px",
        maxWidth: "400px",
        width: "100%",
        background: "#fff",
        boxShadow: "-2px 0 5px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        data-cy="wishList-header"
        style={{
          padding: "15px",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
          data-cy="wishList-left"
        >
          <svg
            data-cy="wishList-svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1d1d1d"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span
            style={{ fontWeight: 600, fontSize: "16px", color: "#333" }}
            data-cy="wishList-statement"
          >
            {translateFunction("Wishlist")}
          </span>
        </div>
        <button
          data-cy="close-button"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            data-cy="close-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1d1d1d"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div
        data-cy="wishlist-body"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 0",
          height: "calc(100% - 60px)",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
        }}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent min-h-[400px]"
      >
        {loading ? (
          <div
            data-cy="loading-container"
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "#65676b",
            }}
          >
            <p className="text-sm">{translateFunction("Loading...")}</p>
          </div>
        ) : wishlistItems.length > 0 ? (
          wishlistItems.map((item) => (
            <WishListItem
              item={item}
              handleDeleteItem={handleDeleteItem}
              close={onClose}
            />
          ))
        ) : (
          <div
            data-cy="empty-container"
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "#65676b",
            }}
          >
            <svg
              data-cy="empty-icon"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <p className="text-sm" data-cy="empty-statement">
              {translateFunction("Your CheckList is empty")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishListPanel;

const WishListItem = ({ item, handleDeleteItem, close }) => {
  const { language, currency } = useAppStore();
  const params = useParams();
  const lang = params.lang;

  if (params.productId === item.slug) {
    return (
      <div
        key={item.id}
        data-cy="wishlist-item"
        className="flex gap-3 p-4 hover:bg-gray-50 border-b border-gray-100 relative"
      >
        <div
          className="flex gap-3 flex-1"
          onClick={() => {
            close();
          }}
        >
          <div
            className="relative w-20 h-[90px] shrink-0"
            data-cy="wishlist-container-img"
          >
            <Image
              data-cy="wishlist-img"
              src={getConfiguredImage({
                src: GetImageUrl(item.thumbnail),
                width: 100,
                height: 100,
              })}
              alt={item.name}
              fill
              className="object-cover rounded-md"
            />
          </div>
          <div className="flex-1" data-cy="wishlist-body-item">
            <div className="flex">
              <Image
                alt="brand-icon"
                className="max-w-[40px] max-h-[25px] w-auto object-contain h-full"
                width={50}
                height={50}
                src={GetImageUrl(item.brand?.icon)}
              />
            </div>
            <div
              className="text-sm font-medium text-gray-900 hover:text-blue-600"
              data-cy="wishlist-item-name"
            >
              {item.name}
            </div>
            <div
              className="mt-1 flex items-center gap-2"
              data-cy="wishlist-item-price"
            >
              {item.offer_price < item.price && (
                <span
                  className="text-sm text-gray-500 line-through"
                  data-cy="wishlist-item-old-price"
                >
                  {currency.symbol}
                  {RoundPrice({ num: item.price })}
                </span>
              )}
              <span
                className="text-sm font-medium text-gray-900"
                data-cy="wishlist-item-new-price"
              >
                {currency.symbol}
                {RoundPrice({ num: item.offer_price })}
              </span>
            </div>
            <div className="mt-2" data-cy="wishlist-item-footer">
              <div className="flex gap-1" data-cy="wishlist-item-circles">
                {item.colors?.map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-gray-300"
                    data-cy="wishlist-item-color-circle"
                    style={{ backgroundColor: color }}
                    aria-label={`Color option ${color}`}
                  />
                ))}
              </div>
              {item.sizes && item.sizes.length > 0 && (
                <div
                  className="mt-1 text-xs text-gray-600"
                  data-cy="wishlist-item-sizes"
                >
                  Sizes: {item.sizes.join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => handleDeleteItem(e, item.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleDeleteItem(e as any, item.id);
            }
          }}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
          data-cy="wishlist-item-delete"
          aria-label="Remove from wishlist"
          tabIndex={0}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-600"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    );
  } else {
    return (
      <div
        key={item.id}
        onClick={() => {
          close();
        }}
        data-cy="wishlist-item"
        className="flex gap-3 p-4 hover:bg-gray-50 border-b border-gray-100 relative"
      >
        <NextLink
          data={{
            is_product: true,
            ...item,
          }}
          ariaLabel={`wishlist item ${item.slug}`}
          className="flex gap-3 flex-1"
          href={`/${lang}/products/${item.slug}`}
        >
          <div
            className="relative w-20 h-[90px] shrink-0"
            data-cy="wishlist-container-img"
          >
            <Image
              data-cy="wishlist-img"
              src={getConfiguredImage({
                src: GetImageUrl(item.thumbnail),
                width: 100,
                height: 100,
              })}
              alt={item.name}
              fill
              className="object-cover rounded-md"
            />
          </div>
          <div className="flex-1" data-cy="wishlist-body-item">
            <div className="flex">
              <Image
                alt="brand-icon"
                className="max-w-[40px] max-h-[25px] w-auto object-contain h-full"
                width={50}
                height={50}
                src={item.brand?.icon?.file_path}
              />
            </div>
            <div
              className="text-sm font-medium text-gray-900 hover:text-blue-600"
              data-cy="wishlist-item-name"
            >
              {item.name}
            </div>
            <div
              className="mt-1 flex items-center gap-2"
              data-cy="wishlist-item-price"
            >
              {item.offer_price < item.price && (
                <span
                  className="text-sm text-gray-500 line-through"
                  data-cy="wishlist-item-old-price"
                >
                  {currency.symbol}
                  {RoundPrice({ num: item.price })}
                </span>
              )}
              <span
                className="text-sm font-medium text-gray-900"
                data-cy="wishlist-item-new-price"
              >
                {currency.symbol}
                {RoundPrice({ num: item.offer_price })}
              </span>
            </div>
            <div className="mt-2" data-cy="wishlist-item-footer">
              <div className="flex gap-1" data-cy="wishlist-item-circles">
                {item.colors?.map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-gray-300"
                    data-cy="wishlist-item-color-circle"
                    style={{ backgroundColor: color }}
                    aria-label={`Color option ${color}`}
                  />
                ))}
              </div>
              {item.sizes && item.sizes.length > 0 && (
                <div
                  className="mt-1 text-xs text-gray-600"
                  data-cy="wishlist-item-sizes"
                >
                  Sizes: {item.sizes.join(", ")}
                </div>
              )}
            </div>
          </div>
        </NextLink>
        <button
          onClick={(e) => handleDeleteItem(e, item.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleDeleteItem(e as any, item.id);
            }
          }}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
          data-cy="wishlist-item-delete"
          aria-label="Remove from wishlist"
          tabIndex={0}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-600"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    );
  }
};
