import { OldCartItem } from "models/Genaral/OldCartItem";

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
          oldCart: Array<OldCartItem>;
        };
      };
      exception: any;
    };
  }