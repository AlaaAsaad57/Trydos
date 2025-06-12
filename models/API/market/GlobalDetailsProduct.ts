export interface GlobalDetailsProductApi {
    message: string;
  
    data: {
      message: string;
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
    };
  }