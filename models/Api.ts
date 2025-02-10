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
      longitude: string;
      latitude: string;
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
export interface AddComment {
  comment: {
    id: number;
    customer: {
      id: number;
      name: string;
      image: string;
    };
    product_id: number;
    comment: string;
    created_at: string;
  };
}
export interface ProductViews {
  view_count: number;
  message: string;
}
export interface SharesCount {
  product_id: string;
  shared_count: number;
}
export interface LikesSharesCommentsApi {
  id: number;
  slug_en_topic: string;
  comments_count: number;
  comments: Array<any>;
  variation: Array<{
    variant_notify_for_user: boolean;
    type: string;
  }>;
  is_product_notify_for_user: boolean;
  is_liked: boolean;
  count_of_likes: number;
}
export interface IpDataApi {
  data: {
    status: string;
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    isp: string;
    org: string;
    as: string;
    query: string;
  };
}
export interface GetAddressByTextApi {
  status: string;
  results: Array<{
    country: string;
    province: string;
    city: string;
    town: string;
    street: string;
    building: string;
    coordinates: {
      lat: number;
      lon: number;
    };
  }>;
}
export interface GetMessageSearchApi {
  data: {
    messages_ids: Array<number>;
    offset: string;
  };
}
export interface UpdateCartApi {
  qty: number;
  status: number;
  id_cart: number;
  message: string;
}
export type GetAddressListApi = Array<{
  id: number;
  location: {
    latitude: string;
    longitude: string;
  };
  region_details: {
    country: string;
    province: string;
    city: string;
    town: string;
    street: string;
    building: string;
  };
  address: string;
  address_detail: string;
  contact_info: {
    name: string;
    phone: string;
    alternative_phone: string;
  };
}>;
export interface GetWalletApi {
  limit: number;
  offset: number;
  total_wallet_balance: number;
  total_wallet_balance_formatted: string;
  total_wallet_transaction: number;
  wallet_transaction_list: Array<{
    id: number;
    user_id: number;
    order_id: any;
    transaction_id: number;
    credit: number;
    debit: number;
    admin_bonus: number;
    balance: number;
    transaction_type: string;
    reference: string;
    payment_method_customer: any;
    returned_to_credit_cart: number;
    created_at: string;
    updated_at: string;
    deleted_at: any;
    return_request_id: any;
    destination_id: any;
    converted_wallet_transaction_id: any;
    status_payment: string;
    credit_formatted: string;
    debit_formatted: string;
    balance_formatted: string;
    destination_name: string;
  }>;
}
export interface PlaceOrderApi {
  url?: string;
}
export interface GetChatsApi {
  data: {
    data: {
      channels: Array<{
        id: string;
        channel_name: string;
        mobile_phone: string;
        photo_path: any;
        total_unread_message_count: number;
        created_at: string;
        is_mute: number;
        updated_at: string;
        channel_members: Array<{
          id: number;
          user_id: number;
          is_allowed_to_chat: any;
          is_admin: number;
          mute: number;
          archived: number;
          pin: number;
          user: {
            id: number;
            name: string;
            username?: string;
            mobile_phone: string;
            photo_path: any;
            created_at: string;
            access_token: any;
            contact_user?: {
              id: number;
              user_id: number;
              name: string;
              mobile_phone: string;
              contact_user_id: number;
            };
          };
          created_at: string;
        }>;
        messages: Array<{
          id: string;
          sender_user_id: number;
          sender_mobile_phone: any;
          receiver_user_id?: number;
          channel_id: string;
          message_description: any;
          extra_fields: any;
          parent_message_id: string;
          is_forward: number;
          call_status?: string;
          created_at: string;
          duration_in_seconds?: number;
          message_content: any;
          message_type: {
            name: string;
            event_name: string;
            created_at?: string;
          };
          deleted_by_user_id?: number;
          sender_user: {
            id: number;
            name: string;
            username?: string;
            mobile_phone: string;
            photo_path: any;
            created_at: string;
            access_token: any;
            contact_user?: {
              id: number;
              user_id: number;
              name: string;
              mobile_phone: string;
              contact_user_id: number;
            };
          };
          auth_message_status: {
            id: number;
            user_id: number;
            is_sent: any;
            is_received: number;
            is_watched: boolean;
            is_deleted: number;
            delete_for_all: boolean;
            message_deleted_at?: string;
            watched_at: string;
            received_at?: string;
            created_at: string;
          };
          channel: {
            id: string;
            channel_name: string;
            mobile_phone: string;
            photo_path: any;
            total_unread_message_count: any;
            created_at: string;
            is_mute: number;
            updated_at: string;
          };
          parent_message?: {
            id: string;
            sender_user_id: number;
            sender_mobile_phone: any;
            receiver_user_id: number;
            channel_id: string;
            message_description: any;
            extra_fields: any;
            parent_message_id: string;
            is_forward: number;
            call_status: any;
            created_at: string;
            duration_in_seconds: any;
            message_content: {
              message_id: number;
              content: string;
            };
            message_type: {
              name: string;
              event_name: string;
              created_at: any;
            };
            deleted_by_user_id: any;
            auth_message_status: {
              id: number;
              user_id: number;
              is_sent: any;
              is_received: number;
              is_watched: boolean;
              is_deleted: number;
              delete_for_all: boolean;
              message_deleted_at: any;
              watched_at: string;
              received_at: string;
              created_at: string;
            };
            parent_message: any;
            message_status: Array<{
              id: number;
              user_id: number;
              is_sent: any;
              is_received: number;
              is_watched: boolean;
              is_deleted: number;
              delete_for_all: boolean;
              message_deleted_at: any;
              watched_at?: string;
              received_at?: string;
              created_at: string;
            }>;
            message_files: Array<any>;
          };
          message_status: Array<{
            id: number;
            user_id: number;
            is_sent: any;
            is_received: number;
            is_watched: boolean;
            is_deleted: number;
            delete_for_all: boolean;
            message_deleted_at?: string;
            watched_at?: string;
            received_at?: string;
            created_at: string;
          }>;
          message_files: Array<{
            id: string;
            file_name: string;
            file_path: string;
            caption: any;
            created_at: string;
          }>;
        }>;
        channel_type: {
          id: number;
          is_default: number;
          slug: number;
          created_at: string;
        };
      }>;
      pinned_channels: Array<any>;
      missed_fcm_token: boolean;
    };
  };
}
export interface GetContactsApi {
  data: {
    data: Array<{
      id: number;
      user_id: number;
      name: string;
      mobile_phone: string;
      contact_user_id?: number;
      contact_user?: {
        id: number;
        mobile_phone: string;
        photo_path: any;
        created_at: string;
        updated_at: string;
        deleted_at: any;
        is_locked_by_admin_for_delete: number;
        is_locked_by_admin_for_update: number;
        name: string;
        username?: string;
        original_user_id?: number;
        is_locked_to_call: number;
        last_active_at?: string;
        its_record_in_my_contact: {
          id: number;
          user_id: number;
          name: string;
          mobile_phone: string;
          contact_user_id: number;
        };
      };
    }>;
  };
}

