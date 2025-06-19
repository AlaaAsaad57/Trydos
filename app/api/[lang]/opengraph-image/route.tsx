import { ImageResponse } from "next/og";

// Simple translation function for edge runtime

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: { lang: string } }
) {
  const { searchParams } = new URL(request.url);
  const width = 1200;
  const height = 630;

  // Get language for translations
  const language = params.lang.split("-")[1] || "en";

  // Translate static text
  const premiumShopping = "Premium Shopping";
  const experience = "Experience";
  const featuredProducts = "Featured Products";
  const flashDeals = "Flash Deals";
  const premiumBrands = "Premium Brands";

  try {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            backgroundImage:
              "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%)",
            position: "relative",
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                "radial-gradient(circle at 25% 25%, #00000008 1px, transparent 1px), radial-gradient(circle at 75% 75%, #00000008 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />

          {/* Main Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 60px",
              textAlign: "center",
              zIndex: 2,
            }}
          >
            {/* TryDos Logo */}
            <div
              style={{
                marginBottom: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontSize: "64px",
                  fontWeight: "800",
                  color: "#212529",
                  letterSpacing: "-2px",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                TryDos
              </div>
            </div>

            {/* Main Title */}
            <div
              style={{
                fontSize: "48px",
                fontWeight: "700",
                color: "#495057",
                marginBottom: "16px",
                letterSpacing: "-1px",
                lineHeight: "1.1",
              }}
            >
              {premiumShopping}
            </div>

            {/* Subtitle */}
            <div
              style={{
                fontSize: "48px",
                fontWeight: "700",
                color: "#495057",
                marginBottom: "32px",
                letterSpacing: "-1px",
                lineHeight: "1.1",
              }}
            >
              {experience}
            </div>

            {/* Features */}
            <div
              style={{
                display: "flex",
                gap: "32px",
                fontSize: "22px",
                color: "#6c757d",
                fontWeight: "500",
              }}
            >
              <div>{featuredProducts}</div>
              <div style={{ color: "#dee2e6" }}>•</div>
              <div>{flashDeals}</div>
              <div style={{ color: "#dee2e6" }}>•</div>
              <div>{premiumBrands}</div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div
            style={{
              position: "absolute",
              top: "40px",
              right: "40px",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "linear-gradient(45deg, #007bff20, #007bff10)",
              border: "1px solid #007bff20",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              left: "40px",
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "linear-gradient(45deg, #28a74520, #28a74510)",
              border: "1px solid #28a74520",
            }}
          />

          {/* Language indicator */}
          <div
            style={{
              position: "absolute",
              bottom: "30px",
              right: "40px",
              fontSize: "16px",
              color: "#6c757d",
              textTransform: "uppercase",
              fontWeight: "600",
              backgroundColor: "#ffffff80",
              padding: "8px 16px",
              borderRadius: "20px",
              border: "1px solid #dee2e6",
            }}
          >
            {params.lang.toUpperCase()}
          </div>
        </div>
      ),
      {
        width,
        height,
        headers: {
          "Cache-Control":
            "public, max-age=8640000, stale-while-revalidate=86400",
        },
      }
    );
  } catch (e) {
    console.error("Error generating OpenGraph image:", e);
    return new Response("Failed to generate image", { status: 500 });
  }
}
