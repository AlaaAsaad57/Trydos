describe("9-1 add product to cart", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.wait(3000);
    cy.logout();
    cy.viewport(783, 824);
  });
  it("should go to first boutique", () => {
    cy.get('[data-cy="boutique_link"]').first().click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should add product to cart", () => {
    cy.AddProductToCartFromBoutiquePage();
  });
});
describe("9-2 should complete order with one payment method", () => {
  it("should go to cart page", () => {
    cy.intercept("GET", "**/api/v1/cart/cart_shipping", (req) => {
      req.continue((res) => {
        res.body = {
          ...res.body,
          data: {
            ...res.body.data,
            available_payment_methods: ["cash_on_delivery", "trydos_wallet"],
          },
        };
      });
    }).as("cart");
    cy.get('[data-cy="Back-Icon-AddToCart"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.get('[data-cy="cart_icon_button"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.wait("@cart");
  });
  it("should go to Payment and Address Page", () => {
    cy.get('[data-cy="Confirm-Order-Button"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should verify phone number", () => {
    cy.intercept("GET", "/api/v1/auth/phone/verify_otp_from_guest?**").as(
      "verifyOtpSignin"
    );
    cy.Exist("#phoneInput").then((exist) => {
      if (exist) {
        cy.enterPhoneNumber("963937764641");
      }
    });
    cy.wait(5000);
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
    cy.CheckIfTrySendOtp();
    cy.typePincode("999999");

    cy.wait("@verifyOtpSignin").then((interception) => {
      expect(interception.response.statusCode).to.be.eq(200);
    });
  });
  it("should add or select address", () => {
    cy.intercept("GET", "**/customer/address/list").as("getAddresses");
    cy.wait("@getAddresses").then((interception) => {
      expect(interception.response.statusCode).to.be.eq(200);
    });
    cy.Exist('[data-cy="AddAddres"]').then((exist) => {
      if (exist) {
        cy.get('[data-cy="AddAddres"]').click({
          force: true,
          scrollBehavior: false,
        });
      } else {
        cy.get('[data-cy="addresses-viewer"]').click({
          force: true,
          scrollBehavior: false,
        });
        cy.get('[data-cy="Add-Shipping-Address"]').click({
          force: true,
          scrollBehavior: false,
        });
      }
    });
    cy.get('[data-cy="Change-From-List"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.intercept("POST", "/api/addresses/get-address-by-text", (req) => {
      req.continue((res) => {
        res.body = {
          results: [
            {
              country: "syria",
              province: "Aleppo",
              city: "City center",
              town: "City center",
              street: null,
              building: "باب قنسرين",
              is_deliverable: 0,
              coordinates: [
                {
                  lat: 36.19465302718864,
                  lon: 37.15113296751566,
                },
                {
                  lat: 36.194588089640256,
                  lon: 37.15209856276102,
                },
                {
                  lat: 36.19445821438189,
                  lon: 37.153670337243746,
                },
                {
                  lat: 36.19429803459992,
                  lon: 37.155419137521456,
                },
              ],
            },
          ],
        };
      });
    }).as("getAddressByText");
    cy.get('[data-cy="SearchProvince-District-Town-Street"]').type(
      "Test Address",
      {
        force: true,
        scrollBehavior: false,
      }
    );
    cy.wait("@getAddressByText");
    cy.get('[data-cy="Firstly-Search-Result"]').click({
      scrollBehavior: false,
    });
    cy.get('[data-cy="Detailed-Address-Note"] textarea').type(
      "Details Address Info",
      { scrollBehavior: false, force: true }
    );
    cy.get('[data-cy="add-address-input"]').type("Address Title Info", {
      scrollBehavior: false,
      force: true,
    });
    cy.get('[data-cy="recipient-name-input"]').type("Recipient Name Info", {
      scrollBehavior: false,
      force: true,
    });
    cy.get('[data-cy="Contact-Phone-input"]').type("963999999999", {
      scrollBehavior: false,
      force: true,
    });
    cy.intercept("GET", "**api/v1/cart/cart_overview", (req) => {
      req.continue((res) => {
        res.body = {
          ...res.body,
          data: {
            ...res.body.data,
            available_payment_methods: ["cash_on_delivery", "trydos_wallet"],
          },
        };
      });
    }).as("CartOreview");
    cy.intercept("GET", "**/api/v1/customer/address/list").as("AddressList");
    cy.intercept("POST", "**/address/add").as("AddAddressReq");
    cy.get('[data-cy="AddSaveButton"]').click({
      scrollBehavior: false,
      force: true,
    });
    cy.wait(["@AddAddressReq", "@AddressList", "@CartOreview"]);
  });
  it("should select payment method cash on delivery", () => {
    cy.wait(3000);
    cy.get('[data-cy="Cash-on-delivery"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.intercept("GET", "**/api/v1/cart/cart_shipping", (req) => {
      req.continue((res) => {
        res.body = {
          ...res.body,
          data: {
            ...res.body.data,
            available_payment_methods: ["cash_on_delivery", "trydos_wallet"],
          },
        };
      });
    }).as("cart");
    cy.get('[data-cy="Confirm-shipping-and-payment"]').click({
      force: true,
      scrollBehavior: false,
    });

    cy.wait("@cart");
  });
  it("should verify order details", () => {
    cy.intercept("GET", "**/api/v1/cart/cart_shipping", (req) => {
      req.continue((res) => {
        res.body = {
          ...res.body,
          data: {
            ...res.body.data,
            available_payment_methods: ["cash_on_delivery", "trydos_wallet"],
          },
        };
      });
    }).as("cart");
    cy.get('[data-cy="read-and-agree"]').click({
      force: true,
      scrollBehavior: false,
    });
  });
  it("should click on continue and should show order temp order details if not success", () => {
    cy.intercept("GET", "**/api/v1/cart/cart_shipping", (req) => {
      req.continue((res) => {
        res.body = {
          ...res.body,
          data: {
            ...res.body.data,
            available_payment_methods: ["cash_on_delivery", "trydos_wallet"],
          },
        };
      });
    }).as("cart");
    cy.intercept("POST", "**/customer/order/checkout/**", (req) => {
      req.continue((res) => {
        res.statusCode = 200;
        res.body.isSuccessful = true;

        res.body = {
          ...res.body,
          data:
            res.body.data?.length > 0
              ? res.body.data
              : [
                  {
                    id: 84,
                    customer_id: 5,
                    payment_status: "paid",
                    order_status: {
                      value: "pending",
                      label: "Pending",
                    },
                    order_group_status: {
                      value: "pending",
                      label: "Pending",
                    },
                    payment_method: {
                      value: "trydos_wallet",
                      label: "Trydos Wallet",
                    },
                    transaction_ref: "5-lvNoE-1747740476_5-RPcJM-1748072395",
                    order_amount: 109.6,
                    partial_payment_by_wallet: 0,
                    discount_amount: 0,
                    shipping_cost: 100,
                    shipping_address: 6,
                    shipping_address_data: {
                      id: 6,
                      country_iso: "SY",
                      customer_id: 5,
                      contact_person_name: "صالح",
                      address_type: "home",
                      address: "منزل",
                      address_detail: "حي 3000 بناء 5 ط1",
                      country: "Syria (‫سوريا‬‎)",
                      province: "حلب",
                      city: "مركز المدينة",
                      town: "الكلاسة",
                      street: "null",
                      building: "مركز شرطة الكلاسة",
                      zip: "123123",
                      phone: "963994277533",
                      alternative_phone: "96355555555",
                      created_at: "2025-05-13T11:40:15.000000Z",
                      updated_at: "2025-05-24T07:44:08.000000Z",
                      latitude: "36.18003533604535",
                      longitude: "37.10609429870473",
                      is_billing: 0,
                      is_default: 1,
                      email: null,
                      cost: 100,
                      duration: null,
                    },
                    billing_address: null,
                    billing_address_data: null,
                    discount_type: null,
                    coupon_code: null,
                    shipping_method_id: 9,
                    order_group_id: "SH2466QIUYRWTAWU",
                    verification_code: "999306",
                    order_note: "order note",
                    seller_id: "Trydos",
                    created_at: "2025-05-24 22:25:50",
                    order_can_return: false,
                    order_has_return_request: false,
                    return_request_id: null,
                    show_return_request: false,
                    edit_return_request: false,
                    order_can_exchange: false,
                    details: [
                      {
                        id: 296,
                        order_id: 84,
                        product_id: 2,
                        product_details: {
                          id: 2,
                          name: "Short-Sleeve Woven Blouse",
                          slug: "short-sleeve-woven-blouse-2",
                          share_link:
                            "https://market-under-dev-backend.trydos.dev/product/short-sleeve-woven-blouse-2",
                          details:
                            "<p>Amazon Essentials Women&#39;s Relaxed-Fit Short-Sleeve Woven Blouse</p>",
                          count_of_pieces: 1,
                          thumbnail:
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/thumbnail/",
                          images: [
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-11-682071cde3e92.png",
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-11-682071d192306.png",
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-11-682071d56b048.png",
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-11-682071d906804.png",
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-11-682071dca4694.png",
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-11-682071e065903.png",
                          ],
                          price: 7,
                          offer_price: 4.60000000000002,
                          is_favourite: true,
                          rating: {
                            overall_rating: 0,
                            total_rating: 0,
                          },
                        },
                        product_slug: "short-sleeve-woven-blouse-4",
                        qty: 1,
                        price: 7,
                        discount: 2.4,
                        price_after_discount: 4.6,
                        image:
                          "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-11-682071e065903.png",
                        tax: 0,
                        delivery_status: "pending",
                        payment_status: "unpaid",
                        shipping_method_id: null,
                        variant: "White-S",
                        collect_product_after_ordering: false,
                        variation: {
                          color: "White",
                          Size: "S",
                        },
                        discount_type: "discount_on_product",
                        is_stock_decreased: 1,
                        refund_request: 0,
                        refund_request_status: null,
                        is_odoo_product: 0,
                        odoo_id: 0,
                        odoo_order_id: 0,
                      },
                      {
                        id: 297,
                        order_id: 84,
                        product_id: 11,
                        product_details: {
                          id: 11,
                          name: "Women's Button Down Shirts",
                          slug: "womens-button-down-shirts-11",
                          share_link:
                            "https://market-under-dev-backend.trydos.dev/product/womens-button-down-shirts-11",
                          details:
                            "<p style=\"font-family: 'Quicksand', sans-serif; font-size: 13px; line-height: 1.3;\">\r\n    Women's Button Down Shirts Long Sleeve Basic Classic Soft Shirt Collared Fashion Dressy Casual Blouses  \r\n</p>",
                          count_of_pieces: 1,
                          thumbnail:
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/thumbnail/2025-05-12-6821ca8a5f2f5.png",
                          images: [
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-12-6821ca777ace0.png",
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-12-6821ca7b42290.png",
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-12-6821ca7f0e6c7.png",
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-12-6821ca83035d2.png",
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-12-6821ca86b6e05.png",
                          ],
                          price: 10,
                          offer_price: 5,
                          is_favourite: false,
                          rating: {
                            overall_rating: 0,
                            total_rating: 0,
                          },
                        },
                        product_slug: "womens-button-down-shirts-31",
                        qty: 1,
                        price: 10,
                        discount: 5,
                        price_after_discount: 5,
                        image:
                          "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-12-6821ca777ace0.png",
                        tax: 0,
                        delivery_status: "pending",
                        payment_status: "unpaid",
                        shipping_method_id: null,
                        variant: "CadetBlue-XL",
                        collect_product_after_ordering: false,
                        variation: {
                          color: "CadetBlue",
                          Size: "XL",
                        },
                        discount_type: "discount_on_product",
                        is_stock_decreased: 1,
                        refund_request: 0,
                        refund_request_status: null,
                        is_odoo_product: 0,
                        odoo_id: 0,
                        odoo_order_id: 0,
                      },
                    ],
                    checked_at: null,
                  },
                  {
                    id: 85,
                    customer_id: 5,
                    payment_status: "paid",
                    order_status: {
                      value: "pending",
                      label: "Pending",
                    },
                    order_group_status: {
                      value: "pending",
                      label: "Pending",
                    },
                    payment_method: {
                      value: "trydos_wallet",
                      label: "Trydos Wallet",
                    },
                    transaction_ref: "5-lvNoE-1747740476_5-RPcJM-1748072395",
                    order_amount: 0.013750954927426,
                    partial_payment_by_wallet: 0,
                    discount_amount: 0,
                    shipping_cost: 0,
                    shipping_address: 6,
                    shipping_address_data: {
                      id: 6,
                      country_iso: "SY",
                      customer_id: 5,
                      contact_person_name: "صالح",
                      address_type: "home",
                      address: "منزل",
                      address_detail: "حي 3000 بناء 5 ط1",
                      country: "Syria (‫سوريا‬‎)",
                      province: "حلب",
                      city: "مركز المدينة",
                      town: "الكلاسة",
                      street: "null",
                      building: "مركز شرطة الكلاسة",
                      zip: "123123",
                      phone: "963994277533",
                      alternative_phone: "96355555555",
                      created_at: "2025-05-13T11:40:15.000000Z",
                      updated_at: "2025-05-24T07:44:08.000000Z",
                      latitude: "36.18003533604535",
                      longitude: "37.10609429870473",
                      is_billing: 0,
                      is_default: 1,
                      email: null,
                      cost: 100,
                      duration: null,
                    },
                    billing_address: null,
                    billing_address_data: null,
                    discount_type: null,
                    coupon_code: null,
                    shipping_method_id: 9,
                    order_group_id: "SH2466QIUYRWTAWU",
                    verification_code: "618250",
                    order_note: "order note",
                    seller_id: "Bilal Shop",
                    created_at: "2025-05-24 22:25:55",
                    order_can_return: false,
                    order_has_return_request: false,
                    return_request_id: null,
                    show_return_request: false,
                    edit_return_request: false,
                    order_can_exchange: false,
                    details: [
                      {
                        id: 298,
                        order_id: 85,
                        product_id: 8,
                        product_details: {
                          id: 8,
                          name: "Men's Tank Top",
                          slug: "mens-tank-top-8",
                          share_link:
                            "https://market-under-dev-backend.trydos.dev/product/mens-tank-top-8",
                          details:
                            "<p><!--StartFragment -->Men&#39;s Tank Top<!--EndFragment --></p>",
                          count_of_pieces: 1,
                          thumbnail:
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/thumbnail/",
                          images: [
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-12-6821c3048bf29.png",
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-12-6821c308ed3fe.png",
                            "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-12-6821c30d31b3f.png",
                          ],
                          price: 0.0076394194041253,
                          offer_price: 0.00687547746371277,
                          is_favourite: false,
                          rating: {
                            overall_rating: 0,
                            total_rating: 0,
                          },
                        },
                        product_slug: "mens-tank-top-22",
                        qty: 2,
                        price: 0.0152788388082506,
                        discount: 0.0015278838808251,
                        price_after_discount: 0.0137509549274255,
                        image:
                          "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2025-05-12-6821c3048bf29.png",
                        tax: 0,
                        delivery_status: "pending",
                        payment_status: "unpaid",
                        shipping_method_id: null,
                        variant: "Gray-XL",
                        collect_product_after_ordering: false,
                        variation: {
                          color: "Gray",
                          Size: "XL",
                        },
                        discount_type: "discount_on_product",
                        is_stock_decreased: 1,
                        refund_request: 0,
                        refund_request_status: null,
                        is_odoo_product: 0,
                        odoo_id: 0,
                        odoo_order_id: 0,
                      },
                    ],
                    checked_at: null,
                  },
                ],
        };
      });
    }).as("placeOrder");
    cy.get('[data-cy="Place-Order-Buttons"]').click({
      force: true,
      scrollBehavior: false,
    });
    cy.wait("@cart");
    cy.wait("@placeOrder");
  });
});
