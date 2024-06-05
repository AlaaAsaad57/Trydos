import ProductDetails from "components/products/ProductDetails";
import "styles/productDetails.css";
import ProductDetailsSlider from "components/products/ProductDetailsSlider";
import ProductFooterSection from "components/products/ProductFooterSection";
let product = {
  id: 5491,
  name: "PlayStation DualSense Edge Wireless Controller",
  slug: "playstation-dualsense-edge-wireless-controller-cWnV2L",
  share_link:
    "https://market_staging.antiksef.online/product/playstation-dualsense-edge-wireless-controller-cWnV2L",
  details: "<p>PlayStation DualSense Edge Wireless Controller</p>",
  thumbnail:
    "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/thumbnail/2024-05-21-664ccb3ded2ae.png",
  images: [
    "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2024-05-21-664ccb37a6c35.png",
    "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2024-05-21-664ccb39cfeba.png",
    "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2024-05-21-664ccb3bd52c3.png",
  ],
  categories: [
    {
      id: 287,
      name: "Toys-Outdoor",
      icon: "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/category/2024-05-19-6649aae1e13f5.svg",
    },
  ],
  category: {
    id: 287,
    name: "Toys-Outdoor",
    icon: "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/category/2024-05-19-6649aae1e13f5.svg",
  },
  brand: {
    id: 778,
    name: "Reddit",
    image:
      "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/brand/2024-05-15-6643cfcd8c03b.svg",
  },
  colors: null,
  sync_color_images: null,
  price: 100,
  price_formatted: "100 ₺",
  offer_price: 70,
  offer_price_formatted: "70 ₺",
  is_favourite: false,
  in_stock: true,
  rating: {
    overall_rating: 0,
    total_rating: 0,
  },
  flash_deal_details: null,
  flash_deal_max_allowed_quantity: null,
};
function page({ params: productId }) {
  return (
    <div className="product-details-container">
      <ProductDetailsSlider Images={product.images} name={product.name} />

      <ProductFooterSection product={product} />
    </div>
  );
}

export default page;
