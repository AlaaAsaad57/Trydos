declare global {
  interface StateInterface {
    homepage: {
      language: string;
      loading: boolean;
      showMessage: boolean;
      loadingStories: boolean;
      selectedStory: any;
      renderStories: boolean;
      storiesData: Array<{
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
      categories: Array<any>;
      settings: {
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
      loginOpen: boolean;
      boutiques: Array<any>;
      session_id: string;
      previous_event_button_name: string;
      activeRoute: string;
      currency: {
        id: number;
        name: string;
        symbol: string;
        code: string;
        exchange_rate: number;
      };
    };
    auth: {
      user: {
        id: number;
        already_exists?: boolean;
        idToken: string;
        name: string;
        avatar: {
          src: string;
          height: number;
          width: number;
          blurDataURL: string;
          blurWidth: number;
          blurHeight: number;
        };
      };
      Tempuser: {
        id: number;
        idToken: string;
        already_exists?: boolean;
        name: string;
        avatar: {
          src: string;
          height: number;
          width: number;
          blurDataURL: string;
          blurWidth: number;
          blurHeight: number;
        };
      };
      failedLogin: boolean;
      attempts: number;
      wrongNumber: string;
      loading: boolean;
      verficationID: any;
    };
    chat: {
      chatVar: boolean;
      data: Array<{
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
      MessageActiveCall: any;
      activeChat: any;
      main: string;
      loading: boolean;
      refs: boolean;
      contacts: Array<{
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
      channels: Array<any>;
      users: Array<any>;
      qouted: any;
      NotificationPremission: boolean;
      pusher_channels: Array<any>;
      search: {
        searchValue: string;
        loading: boolean;
        activeMessage: any;
        messages: Array<any>;
        offset: string;
      };
      user_loading: boolean;
      fbToken: string;
      newChats: Array<any>;
      openChat: any;
      pinnedChats: Array<any>;
      date: string;
      call_loading: boolean;
      chatUsers: Array<number>;
      call: any;
      fetch: boolean;
      first: boolean;
      mid: any;
      ref: boolean;
      isCallIncoming: boolean;
      incomeCallData: any;
      incomeCallType: any;
      caller: Array<any>;
      callerChannel: any;
      callInProgress: boolean;
      isReachTheFinalMes: boolean;
      replyMessage: any;
      forwarded_message: any;
      Server_time: string;
      calls: Array<{
        id: string;
        sender_user_id: number;
        sender_mobile_phone: any;
        receiver_user_id: any;
        channel_id: string;
        message_description: any;
        extra_fields: any;
        parent_message_id: string;
        is_forward: number;
        call_status?: string;
        created_at: string;
        duration_in_seconds?: number;
        message_content?: string;
        message_type: {
          name: string;
          event_name: string;
          created_at: string;
        };
        deleted_by_user_id: any;
        sender_user: {
          id: number;
          name: string;
          username?: string;
          mobile_phone: string;
          photo_path: any;
          created_at: string;
          access_token: any;
          contact_user: {
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
        parent_message: any;
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
        message_files: Array<any>;
      }>;
      searchResults: Array<any>;
      lastNotification: string;
      callLoading: any;
      AgoraToken: any;
      client: any;
      nameModal: boolean;
    };
    listing: {
      products: Array<any>;
      loading: boolean;
      isReachEnd: boolean;
      offset: any;
      filterEnabled: boolean;
      skeleton: boolean;
      showedFilter: string;
    };
    Search: {
      value: string;
      searchWords: Array<any>;
      totalProducts: any;
      searchResults: {
        products: Array<any>;
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
      };
      enable: boolean;
      searchFilters: {
        categories: Array<any>;
        brands: Array<any>;
        boutiques: Array<any>;
      };
      loading: boolean;
      partialLoading: boolean;
    };
    details: {
      activeCameraGallery: boolean;
      shareLoading: boolean;
      totalProducts: any;
      InfoMessage: {
        showInfoMessage: boolean;
        title: string;
        icon: string;
        text: string;
        value: Array<any>;
      };
      PriceFiltered: boolean;
      variants: Array<any>;
      filters: {
        categories: Array<any>;
        brands: Array<any>;
        prices: {
          min_price?: number;
          max_price?: number;
          priceRanges?: [
            {
              min_price?: number;
              max_price?: number;
              products_count?: number;
            }
          ];
        };
        sizes: Array<any>;
        offers: Array<any>;
        sizesAttr: {
          id?: string;
          name?: string;
        };
        colors: Array<any>;
      };
      selectedFilter: {
        categories: Array<any>;
        filtered: boolean;
        prices: {
          min: number;
          max: number;
          pricesWord?: string;
        };
        brands: Array<any>;
        offers: Array<any>;
        sizes: Array<any>;
        searchText: string;
        colors: Array<any>;
        pricesSelected: Array<any>;
      };
      filterLoading: boolean;
      activeFilters: {
        categories: Array<any>;
        brands: Array<any>;
        prices: any;
        offers: Array<any>;
        sizes: Array<any>;
        searchText: string;
        colors: Array<any>;
      };
      activeFiltersShouldUpdate: boolean;
      search: boolean;
      isChangedFilter: boolean;
      product: {
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
          color_trend: boolean;
          color_name: string;
          images: Array<string>;
        }>;
        flash_deal_details: any;
        flash_deal_max_allowed_quantity: any;
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
        colorFrom: string;
        activeColor: {
          color_trend: boolean;
          color_name: string;
          images: Array<string>;
        };
      };
      loading: boolean;
      sharesCount: number;
    };
    cart: {
      orderLoading: boolean;
      cart: Array<any>;
      center: any;
      enable: boolean;
      orderData: {
        agree: boolean;
        payment: string;
        coupon: boolean;
        coupon_number: string;
        loading: boolean;
        success: boolean;
      };
      addressLists: Array<{
        id: number;
        location: { latitude: any; longitude: any };
        Country: { name: string; code: string };
        address_detail: string;
        address: string;
        contact_info: {
          contact_person_name: string;
          phone: string;
          alternative_phone: string;
        };
        region: string;
        region_details: {
          city: string;
          province: string;
          town: string;
          street: string;
          building: string;
        };
      }>;
      addressDetails: {
        id?: number;
        location: { latitude: any; longitude: any };
        Country: { name: string; code: string };
        address_detail: string;
        address: string;
        contact_info: {
          contact_person_name: string;
          phone: string;
          alternative_phone: string;
        };
        region: string;
        region_details: {
          city: string;
          province: string;
          town: string;
          street: string;
          building: string;
        };
      };
      AddToCartOption: {
        enable: boolean;
        selectedSize: any;
        selectedColor: {
          color_name?: string;
          images?: string[];
        };
        quantity: number;
        price: any;
        UID: string;
        selectedOptions: Array<any>;
      };
      SelectedProduct: {
        id: number;
        name: string;
        slug: string;
        slug_en_topic?: string;
        share_link: string;
        details: string;
        thumbnail: string;
        images:
          | Array<string>
          | Array<{
              file_path?: string;
            }>;
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
          color_trend: boolean;
          color_name: string;
          images: Array<string>;
        }>;
        flash_deal_details: any;
        flash_deal_max_allowed_quantity: any;
        description: any;
        model: any;
        in_stock: boolean;
        variation: Array<{
          variant_notify_for_user: boolean;
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
        slug_en_topic: string;
        is_product_notify_for_user: boolean;
        likes: number;
        is_liked: number;
      };
      variants: Array<{
        variant_notify_for_user: boolean;
        type: string;
        price: number;
        offer_price: number;
        sku: string;
        qty: number;
      }>;
      loading: boolean;
      localCart: Array<{
        id: number;
        item_id: number;
        color: string;
        image: string;
        quantity: number;
        size: string;
        sku: string;
        UID: string;
      }>;
      loaded: boolean;
      oldCart: {
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
          offer_price: number;
          price: number;
        }>;
      };
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
    };
  }
}
export default global;
