const initialState = {
  value: "",
  searchWords: ["Hi", "Dress", "Mango", "Paints", "Zara", "Mango Brand"].sort(),
  searchResults: {
    products: [
      {
        id: 1,
        name: "Deort Fitted Dress In Knit Fabric With A High Neck And Shortslev",
        photo:
          "https://cdn.longtallsally.com/Images/ProductImages/Big/95a5fbdc-310b-4d_354254_A.jpg",
      },
      {
        id: 2,
        name: "Deort Fitted Dress In Knit Fabric With A High Neck And Shortslev",
        photo:
          "https://cdn.longtallsally.com/Images/ProductImages/Big/95a5fbdc-310b-4d_354254_A.jpg",
      },
      {
        id: 3,
        name: "Deort Fitted Dress In Knit Fabric With A High Neck And Shortslev",
        photo:
          "https://cdn.longtallsally.com/Images/ProductImages/Big/95a5fbdc-310b-4d_354254_A.jpg",
      },
      {
        id: 4,
        name: "Deort Fitted Dress In Knit Fabric With A High Neck And Shortslev",
        photo:
          "https://cdn.longtallsally.com/Images/ProductImages/Big/95a5fbdc-310b-4d_354254_A.jpg",
      },
    ],
    brands: [
      {
        id: 1,
        name: "Mango",
        photo:
          "https://res.cloudinary.com/dtcmozf4d/image/upload/h_50/f_webp/q_auto/v1/boutiques/boutiques/icon/2024-05-22-664e11545eb62.svg",
      },
    ],
    categories: [
      {
        name: "Women",
        icon: "https://res.cloudinary.com/dtcmozf4d/image/upload/h_50/f_webp/q_auto/v1/category/2024-05-18-664907800d7c2.svg",
      },
      {
        name: "Men",
        icon: "https://res.cloudinary.com/dtcmozf4d/image/upload/h_50/f_webp/q_auto/v1/category/2024-05-19-6649a9ce5e0ed.svg",
      },
    ],
    boutiques: [{ id: 1, name: "Boutique", photo: "" }],
  },
  enable: false,
};

const SearchReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "SEARCH-WORD": {
      return {
        ...state,
        value: payload,
      };
    }
    case "ENABLE-SEARCH": {
      return {
        ...state,
        enable: payload,
      };
    }
    default:
      return state;
  }
};
export default SearchReducer;