export interface LoginStoreisApi {
  data: {
    data: {
      id: number;
      mobile_phone: string;
      photo_path: any;
      name: string;
      username: any;
      original_user_id: any;
      email: any;
      access_token: string;
      media: Array<any>;
    };
  };
}
export interface UploadStoryApi {
  data: {
    data: {
      cut_video_name: any;
      storage_video_path: any;
      full_video_name: any;
      cut_video_path: any;
      full_video_path: any;
      user_id: number;
      photo_path: string;
      is_video: number;
      is_photo: number;
      product_id: any;
      id: number;
      file: any;
      is_seen: boolean;
      viewers_count: number;
      media: Array<any>;
    };
  };
}
export interface GetBoutiqueApi {
  data: {
    total: number;
    limit: number;
    offset: string;
    boutiques: Array<{
      id: number;
      name: string;
      slug: string;
      description: string;
      icon: {
        file_path: string;
        original_width: string;
        original_height: string;
      };
      banners: Array<{
        file_path: string;
        original_width: string;
        original_height: string;
      }>;
      mainCategoriesForProductIds: Array<{
        id: number;
        slug: string;
        name: string;
        most_viewed_product_name: string;
        most_viewed_product_thumbnail: {
          file_path: string;
          original_width: string;
          original_height: string;
        };
        num_available_product: number;
        flat_photo_path: {
          file_path: string;
          original_width: string;
          original_height: string;
        };
      }>;
      childCategoriesForProductIds: Array<any>;
    }>;
  };
}
export interface StarttingSettingApi {
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
        name?: string;
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
export interface CustomerInfoApi {
  customer_info: {
    id: number;
    name: string;
    phone: string;
    is_phone_verified: number;
    last_otp_id_token: string;
  };
}
export interface FireBaseSettingsApi {
  firebase_settings: string
}
export interface RegisterGuestApi {
  data: {
    token: string;
    expires_at: string;
    user: {
      id: number;
      name: string;
      phone: string;
      is_phone_verified: number;
      last_otp_id_token: any;
    };
  };
}
export interface GetProductApi {
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
      category: {
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
      };
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
        color_trend: boolean;
        color_name: string;
        images: Array<{
          file_path: string;
          original_width: string;
          original_height: string;
        }>;
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
        description: string;
        bio: any;
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
          file_path: string;
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
        childes: Array<{
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
      priceRanges: Array<{
        min_price: number;
        max_price: number;
        products_count: number;
      }>;
    };
    search_time: string;
    process_time: string;
  };
}
export interface GetStoriesApi {
  isSuccessful: boolean;
  hasContent: boolean;
  code: number;
  message: any;
  detailed_error: any;
  data: {
    current_page: number;
    data: Array<{
      id: number;
      mobile_phone: string;
      photo_path: any;
      name: string;
      username: any;
      original_user_id?: number;
      email: any;
      stories: Array<{
        id: number;
        cut_video_name: any;
        cut_video_path: any;
        full_video_name: any;
        full_video_path: any;
        storage_video_path: any;
        user_id: number;
        is_photo: number;
        is_video: number;
        photo_path: string;
        product_id: any;
        file: any;
        is_seen: boolean;
        viewers_count: number;
        media: Array<any>;
      }>;
      media: Array<any>;
    }>;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url?: string;
      label: string;
      active: boolean;
    }>;
    next_page_url: any;
    path: string;
    per_page: number;
    prev_page_url: any;
    to: number;
    total: number;
  };
}
