export type SEARCH_API_RESPONSE_TYPE = {
  data: {
    offset: Array<number>;
    limit: number;
    total_size: number;
    categories: Array<{
      name: string;
      icon: string;
      most_viewed_product_thumbnail: string;
      slug: string;
      childes: Array<{
        name: string;
        slug: string;
        most_viewed_product_thumbnail: string;
        childes: Array<{
          name: string;
          slug: string;
          most_viewed_product_thumbnail: string;
        }>;
      }>;
    }>;
    brands: Array<{
      name: string;
      icon: string;
      slug: string;
    }>;
    prices: {
      min_price: number;
      max_price: number;
      priceRanges: Array<{
        min_price: number;
        max_price: number;
        products_count: number;
      }>;
    };
    colors: Array<string>;
    attributes: Array<{
      id: number;
      name: string;
      options: Array<string>;
    }>;
    boutiques: Array<{
      id: number;
      name: string;
      slug: string;
      banner: {
        file_path: string;
        original_width: string;
        original_height: string;
      };
    }>;
    products: Array<{
      name: string;
      slug: string;
      details: string;
      colors: Array<{
        name: string;
        color: string;
      }>;
      images: Array<{
        file_path: string;
      }>;
      sync_color_images: Array<{
        color_name: string;
        images: Array<{
          file_path: string;
        }>;
      }>;
      price: number;
      offer_price: number;
      category: {
        name: string;
        icon: string;
      };
    }>;
  };
};
export type BOUTIQUE_DATA_RESPONSE_TYPE = {
  isSuccessful: boolean;
  hasContent: boolean;
  code: number;
  message: string;
  detailed_error: any;
  data: {
    id: number;
    icon: string;
    name: string;
    description: string;
    banners: Array<{
      file_path: string;
    }>;
  };
};
export type BOUTIQUES_LIST_RESPONSE_TYPE = {
  total: number;
  limit: number;
  offset: number;
  boutiques: Array<{
    name: string;
    icon: string;
    slug: string;
    description?: string;
    banners: Array<{
      file_path: string;
    }>;
    mainCategoriesForProductIds: Array<{
      icon: string;
      slug: string;
    }>;
    childCategoriesForProductIds: Array<{
      photo: string;
      name: string;
      most_viewed_product_name: string;
      slug: string;
    }>;
  }>;
};
export type HOME_PAGE_FEATURED_PRODUCTS_RESPONSE_TYPE = {
  offset: Array<number>;
  limit: number;
  total_size: number;
  products: Array<{
    name: string;
    slug: string;
    details: string;
    colors: Array<{
      name: string;
      color: string;
    }>;
    images: Array<{
      file_path: string;
    }>;
    sync_color_images: Array<{
      color_name: string;
      images: Array<{
        file_path: string;
      }>;
    }>;
    price: number;
    offer_price: number;
    category: {
      name: string;
      icon: string;
    };
  }>;
};
export type CUREENCY_RESPONSE_TYPE = {
  isSuccessful: boolean;
  hasContent: boolean;
  code: number;
  message: string;
  detailed_error: any;
  data: {
    currency: {
      id: number;
      name: string;
      symbol: string;
      code: string;
      exchange_rate: number;
    };
  };
};
export type PRODUCT_DETAILS_RESPONSE_TYPE = {
  id: number;
  name: string;
  slug: string;
  share_link: string;
  details: string;
  thumbnail: string;
  images: Array<string>;
  categories: Array<{
    id: number;
    name: string;
    icon: string;
  }>;
  category: {
    id: number;
    name: string;
    icon: string;
  };
  brand: {
    id: number;
    slug: string;
    name: string;
    icon: string;
  };
  colors: Array<{
    name: string;
    color: string;
  }>;
  sync_color_images: Array<{
    color_name: string;
    images: Array<string>;
    color_trend: boolean;
  }>;
  flash_deal_details: any;
  flash_deal_max_allowed_quantity: any;
  shipping_days: number;
  description: any;
  model: any;
  variation: Array<{
    type: string;
    price: number;
    offer_price: number;
    sku: string;
    qty: number;
  }>;
  choice_options: Array<{
    name: string;
    title: string;
    options: Array<{
      name: string;
      option: string;
    }>;
  }>;
  has_discount: boolean;
  has_tax: boolean;
  shipping_cost_multiply_with_quantity: boolean;
  shipping_cost: number;
  price: number;
  offer_price: number;
  tax: number;
  unit_price: number;
  seller_id: any;
  seller: {
    name: any;
    f_name: any;
    l_name: any;
    email: any;
    gender: any;
    birthdate: any;
    review: any;
    image: any;
  };
  shop: {
    image: string;
    name: string;
  };
  has_whole_sale: boolean;
  whole_sale_link: any;
  views_count: number;
  descriptors: Array<any>;
  is_country_restricted: boolean;
  is_active: boolean;
  collected_after_ordering: number;
  available_quantity: number;
};
export type COUNTRY_LIST_RESPONSE_TYPE = {
  countries: Array<{
    id: number;
    phonecode: number;
    iso: string;
    name: string;
    longitude: string;
    latitude: string;
  }>;
};
export type STARTTING_SETTING_RESPONSE_TYPE = {
  isSuccessful: boolean;
  hasContent: boolean;
  code: number;
  message: string;
  detailed_error: any;
  data: {
    "starting-setting": {
      currency_symbol: string;
      shipping_cost: number;
      shipping_duration_days: number;
      order_group_statuses: Array<{
        value: string;
        label: string;
      }>;
      order_statuses: Array<{
        value: string;
        label: string;
      }>;
      decimal_point_settings: number;
    };
    notificationTypes: Array<{
      id: number;
      name: string;
    }>;
  };
};
