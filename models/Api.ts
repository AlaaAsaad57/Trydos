export interface CountriesApi {
  data: {
    countries: Array<{
      id: number;
      parent_id: number;
      position: number;
      iso: string;
      name: any;
      nicename: string;
      iso3: string;
      numcode?: number;
      phonecode: number;
      flat_photo_path: any;
      outline_photo_path: any;
      flag_photo_path: any;
      map_photo_path: any;
      status: number;
      isAccess: number;
      otp_by_whatsapp: number;
      otp_by_sms: number;
      created_at: any;
      updated_at: string;
    }>;
  };
}
export interface HomeBoutiqueApi {
  data: {
    total: number;
    limit: number;
    offset: number;
    boutiques: Array<{
      id: number;
      name: string;
      icon: string;
      slug: string;
      position: number;
      description: string;
      banners: Array<{
        file_path: string;
      }>;
      mainCategoriesForProductIds: Array<{
        id: number;
        slug: string;
        name: string;
        flat_photo_path: string;
      }>;
      childCategoriesForProductIds: Array<{
        id: number;
        slug: string;
        name: string;
        most_viewed_product_name: string;
        most_viewed_product_thumbnail: string;
        num_available_product: number;
      }>;
    }>;
  };
}
export interface CurrencyApi {
  data: {
    currency: {
      id: number;
      name: any;
      symbol: string;
      code: string;
      exchange_rate: number;
    };
  };
}
export interface starttingSettingApi {
  data: {
    "starting-setting": {
      square_curved_logo_url: string;
      square_logo_url: string;
      rectangular_curved_logo_url: string;
      show_payment_using_cards: boolean;
      show_payment_using_post_pay: boolean;
      show_Cash_payment: boolean;
      show_flash_deal: boolean;
      android_min_version: number;
      ios_min_version: number;
      closed_hour: number;
      message_time_end_work: string;
      description_on_page_product_details: string;
      collection_grid: boolean;
      show_notifications: boolean;
      show_feedBack: boolean;
      show_contact_with_whatsapp: boolean;
      default_country_dial_code: string;
      enable_crashylitcs: boolean;
      enable_Firebase_Messaging: boolean;
      return_money_with_card: boolean;
      return_money_with_wallet: boolean;
      order_status_can_canceled: Array<string>;
      order_status_can_canceled_item: Array<string>;
      verification_with_whatsapp_enable: boolean;
      verification_with_sms_enable: boolean;
      is_system_support_email: boolean;
      show_subCategory_title: boolean;
      enable_invite_banner: boolean;
      countries: Array<{
        id: number;
        parent_id: number;
        position: number;
        iso: string;
        name: any;
        nicename: string;
        iso3: string;
        numcode?: number;
        phonecode: number;
        flat_photo_path: any;
        outline_photo_path: any;
        flag_photo_path: any;
        map_photo_path: any;
        status: number;
        isAccess: number;
        otp_by_whatsapp: number;
        otp_by_sms: number;
        created_at: any;
        updated_at: string;
      }>;
      default_country: {
        id: number;
        parent_id: number;
        position: number;
        iso: string;
        name: string;
        nicename: string;
        iso3: string;
        numcode: number;
        phonecode: number;
        flat_photo_path: any;
        outline_photo_path: any;
        flag_photo_path: any;
        map_photo_path: any;
        status: number;
        isAccess: number;
        otp_by_whatsapp: number;
        otp_by_sms: number;
        created_at: any;
        updated_at: string;
      };
      address_type: Array<string>;
      system_default_currency: number;
      can_invite_friends: boolean;
      show_button_whatsapp_cash_on_delivery: boolean;
      smart_look: boolean;
      "whatsApp-phone": number;
      phone: number;
      "message-contact-us": string;
      Default_whatsapp_message: string;
      currency_symbol: string;
      decimal_point_settings: number;
      languages: Array<{
        code: string;
        name: string;
      }>;
    };
    notificationTypes: Array<{
      id: number;
      name: string;
      title: string;
      body: string;
      entity_type: number;
      entity_type_name: string;
    }>;
  };
}
export interface CustomerInfo {
  data: {
    id: number;
    name: string;
    f_name: string;
    l_name: string;
    email: string;
    phone: string;
    country_dial_code: string;
    gender: string;
    birthdate: string;
    is_email_verified: number;
    is_phone_verified: number;
    temporary_token: string;
    points: any;
    image: string;
  };
}
export interface CategoriesApi {
  data: {
    mainCategories: Array<{
      id: number;
      slug: string;
      name: string;
      description?: string;
      bio: string;
      flat_photo_path: string;
      outline_photo_path: string;
      png_photo_path?: string;
      fill_photo_path: string;
      banner_photo_path?: string;
      num_available_product: number;
      most_viewed_product_thumbnail: string;
    }>;
  };
}
export interface FilterProductApi {
  data: {
    offset: string;
    total_size: number;
    limit: number;
    products: Array<{
      id: number;
      name: string;
      slug: string;
      details: string;
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
        icon: {
          file_path: string;
          original_width: string;
          original_height: string;
        };
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
      in_stock: boolean;
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
    search_time: string;
    process_time: string;
  };
}
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
export interface QuantityDetailsProductApi {
  message: string;
  data: {
    id: number;
    description: any;
    model: any;
    in_stock: boolean;
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
    price: number;
    offer_price: number;
    tax: number;
    unit_price: number;
    current_stock: number;
    Left_stock: number;
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
  };
}
export interface SimpleDetailsProductApi {
  message: string;
  data: {
    name: string;
    description: any;
    details: string;
    photo: {
      file_path: string;
    };
  };
}
export interface SimpleBoutiqeApi {
  message: string;
  data: {
    id: number;
    icon: string;
    name: string;
    description: string;
    banners: Array<{
      file_path: string;
    }>;
  };
}
export interface CartApi {
  message: string;
  data: {
    sub_total: number;
    total_tax: number;
    total_discount_on_product: number;
    total_shipping_cost: number;
    coupon_discount: number;
    cod_cost: number;
    limitFree: number;
    estimated_tax: number;
    total: number;
    rest_for_free_shipping: number;
    total_cash: number;
    has_cod: boolean;
    show_message_reset_for_shipping_free: boolean;
    available_payment_method: Array<string>;
    cart: Array<{
      id: number;
      customer_id: number;
      cart_group_id: string;
      product_id: number;
      choices: Array<{
        choice_1: string;
      }>;
      variations: Array<{
        color: string;
        Size: string;
      }>;
      variant: string;
      available_quantity: number;
      max_allowed_qty: string;
      vendor_name: string;
      quantity: number;
      discount: number;
      price: number;
      offer_price: number;
      tax: number;
      slug: string;
      name: string;
      count_of_pieces: number;
      shop: {
        image: string;
        name: string;
      };
      brand: {
        id: number;
        name: string;
        slug: string;
        image: string;
      };
      boutique: {
        id: number;
        icon: {
          file_path: string;
          original_width: string;
          original_height: string;
        };
      };
      thumbnail: string;
      image: string;
      created_at: string;
      flash_deal_details: any;
      flash_deal_max_allowed_quantity: any;
      shipping_days: number;
      have_hurry_up_notify_time_left: boolean;
      have_hurry_up_notify_qty: boolean;
      qty_left: number;
      time_left_in_minutes: number;
    }>;
  };
}
export interface OldCartApi {
  message: string;
  data: {
    headers: {};
    original: {
      message: string;
      data: {
        sub_total: number;
        total_tax: number;
        total_discount_on_product: number;
        total_shipping_cost: number;
        coupon_discount: number;
        cod_cost: number;
        limitFree: number;
        estimated_tax: number;
        total: number;
        rest_for_free_shipping: number;
        total_cash: number;
        has_cod: boolean;
        show_message_reset_for_shipping_free: boolean;
        available_payment_method: Array<any>;
        oldCart: Array<{
          id: number;
          customer_id: number;
          cart_group_id: string;
          product_id: number;
          choices: Array<{
            choice_1: string;
          }>;
          variations: Array<{
            color: string;
            Size: string;
          }>;
          variant: string;
          available_quantity: number;
          max_allowed_qty: string;
          vendor_name: string;
          quantity: string;
          discount: number;
          price_of_variant: number;
          tax: number;
          slug: string;
          name: string;
          count_of_pieces: number;
          shop: {
            image: string;
            name: string;
          };
          brand: {
            id: number;
            name: string;
            slug: string;
            image: string;
          };
          boutique: {
            id: number;
            icon: {
              file_path: string;
              original_width: string;
              original_height: string;
            };
          };
          thumbnail: string;
          image: string;
          created_at: string;
          flash_deal_details: any;
          flash_deal_max_allowed_quantity: any;
          shipping_days: number;
        }>;
      };
    };
    exception: any;
  };
}
