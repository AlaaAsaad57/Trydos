"use client";

import React from "react";
import { useFetch } from "./useFetch";

// Example 1: Simple GET request to Market API
export const ProductListExample = () => {
  const { data, error, loading, refetch } = useFetch<{ products: any[] }>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/products`,
    method: "GET",
    server: "market",
    useCached: true,
    reqTitle: "Fetch Products",
  });

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Products</h2>
      <button onClick={refetch}>Refresh Products</button>
      <ul>
        {data?.products?.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
};

// Example 2: POST request to Chat API
export const SendMessageExample = () => {
  const [message, setMessage] = React.useState("");
  const [shouldSend, setShouldSend] = React.useState(false);

  const { data, error, loading } = useFetch({
    url: `${process.env.NEXT_PUBLIC_CHAT_BACKEND_URL}/api/v1/messages`,
    method: "POST",
    body: shouldSend ? { content: message, channelId: "123" } : null,
    server: "chat",
    reqTitle: "Send Message",
  });

  const handleSend = () => {
    if (message.trim()) {
      setShouldSend(true);
    }
  };

  React.useEffect(() => {
    if (data && shouldSend) {
      console.log("Message sent:", data);
      setMessage("");
      setShouldSend(false);
    }
  }, [data, shouldSend]);

  return (
    <div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? "Sending..." : "Send"}
      </button>
      {error && <div>Error: {error.message}</div>}
    </div>
  );
};

// Example 3: Dynamic URL with Stories API
export const UserStoriesExample = ({ userId }: { userId: string }) => {
  const { data, error, loading, refetch } = useFetch<{ stories: any[] }>({
    url: `${process.env.NEXT_PUBLIC_STORIES_BACKEND_URL}/api/v1/users/${userId}/stories`,
    method: "GET",
    server: "stories",
    useCached: false, // Don't cache user-specific data
    reqTitle: `Fetch Stories for User ${userId}`,
  });

  if (loading) return <div>Loading stories...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>User Stories</h3>
      <button onClick={refetch}>Refresh Stories</button>
      {data?.stories?.map((story) => (
        <div key={story.id}>
          <img src={story.image} alt={story.title} />
          <p>{story.title}</p>
        </div>
      ))}
    </div>
  );
};

// Example 4: PUT request with error handling
export const UpdateProfileExample = () => {
  const [profile, setProfile] = React.useState({ name: "", bio: "" });
  const [updateTrigger, setUpdateTrigger] = React.useState(0);

  const { data, error, loading } = useFetch({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/customer/update-profile`,
    method: "PUT",
    body: updateTrigger > 0 ? profile : null,
    server: "market",
    reqTitle: "Update Profile",
  });

  const handleUpdate = () => {
    setUpdateTrigger((prev) => prev + 1);
  };

  React.useEffect(() => {
    if (data && updateTrigger > 0) {
      alert("Profile updated successfully!");
    }
  }, [data, updateTrigger]);

  // Handle 401 errors specifically
  React.useEffect(() => {
    if (error?.message.includes("401")) {
      console.log("User needs to re-authenticate");
      // The hook will automatically handle token refresh
    }
  }, [error]);

  return (
    <div>
      <h3>Update Profile</h3>
      <input
        type="text"
        placeholder="Name"
        value={profile.name}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
      />
      <textarea
        placeholder="Bio"
        value={profile.bio}
        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
      />
      <button onClick={handleUpdate} disabled={loading}>
        {loading ? "Updating..." : "Update Profile"}
      </button>
      {error && <div style={{ color: "red" }}>Error: {error.message}</div>}
    </div>
  );
};

// Example 5: Using with conditional fetching
export const ConditionalFetchExample = ({
  productId,
}: {
  productId?: string;
}) => {
  // Only fetch if productId is provided
  const shouldFetch = Boolean(productId);

  const { data, error, loading } = useFetch({
    url: shouldFetch
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${productId}`
      : "/dummy", // Dummy URL when not fetching
    method: "GET",
    server: "market",
    useCached: true,
    reqTitle: productId ? `Fetch Product ${productId}` : undefined,
  });

  if (!productId) return <div>Please select a product</div>;
  if (loading) return <div>Loading product details...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>{data?.name}</h3>
      <p>{data?.description}</p>
      <p>Price: ${data?.price}</p>
    </div>
  );
};

// Example 6: Demonstrating cache behavior
export const CacheExample = () => {
  const [count, setCount] = React.useState(0);

  // This will use cache after first load
  const {
    data: cachedData,
    loading: cachedLoading,
    refetch: refetchCached,
  } = useFetch({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/config`,
    method: "GET",
    server: "market",
    useCached: true,
    reqTitle: "Cached Config",
  });

  // This will always fetch fresh data
  const {
    data: freshData,
    loading: freshLoading,
    refetch: refetchFresh,
  } = useFetch({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/config`,
    method: "GET",
    server: "market",
    useCached: false,
    reqTitle: "Fresh Config",
  });

  return (
    <div>
      <h3>Cache Demonstration</h3>
      <p>Component render count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>
        Re-render Component
      </button>

      <div style={{ display: "flex", gap: "20px" }}>
        <div>
          <h4>Cached Request</h4>
          <p>Loading: {cachedLoading ? "Yes" : "No"}</p>
          <p>Data: {JSON.stringify(cachedData)}</p>
          <button onClick={refetchCached}>Force Refetch</button>
        </div>

        <div>
          <h4>Fresh Request</h4>
          <p>Loading: {freshLoading ? "Yes" : "No"}</p>
          <p>Data: {JSON.stringify(freshData)}</p>
          <button onClick={refetchFresh}>Refetch</button>
        </div>
      </div>
    </div>
  );
};

// Example 7: DELETE request
export const DeleteItemExample = ({ itemId }: { itemId: string }) => {
  const [shouldDelete, setShouldDelete] = React.useState(false);

  const { data, error, loading } = useFetch({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/items/${itemId}`,
    method: "DELETE",
    server: "market",
    reqTitle: `Delete Item ${itemId}`,
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setShouldDelete(true);
    }
  };

  React.useEffect(() => {
    if (data && shouldDelete) {
      console.log("Item deleted successfully");
      // Handle post-deletion logic (e.g., redirect, update list)
    }
  }, [data, shouldDelete]);

  return (
    <div>
      <button onClick={handleDelete} disabled={loading}>
        {loading ? "Deleting..." : "Delete Item"}
      </button>
      {error && <div>Error: {error.message}</div>}
    </div>
  );
};
