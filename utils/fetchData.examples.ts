import React from "react";
import {
  fetchData,
  fetchMarketData,
  fetchChatData,
  fetchStoriesData,
} from "./fetchData";

// Example 1: Basic GET request to Market API
export const getProducts = async () => {
  try {
    const data = await fetchMarketData<{ products: any[] }>(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/products`,
      "GET",
      null,
      { useCached: true, reqTitle: "Get Products" }
    );

    console.log("Products loaded:", data.products);
    return data.products;
  } catch (error) {
    console.error("Failed to load products:", error);
    throw error;
  }
};

// Example 2: POST request to create a new product
export const createProduct = async (productData: {
  name: string;
  price: number;
}) => {
  try {
    const newProduct = await fetchMarketData(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/products`,
      "POST",
      productData,
      { reqTitle: "Create Product" }
    );

    console.log("Product created:", newProduct);
    return newProduct;
  } catch (error) {
    console.error("Failed to create product:", error);
    throw error;
  }
};

// Example 3: Chat API - Send message
export const sendMessage = async (channelId: string, content: string) => {
  try {
    const message = await fetchChatData(
      `${process.env.NEXT_PUBLIC_CHAT_BACKEND_URL}/api/v1/messages`,
      "POST",
      { channelId, content },
      { reqTitle: "Send Message" }
    );

    return message;
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
};

// Example 4: Stories API - Get user stories
export const getUserStories = async (userId: string) => {
  try {
    const stories = await fetchStoriesData<{ stories: any[] }>(
      `${process.env.NEXT_PUBLIC_STORIES_BACKEND_URL}/api/v1/users/${userId}/stories`,
      "GET",
      null,
      { useCached: false, reqTitle: `Get Stories for User ${userId}` }
    );

    return stories.stories;
  } catch (error) {
    console.error("Failed to load stories:", error);
    throw error;
  }
};

// Example 5: Using the main fetchData function with full configuration
export const updateProfile = async (profileData: {
  name: string;
  bio: string;
}) => {
  try {
    const updatedProfile = await fetchData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/customer/update-profile`,
      method: "PUT",
      body: profileData,
      server: "market",
      reqTitle: "Update Profile",
    });

    return updatedProfile;
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw error;
  }
};

// Example 6: DELETE request
export const deleteProduct = async (productId: string) => {
  try {
    await fetchMarketData(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${productId}`,
      "DELETE",
      null,
      { reqTitle: `Delete Product ${productId}` }
    );

    console.log("Product deleted successfully");
  } catch (error) {
    console.error("Failed to delete product:", error);
    throw error;
  }
};

// Example 7: Using in a React component with async/await
export const ProductComponent = () => {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadProducts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
};

// Example 8: Sequential API calls
export const getDetailedProductInfo = async (productId: string) => {
  try {
    // Get basic product info
    const product = await fetchMarketData(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${productId}`,
      "GET",
      null,
      { useCached: true, reqTitle: "Get Product Details" }
    );

    // Get product reviews
    const reviews = await fetchMarketData(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${productId}/reviews`,
      "GET",
      null,
      { useCached: true, reqTitle: "Get Product Reviews" }
    );

    // Get related products
    const related = await fetchMarketData(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${productId}/related`,
      "GET",
      null,
      { useCached: true, reqTitle: "Get Related Products" }
    );

    return {
      product,
      reviews,
      related,
    };
  } catch (error) {
    console.error("Failed to get product details:", error);
    throw error;
  }
};

// Example 9: Parallel API calls
export const getDashboardData = async () => {
  try {
    const [products, orders, messages] = await Promise.all([
      fetchMarketData("/products", "GET", null, { useCached: true }),
      fetchMarketData("/orders", "GET", null, { useCached: false }),
      fetchChatData("/api/v1/messages", "GET", null, { useCached: false }),
    ]);

    return { products, orders, messages };
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    throw error;
  }
};

// Example 10: Error handling with specific responses
export const handleApiErrors = async () => {
  try {
    const data = await fetchMarketData("/protected-endpoint", "GET");
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Authentication required")) {
        // Handle 401 after failed auth
        console.log("User needs to authenticate");
        // Redirect to login or show auth modal
      } else if (error.message.includes("HTTP error! status: 403")) {
        // Handle forbidden
        console.log("Access denied");
      } else if (error.message.includes("HTTP error! status: 404")) {
        // Handle not found
        console.log("Resource not found");
      } else if (error.message.includes("fetch")) {
        // Handle network error
        console.log("Network error - check connection");
      }
    }
    throw error;
  }
};

// Example 11: Using with form submission
export const handleFormSubmit = async (formData: FormData) => {
  try {
    const result = await fetchMarketData(
      "/forms/submit",
      "POST",
      Object.fromEntries(formData),
      { reqTitle: "Submit Form" }
    );

    // Show success message
    alert("Form submitted successfully!");
    return result;
  } catch (error) {
    // Show error message
    alert("Failed to submit form: " + error.message);
    throw error;
  }
};

// Example 12: Conditional requests
export const getConditionalData = async (userId?: string) => {
  if (!userId) {
    // Get public data
    return await fetchMarketData("/public/data", "GET", null, {
      useCached: true,
    });
  } else {
    // Get user-specific data
    return await fetchMarketData(`/users/${userId}/data`, "GET", null, {
      useCached: false,
    });
  }
};
