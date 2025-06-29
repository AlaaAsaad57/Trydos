// /web/product/qtyPriceDetails
export interface QuantityDetailsProductApi {
  message: string;
  data: {
    id: number;
    description: any;
    model: any;
    is_active: boolean;
    variation: Array<{
      type: string;
      price: number;
      offer_price: number;
      sku: string;
      qty: number;
    }>;
    is_country_restricted: boolean;

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
    available_quantity: number;
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
