export interface SearchResponse {
  data: {
    offset: number | null;
    total_size: number;
    limit: number;
    products: Array<{
      id: number;
      featured?: string;
      name: string;
      slug: string;
      details: string;
      end_date?: string;
      thumbnail: {
        file_path: string;
        original_width: string;
        original_height: string;
      };
      images: Array<{
        file_path: string;
        original_width: string;
        original_height: string;
      }>;
      categories: Array<{
        id: number;
        slug: string;
        name: string;
        description?: string;
        bio: string;
        flat_photo_path: {
          file_path: string;
          original_width: string;
          original_height: string;
        };
        outline_photo_path: {
          file_path: string;
          original_width: string;
          original_height: string;
        };
        png_photo_path: {
          file_path?: string;
          original_width: string;
          original_height: string;
        };
        fill_photo_path: {
          file_path?: string;
          original_width: string;
          original_height: string;
        };
        banner_photo_path: {
          file_path?: string;
          original_width: string;
          original_height: string;
        };
        num_available_product: number;
        most_viewed_product_thumbnail: {
          file_path: string;
          original_width: string;
          original_height: string;
        };
      }>;
      category: any;
      brand?: {
        id: number;
        name: string;
        slug: string;
        icon:
          | {
              file_path: string;
              original_width: string;
              original_height: string;
            }
          | string;
      };
      colors: Array<{
        name: string;
        color: string;
      }>;
      sync_color_images?: Array<{
        color_name: string;
        images: Array<{
          file_path: string;
          original_width: string;
          original_height: string;
        }>;
        color_trend: boolean;
      }>;
      price: number;
      offer_price: number;
      is_active: boolean;
      boutique_id?: number;
    }>;
    brands: Array<{
      id: number;
      name: string;
      slug: string;
      icon: {
        file_path: string;
        original_width: string;
        original_height: string;
      };
    }>;
    attributes: Array<{
      id: number;
      name: string;
      options: Array<string>;
    }>;
    colors: Array<string>;
    categories: Array<{
      id: number;
      slug: string;
      name: string;
      description?: string;
      bio: string;
      icon: string;
      flat_photo_path: {
        file_path: string;
        original_width: string;
        original_height: string;
      };
      outline_photo_path: {
        file_path: string;
        original_width: string;
        original_height: string;
      };
      png_photo_path: {
        file_path?: string;
        original_width: string;
        original_height: string;
      };
      fill_photo_path: {
        file_path?: string;
        original_width: string;
        original_height: string;
      };
      banner_photo_path: {
        file_path?: string;
        original_width: string;
        original_height: string;
      };
      num_available_product: number;
      most_viewed_product_thumbnail: {
        file_path: string;
        original_width: string;
        original_height: string;
      };
      childes: Array<{
        id: number;
        slug: string;
        name: string;
        description?: string;
        bio: string;
        flat_photo_path: {
          file_path: string;
          original_width: string;
          original_height: string;
        };
        outline_photo_path: {
          file_path: string;
          original_width: string;
          original_height: string;
        };
        png_photo_path: {
          file_path?: string;
          original_width: string;
          original_height: string;
        };
        fill_photo_path: {
          file_path?: string;
          original_width: string;
          original_height: string;
        };
        banner_photo_path: {
          file_path: any;
          original_width: string;
          original_height: string;
        };
        num_available_product: number;
        most_viewed_product_thumbnail: {
          file_path: string;
          original_width: string;
          original_height: string;
        };
        parent_id: number;
        childes?: Array<{
          id: number;
          slug: string;
          name: string;
          description: string;
          bio: string;
          flat_photo_path: {
            file_path: string;
            original_width: string;
            original_height: string;
          };
          outline_photo_path: {
            file_path: string;
            original_width: string;
            original_height: string;
          };
          png_photo_path: {
            file_path: any;
            original_width: string;
            original_height: string;
          };
          fill_photo_path: {
            file_path: string;
            original_width: string;
            original_height: string;
          };
          banner_photo_path: {
            file_path: any;
            original_width: string;
            original_height: string;
          };
          num_available_product: number;
          most_viewed_product_thumbnail: {
            file_path: string;
            original_width: string;
            original_height: string;
          };
          parent_id: number;
        }>;
      }>;
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
    prices: {
      min_price: number;
      max_price: number;
      priceRanges?: Array<{
        min_price: number;
        max_price: number;
        products_count: number;
      }>;
    };
    search_time: string | null;
    search_text: string | null;
    process_time: string;
  };
}
