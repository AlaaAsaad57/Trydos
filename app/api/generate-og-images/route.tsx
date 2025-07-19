import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const MAX_IMAGES = 4; // Limit to prevent performance issues

interface ImageData {
  src: string;
  width: number;
  height: number;
}

interface OGData {
  title?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  brand?: string;
  category?: string;
  rating?: string;
  discount?: string;
  badge?: string;
  type?: "product" | "collection" | "brand" | "deal" | "compare";
}

async function fetchImageAsBase64(url: string): Promise<ImageData | null> {
  let valid_url;
  if (url.startsWith("http")) {
    valid_url = url;
  } else {
    valid_url = `${process.env.NEXT_PUBLIC_BASE_CLOUDINARY_URL}${url}`.replace(
      "upload",
      "upload/h_120,w_180,c_pad,q_60/f_auto/fl_lossy/so_0"
    );
  }
  try {
    const response = await fetch(valid_url, {
      next: {
        revalidate: 172800,
      },
    });
    if (!response.ok) return null;

    return {
      src: response.url,
      width: 300, // Default width, will be adjusted
      height: 300, // Default height, will be adjusted
    };
  } catch (error) {
    console.error("Failed to fetch image:", url, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse all parameters
    const imagesParam = searchParams.get("images");
    const ogData: OGData = {
      title: searchParams.get("title") || undefined,
      description: searchParams.get("description") || undefined,
      price: searchParams.get("price") || undefined,
      originalPrice: searchParams.get("originalPrice") || undefined,
      brand: searchParams.get("brand") || undefined,
      category: searchParams.get("category") || undefined,
      rating: searchParams.get("rating") || undefined,
      discount: searchParams.get("discount") || undefined,
      badge: searchParams.get("badge") || undefined,
      type: (searchParams.get("type") as OGData["type"]) || "product",
    };

    // Validate required parameters
    if (!imagesParam && !ogData.title) {
      return new Response("Missing required parameters: images or title", {
        status: 400,
      });
    }

    let validImages: ImageData[] = [];

    // Process images if provided
    if (imagesParam) {
      const imageUrls = imagesParam
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url.length > 0)
        .slice(0, MAX_IMAGES);

      if (imageUrls.length > 0) {
        const imagePromises = imageUrls.map((url) => fetchImageAsBase64(url));
        const imageResults = await Promise.all(imagePromises);

        validImages = imageResults.filter((img) => img !== null);
      }
    }

    // Determine layout based on content
    const hasImages = validImages.length > 0;
    const hasText = ogData.title || ogData.description;

    if (!hasImages && !hasText) {
      return new Response("No valid content provided", { status: 400 });
    }

    // Calculate dimensions for horizontal layout - optimized for smaller file size
    const containerWidth = OG_WIDTH - 80; // 80px for padding
    const maxImages = Math.min(validImages.length, 3); // Limit to 3 images max for file size
    const imageWidth = hasImages
      ? Math.floor(containerWidth / maxImages) - 20
      : 0;
    const imageHeight = 380; // Reduced height for smaller file size

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f8f9fa",
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            position: "relative",
            overflow: "visible",
          }}
        >
          {/* Main Images Container - Horizontal Layout */}
          {hasImages && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "20px",
                padding: "20px",
                alignItems: "flex-start",
                justifyContent: "center",
                height: "100%",
                zIndex: "1",
              }}
            >
              {validImages.slice(0, maxImages).map((image, index) => (
                <div
                  key={index}
                  style={{
                    position: "relative",
                    width: `${imageWidth}px`,
                    height: `${imageHeight}px`,
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Product Image */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      display: "flex",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.src}
                      alt={`Product ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />

                    {/* Badge overlay */}
                    {index === 0 && ogData.badge && (
                      <div
                        style={{
                          position: "absolute",
                          top: "20px",
                          left: "20px",
                          background: "#dc2626",
                          color: "#ffffff",
                          padding: "8px 16px",
                          borderRadius: "12px",
                          fontSize: "14px",
                          fontWeight: "700",
                          boxShadow: "0 2px 4px rgba(220, 38, 38, 0.3)",
                          display: "flex",
                        }}
                      >
                        {ogData.badge}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Central Overlay Container with Title and Description */}
          {hasText && (
            <div
              style={{
                position: "absolute",
                bottom: "0px",
                left: "50%",
                transform: "translate(-50%,0%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "16px",
                paddingInline: "20px",
                width: "100%",
                maxWidth: "98%",
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* TryDos Logo */}
              <img
                src={process.env.NEXT_PUBLIC_REMOTE_FRONT + "/svg/LogoAuth.svg"}
                alt="TryDos"
                width={120}
              />

              {/* Title */}
              {ogData.title && (
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#1f2937",
                    marginTop: "12px",
                    lineHeight: "1.2",
                    display: "flex",
                  }}
                >
                  {ogData.title}
                </div>
              )}

              {/* Description */}
              {ogData.description && (
                <div
                  style={{
                    fontSize: "18px",
                    color: "#6b7280",
                    lineHeight: "1.5",
                    marginBottom: "24px",
                    maxWidth: "600px",
                    display: "flex",
                  }}
                >
                  {ogData.description}
                </div>
              )}

              {/* Price and Details Row */}
              <div
                style={{
                  display: "flex",
                  gap: "24px",
                  alignItems: "center",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {/* Price Section */}
                {ogData.price && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        color: "#059669",
                        display: "flex",
                      }}
                    >
                      {ogData.price}
                    </div>
                    {ogData.originalPrice && (
                      <div
                        style={{
                          fontSize: "16px",
                          color: "#9ca3af",
                          textDecoration: "line-through",
                          display: "flex",
                        }}
                      >
                        {ogData.originalPrice}
                      </div>
                    )}
                    {ogData.discount && (
                      <div
                        style={{
                          background: "#dc2626",
                          color: "#ffffff",
                          padding: "4px 12px",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: "700",
                          display: "flex",
                        }}
                      >
                        -{ogData.discount}
                      </div>
                    )}
                  </div>
                )}

                {/* Brand & Category */}
                {(ogData.brand || ogData.category) && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    {ogData.brand && (
                      <div
                        style={{
                          backgroundColor: "#f3f4f6",
                          color: "#374151",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          display: "flex",
                        }}
                      >
                        {ogData.brand}
                      </div>
                    )}
                    {ogData.category && (
                      <div
                        style={{
                          backgroundColor: "#dbeafe",
                          color: "#1e40af",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          display: "flex",
                        }}
                      >
                        {ogData.category}
                      </div>
                    )}
                  </div>
                )}

                {/* Rating */}
                {ogData.rating && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        color: "#fbbf24",
                        fontSize: "16px",
                        display: "flex",
                      }}
                    >
                      ★★★★★
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#374151",
                        fontWeight: "600",
                        display: "flex",
                      }}
                    >
                      {ogData.rating}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fallback text content when no images */}
          {!hasImages && hasText && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                padding: "40px",
                textAlign: "center",
                color: "#1f2937",
              }}
            >
              {/* TryDos Logo */}
              <img
                src={process.env.NEXT_PUBLIC_REMOTE_FRONT + "/svg/LogoAuth.svg"}
                alt="TryDos"
                width={140}
                style={{ marginBottom: "20px" }}
              />

              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "800",
                  marginBottom: "16px",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  display: "flex",
                }}
              >
                {ogData.title}
              </div>
              {ogData.description && (
                <div
                  style={{
                    fontSize: "18px",
                    color: "#6b7280",
                    maxWidth: "600px",
                    display: "flex",
                  }}
                >
                  {ogData.description}
                </div>
              )}
            </div>
          )}

          {/* TryDos Branding */}
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              right: "40px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "rgba(255, 255, 255, 0.95)",
              padding: "12px 20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1f2937",
                letterSpacing: "-0.01em",
                display: "flex",
              }}
            >
              TryDos
            </div>
            <div
              style={{
                width: "6px",
                height: "6px",
                background: "#10b981",
                borderRadius: "50%",
                display: "flex",
              }}
            />
          </div>
        </div>
      ),
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        headers: {
          "Cache-Control":
            "public, max-age=172800, stale-while-revalidate=172800",
        },
      }
    );
  } catch (error) {
    console.error("Error generating OpenGraph image:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
