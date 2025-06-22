import React, { useRef, useEffect } from "react";
import { translateFunction } from "utils/functions";
import Image from "next/image";
import NextLink from "components/global/NextLink";
import { useAppStore } from "store";
import { useParams } from "next/navigation";
import { GetImageUrl } from "utils/tinyUtils";

interface WishListPanelProps {
  onClose: () => void;
}

const WishListPanel: React.FC<WishListPanelProps> = ({ onClose }) => {
  const { currency } = useAppStore();
  const { lang } = useParams();
  const wishListRef = useRef<HTMLDivElement>(null);
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

  const placeholderImage = "https://placehold.co/60x150"; // Placeholder image URL

  // Mock data for wishlist items
  const wishlistItems = [
    {
      id: 1,
      name: "Apple iPhone 14",
      description:
        "The latest iPhone with advanced features and stunning design.",
      slug: "iphone-14",
      thumbnail: placeholderImage, // Use placeholder image
      price: 999.99,
      offer_price: 899.99,
      colors: ["#FF5733", "#33FF57", "#3357FF"], // Example colors
      sizes: ["128GB", "256GB", "512GB"], // Example sizes
    },
    {
      id: 2,
      name: "Samsung Galaxy S22",
      description: "A powerful smartphone with an amazing camera and display.",
      slug: "galaxy-s22",
      thumbnail: placeholderImage, // Use placeholder image
      price: 799.99,
      offer_price: 749.99,
      colors: ["#FF33A1", "#33A1FF", "#A133FF"], // Example colors
      sizes: ["128GB", "256GB"], // Example sizes
    },
    {
      id: 3,
      name: "Sony WH-1000XM4",
      description:
        "Industry-leading noise-canceling headphones with superior sound quality.",
      slug: "sony-wh-1000xm4",
      thumbnail: placeholderImage, // Use placeholder image
      price: 349.99,
      offer_price: 299.99,
      colors: ["#000000", "#FFFFFF"], // Example colors
      sizes: ["One Size"], // Example sizes
    },
    // Add more realistic items as needed
  ];

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
            stroke="currentColor"
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
            stroke="currentColor"
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
        {wishlistItems.length > 0 ? (
          wishlistItems.map((item) => (
            <NextLink
              data={{
                is_product: true,
                ...item,
                href: `/${lang}/products/${item.slug}`,
              }}
              ariaLabel={`wishlist item ${item.slug}`}
              key={item.id}
              data-cy="wishlist-item"
              className="flex gap-3 p-4 hover:bg-gray-50 border-b border-gray-100"
              href={`#`}
              //   href={`/${lang}/products/${item.slug}`}
            >
              <div
                className="relative w-20 h-[90px] flex-shrink-0"
                data-cy="wishlist-container-img"
              >
                <Image
                  data-cy="wishlist-img"
                  src={GetImageUrl(item.thumbnail)}
                  alt={item.name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <div className="flex-1" data-cy="wishlist-body-item">
                <div
                  className="text-sm font-medium text-gray-900 hover:text-blue-600"
                  data-cy="wishlist-item-name"
                >
                  {item.name}
                </div>
                <div
                  className="text-xs text-gray-600"
                  data-cy="wishlist-item-description"
                >
                  {item.description}
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
                      {item.price}
                    </span>
                  )}
                  <span
                    className="text-sm font-medium text-gray-900"
                    data-cy="wishlist-item-new-price"
                  >
                    {currency.symbol}
                    {item.offer_price}
                  </span>
                </div>
                <div className="mt-2" data-cy="wishlist-item-footer">
                  <div className="flex gap-1" data-cy="wishlist-item-circles">
                    {item.colors.map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full"
                        data-cy="wishlist-item-color-circle"
                        style={{ backgroundColor: color }}
                        aria-label={`Color option ${color}`}
                      />
                    ))}
                  </div>
                  <div
                    className="mt-1 text-xs text-gray-600"
                    data-cy="wishlist-item-sizes"
                  >
                    Sizes: {item.sizes.join(", ")}
                  </div>
                </div>
              </div>
            </NextLink>
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
              {translateFunction("Your wishlist is empty")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishListPanel;
