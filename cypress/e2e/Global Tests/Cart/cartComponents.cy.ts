describe("Should open trydos then open cart page", () => {
  before("open trydos", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  // end- open trydos
  it("open cart page", () => {
    cy.clickElement("[data-cy=cartIcon_mainPage]");
    cy.interceptAndWait([
      {
        method: "GET",
        url: "**/api/v1/cart/cart_shipping",
        alias: "getCartShipping",
      },
      {
        method: "GET",
        url: "**/api/v1/old-cart/get_old_cart",
        alias: "getOldCart",
      },
    ]);
    cy.log("✅✅ getCartShipping & getOldCart Requests Arrived");
  });
  // open cart page
});
// end- Should open trydos then open cart page
describe("Should Verify components and check if products purchased later are out of the bag", () => {
  it("Verify components", () => {
    cy.get("[data-cy=cartPage-container]").should("exist").and("be.visible");
    cy.get("[data-cy=cartPage-header-container]")
      .should("exist")
      .and("be.visible");
    cy.get("[data-cy=cartPage-headerComponents-container]")
      .should("exist")
      .and("be.visible");
    cy.get("[data-cy=CartBackIcon]").should("exist").and("be.visible");
    cy.get("[data-cy=cartPage-textContainer-onHeader]")
      .should("exist")
      .and("be.visible"); //svg-textContainer
    cy.get("[data-cy=svg-textContainer]").should("exist").and("be.visible"); //svg-textContainer
    cy.get("[data-cy=textContainer-textOnHeader]")
      .should("exist")
      .and("be.visible")
      .contains("Shopping Bag");
    cy.get("[data-cy=shareIcon-onHeader]").should("exist").and("be.visible");
    cy.get("[data-cy=container-ofProducts]").should("exist").and("be.visible");
    cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    cy.log("✅✅ All components founded");
  });
  // end- Verify components
  it("Check if cart is empty or products are out of the bag", () => {
    cy.document().then((doc) => {
      const emptyCart = doc.querySelector('[data-cy="EmptyCRart"]');
      const oldCartOutOfBag = doc.querySelector('[data-cy="oldCart-outOfBag"]');
      if (emptyCart && oldCartOutOfBag) {
        cy.log("✅✅ emptyCart and oldCartOutOfBag elements exist");
        // Do your assertions or logic here
        cy.log("✅✅ There are products that are out of the bag");
        cy.get("[data-cy=line]").should("exist").and("be.visible");
        cy.get("[data-cy=oldCart-viewer]").should("exist").and("be.visible");
        cy.get("[data-cy=spanContainer-oldCartIcon]")
          .should("exist")
          .and("be.visible");
        cy.get("[data-cy=spanContainer-oldCartIcon] svg")
          .should("exist")
          .and("be.visible");
        cy.get("[data-cy=outOfBag-text]")
          .should("exist")
          .and("be.visible")
          .contains("Out Of Bag!");
        cy.get("[data-cy=hideAll]")
          .should("exist")
          .and("be.visible")
          .contains("Hide All");
        cy.get("[data-cy=Product_Non_Available_In_Cart]").should("exist");
        cy.get("[data-cy=oldProduct-card]").should("exist").and("be.visible");
        cy.get("[data-cy=goTo-addAgain]").should("exist").and("be.visible");
        cy.clickElement("[data-cy=goTo-addAgain]:eq(0)");
        //AddToCartButton-data-cy
        cy.intercept("Get", "**/product/likesCommentsSharesDetails/**").as(
          "getProductData2"
        );
        cy.clickElement("[data-cy=AddToCartButton-data-cy]");
        cy.wait("@getProductData2").then((interception) => {
          expect(interception.response.statusCode).to.be.eq(200);
        });
        cy.intercept("POST", /\/cart\/(add|update)/).as("CartRequest");
        cy.clickElement("[data-cy=AddToCartButton-data-cy]");
        cy.wait("@CartRequest", { timeout: 30000 }).then((interception) => {
          if (interception?.response) {
            expect(interception.response.statusCode).to.eq(200);
          } else {
            console.warn(
              "❌❌ @CartRequest was not intercepted or has no response."
            );
          }
        });
        cy.log(
          "✅✅ CartRequest Request Arrived & Click On Add To Cart Button Button"
        );
        //CartIcon_Productpage
        cy.clickElement("[data-cy=CartIcon_Productpage]");
        cy.interceptAndWait([
          {
            method: "GET",
            url: "**/api/v1/cart/cart_shipping",
            alias: "getCartShipping",
          },
          {
            method: "GET",
            url: "**/api/v1/old-cart/get_old_cart",
            alias: "getOldCart",
          },
        ]);
        cy.log("✅✅ getCartShipping & getOldCart Requests Arrived");
        cy.get("[data-cy=order-bottom-button]").should("exist");
        cy.get("[data-cy=container-orderButton]").should("exist"); //Confirm-Order-Button
        cy.get("[data-cy=Confirm-Order-Button]").should("exist"); //backHome-text
        cy.get("[data-cy=backHome-text]")
          .should("exist")
          .contains("Back To HomePage"); //backHome-text
      } else if (emptyCart && !oldCartOutOfBag) {
        cy.log("⚠️⚠️ Only emptyCart exists");
        cy.log("✅✅ Cart is Empty");
        cy.get("[data-cy=EmptyCRart]")
          .should("exist")
          .and("be.visible")
          .contains("Cart is Empty");
        cy.get("[data-cy=Confirm-Order-Button]")
          .should("exist")
          .and("be.visible");
        cy.get("[data-cy=backHome-text]")
          .should("exist")
          .and("be.visible")
          .contains("Back To HomePage");
        cy.clickElement("[data-cy=Confirm-Order-Button]");
        cy.AddProductToCartFromBoutiquePage();
        cy.clickElement("[data-cy=AddToCartButton-data-cy]");
        cy.clickElement("[data-cy=CartIcon]");
      } else if (!emptyCart && oldCartOutOfBag) {
        cy.log("⚠️⚠️ Only oldCartOutOfBag exists");
        cy.log("✅✅ There are products that are out of the bag");
        cy.get("[data-cy=line]").should("exist").and("be.visible");
        cy.get("[data-cy=oldCart-viewer]").should("exist").and("be.visible");
        cy.get("[data-cy=spanContainer-oldCartIcon]")
          .should("exist")
          .and("be.visible");
        cy.get("[data-cy=spanContainer-oldCartIcon] svg")
          .should("exist")
          .and("be.visible");
        cy.get("[data-cy=outOfBag-text]")
          .should("exist")
          .and("be.visible")
          .contains("Out Of Bag!");
        cy.get("[data-cy=hideAll]")
          .should("exist")
          .and("be.visible")
          .contains("Hide All");
        cy.get("[data-cy=Product_Non_Available_In_Cart]").should("exist");
        cy.get("[data-cy=oldProduct-card]").should("exist").and("be.visible");
        cy.get("[data-cy=goTo-addAgain]").should("exist").and("be.visible");
        cy.clickElement("[data-cy=goTo-addAgain]:eq(0)");
        //AddToCartButton-data-cy
        cy.intercept("Get", "**/product/likesCommentsSharesDetails/**").as(
          "getProductData2"
        );
        cy.clickElement("[data-cy=AddToCartButton-data-cy]");
        cy.wait("@getProductData2").then((interception) => {
          expect(interception.response.statusCode).to.be.eq(200);
        });
        cy.intercept("POST", /\/cart\/(add|update)/).as("CartRequest");
        cy.clickElement("[data-cy=AddToCartButton-data-cy]");
        cy.wait("@CartRequest", { timeout: 30000 }).then((interception) => {
          if (interception?.response) {
            expect(interception.response.statusCode).to.eq(200);
          } else {
            console.warn(
              "❌❌ @CartRequest was not intercepted or has no response."
            );
          }
        });
        cy.log(
          "✅✅ CartRequest Request Arrived & Click On Add To Cart Button Button"
        );
        //CartIcon_Productpage
        cy.clickElement("[data-cy=CartIcon_Productpage]");
        cy.interceptAndWait([
          {
            method: "GET",
            url: "**/api/v1/cart/cart_shipping",
            alias: "getCartShipping",
          },
          {
            method: "GET",
            url: "**/api/v1/old-cart/get_old_cart",
            alias: "getOldCart",
          },
        ]);
        cy.log("✅✅ getCartShipping & getOldCart Requests Arrived");
      } else {
        cy.log("❌❌ Neither element exists");
      }
    });
  });
  // end- Check if cart is empty or products are out of the bag
});
// end- Verify components and Check if cart is empty or products are out of the bag
describe("Should verify about cart components", () => {
  it("verify about cart components", () => {
    cy.get("[data-cy=container-ofProducts]").should("exist").and("be.visible");
    cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    cy.get("[data-cy=one-product]").should("exist").and("be.visible");
    cy.get("[data-cy=one-product]")
      .its("length")
      .then((length) => {
        cy.log(`✅✅ Number of products founded in bag is: ${length}`);
        cy.get("[data-cy=length-ofItems]")
          .invoke("text")
          .then((text) => {
            const itemCount = parseInt(text, 10);
            cy.log(`✅✅ Number of items in shopping bag is:${itemCount}`);
            expect(length).to.be.eq(itemCount);
          });
      }); //product-card
    cy.get("[data-cy=product-card]").should("exist"); //container-image-onCard
    cy.get("[data-cy=container-image-onCard]").should("exist"); //image-onCard
    cy.get("[data-cy=image-onCard]").should("exist").and("be.visible"); //container-ofProduct-information
    cy.get("[data-cy=container-ofProduct-information]").should("exist"); //container-ofProduct-information-img
    cy.get("[data-cy=container-ofProduct-information-img]").should("exist"); //container-ofProduct-information-img
    cy.get("[data-cy=img-ofProduct-information]")
      .should("exist")
      .and("be.visible");
    cy.get("[data-cy=productNameInCart]")
      .should("exist")
      .and("be.visible")
      .and("not.be.empty");
    cy.get("[data-cy=color-div]").should("exist");
    cy.get("[data-cy=color-div2]").should("exist");
    cy.get("[data-cy=color-div2] svg").should("exist");
    cy.get("[data-cy=color-text]")
      .should("exist")
      .and("be.visible")
      .contains("Color:"); //color-name
    cy.get("[data-cy=color-name]")
      .should("exist")
      .and("be.visible")
      .and("not.be.empty"); //size-container
    cy.ChexkExistElement("[data-cy=size-container]").then((exists) => {
      if (exists) {
        cy.get("[data-cy=size-container] svg")
          .should("exist")
          .and("be.visible"); //size-container-text
        cy.get("[data-cy=size-container-text]")
          .should("exist")
          .and("be.visible")
          .contains("Size:"); //size-container-size
        cy.get("[data-cy=size-container-size]")
          .should("exist")
          .and("be.visible")
          .and("not.be.empty");
      }
    });
    cy.get("[data-cy=countPieces-container").should("exist");
    cy.get("[data-cy=countPieces-container] svg")
      .should("exist")
      .and("be.visible"); //countPieces-text
    cy.get("[data-cy=countPieces-text]")
      .should("exist")
      .and("be.visible")
      .contains("Composed Of:"); //countPieces-number
    cy.get("[data-cy=countPieces-number]")
      .should("exist")
      .and("be.visible")
      .contains("Piece"); //sshipping-container
    cy.get("[data-cy=sshipping-container]").should("exist");
    cy.get("[data-cy=sshipping-container] svg")
      .should("exist")
      .and("be.visible"); //shipping-text
    cy.get("[data-cy=shipping-text]")
      .should("exist")
      .and("be.visible")
      .contains("Shipping:"); //days-number
    cy.get("[data-cy=days-number]")
      .should("exist")
      .and("be.visible")
      .contains("Days"); //days-text
    cy.get("[data-cy=days-text]")
      .should("exist")
      .and("be.visible")
      .contains("Details");
    cy.clickElement("[data-cy=days-text]:eq(0)");
    cy.clickElement("[data-cy=cartIcon_mainPage]"); //cartIcon_mainPage
    cy.interceptAndWait([
      {
        method: "GET",
        url: "**/api/v1/cart/cart_shipping",
        alias: "getCartShipping",
      },
      {
        method: "GET",
        url: "**/api/v1/old-cart/get_old_cart",
        alias: "getOldCart",
      },
    ]);
    cy.log("✅✅ getCartShipping & getOldCart Requests Arrived"); //card-numbering-container
    cy.get("[data-cy=card-numbering-container]").should("exist");
    cy.get("[data-cy=card-numbering-value]").should("exist").and("be.visible"); //card-footer
    cy.get("[data-cy=card-footer]").should("exist"); //plus-delete-increase-container
    cy.get("[data-cy=plus-delete-increase-container]").should("exist"); //plus-delete-increase-container
    cy.get("[data-cy=square-icon]").should("exist"); //PlusIcon_CartPage
    cy.get("[data-cy=PlusIcon_CartPage]").should("exist");
    cy.get("[data-cy=PlusIcon_CartPage] svg").should("exist").and("be.visible"); //DeleteIcon_CartPage
    cy.get("[data-cy=DeleteIcon_CartPage]").should("exist");
    cy.get("[data-cy=DeleteIcon_CartPage] svg")
      .should("exist")
      .and("be.visible"); //DeleteIcon_CartPage//QuantityInCart
    cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    cy.get("[data-cy=QuantityInCart]").should("exist"); //oldNew-price-container
    cy.get("[data-cy=oldNew-price-container]").should("exist"); //oldNew-price-container2
    cy.get("[data-cy=oldNew-price-container2]").should("exist"); //Subdivisions
    cy.get("[data-cy=Subdivisions]").should("exist"); //newOld-price
    cy.get("[data-cy=newOld-price]").should("exist"); //oldPrice-container
    cy.get("[data-cy=oldPrice-container]").should("exist"); //oldPrice-container
    cy.get("[data-cy=oldPrice-svg]").should("exist").and("be.visible");
    cy.get("[data-cy=new-price]")
      .should("exist")
      .and("be.visible")
      .and("not.be.empty"); //currency-symbol
    cy.get("[data-cy=currency-symbol]")
      .should("exist")
      .and("be.visible")
      .and("not.be.empty"); //below-subdivisions
    // cy.get("[data-cy=below-subdivisions]").should("exist");
    cy.ChexkExistElement("[data-cy=below-subdivisions]").then((exists) => {
      if (exists) {
        cy.get("[data-cy=below-subdivisions] svg")
          .should("exist")
          .and("be.visible"); //size-container-text
        cy.get("[data-cy=saved-text]")
          .should("exist")
          .and("be.visible")
          .contains("Saved"); //size-container-size
        cy.get("[data-cy=rate]")
          .should("exist")
          .and("be.visible")
          .contains("%");
      }
    });
  });
  // end- verify about cart components
});
// end- should verify about cart components
describe("Should verify components in cart footer page", () => {
  it("should render the container with correct initial styles", () => {
    cy.get("[data-cy=order-bottom-button]").should("exist");
    cy.Exist("[data-cy=one-product]").then((exists) => {
      if (exists) {
        cy.get("[data-cy=overflow-hidden-container]").should("exist");
        cy.get('[data-cy="overflow-hidden-container"]')
          .should("exist")
          .and("have.class", "flex-col")
          .and("have.class", "overflow-hidden")
          .and("have.class", "h-[116px]"); // Check for collapsed state
        cy.get('[data-cy="containerOf-questionMark"]')
          .find('[data-cy="questionMark"]')
          .should("exist")
          .and("have.attr", "width", "14")
          .and("have.attr", "height", "14");
        cy.get('[data-cy="horizontal-tape-container"]')
          .should("exist")
          .and("have.class", "flex")
          .and("have.class", "flex-row")
          .and("have.class", "marquee-slide");
        cy.get('[data-cy="firstItem-onHorizontalTape"]')
          .should("exist")
          .find('[data-cy="deleivery-icon"]')
          .should("exist");
        cy.get('[data-cy="deleivery-text"]')
          .should("exist")
          .and("contain", "Delivery")
          .find('[data-cy="text-name"]')
          .should("contain", "2 June");
        cy.get('[data-cy="firstItem-onHorizontalTape"]')
          .should("have.class", "flex")
          .and("have.class", "items-center");
        cy.get('[data-cy="deleivery-text"]')
          .should("have.class", "ml-1")
          .and("have.class", "whitespace-nowrap")
          .and("have.class", "text-[11px]")
          .and("have.class", "text-[#505050]");
        cy.Exist("[data-cy=secondItem-onHorizontalTape]").then((exists) => {
          if (exists) {
            cy.get('[data-cy="secondItem-onHorizontalTape"]')
              .should("exist")
              .find('[data-cy="free-shipping-icon"]')
              .should("exist");

            cy.get('[data-cy="FreeShipping-text"]')
              .should("exist")
              .and("contain", "Free Shipping");
            cy.get('[data-cy="secondItem-onHorizontalTape"]')
              .should("have.class", "flex")
              .and("have.class", "items-center")
              .and("have.class", "ml-2");
            cy.get('[data-cy="FreeShipping-text"]')
              .should("have.class", "ml-1")
              .and("have.class", "whitespace-nowrap")
              .and("have.class", "text-[11px]")
              .and("have.class", "text-[#505050]");
          }
        });
        cy.get('[data-cy="thirdItem-onHorizontalTape"]')
          .should("exist")
          .find('[data-cy="free-return-icon"]')
          .should("exist");
        cy.get('[data-cy="FreeReturn-text"]')
          .should("exist")
          .and("contain", "Free Return");
        cy.get('[data-cy="thirdItem-onHorizontalTape"]')
          .should("have.class", "flex")
          .and("have.class", "items-center")
          .and("have.class", "ml-2");
        cy.get('[data-cy="FreeReturn-text"]')
          .should("have.class", "ml-1")
          .and("have.class", "whitespace-nowrap")
          .and("have.class", "text-[11px]")
          .and("have.class", "text-[#505050]");
        cy.get('[data-cy="fourthItem-onHorizontalTape"]')
          .should("exist")
          .find('[data-cy="deleiveryuaranteeIcon"]')
          .should("exist");
        cy.get('[data-cy="DeliveryGuarantee-text"]')
          .should("exist")
          .and("contain", "Delivery Guarantee");
        cy.get('[data-cy="fifthItem-onHorizontalTape"]')
          .should("exist")
          .find('[data-cy="Return-Gurantee-Icon"]')
          .should("exist");
        cy.get('[data-cy="ReturnGurantee-text"]')
          .should("exist")
          .and("contain", "Return Guarantee");
        cy.get('[data-cy="sixtyItem-onHorizontalTape"]')
          .should("exist")
          .find('[data-cy="Secure-Payment-Icon"]')
          .should("exist");
        cy.get('[data-cy="SecurePayment-text"]')
          .should("exist")
          .and("contain", "Secure Privacy");
        cy.get('[data-cy="seventyItem-onHorizontalTape"]')
          .should("exist")
          .find('[data-cy="Safe-Payment-Icon"]')
          .should("exist");
        cy.get('[data-cy="SafePayment-text"]')
          .should("exist")
          .and("contain", "Safe & Easy Payment");
        cy.get('[data-cy="eightyItem-onHorizontalTape"]')
          .should("exist")
          .find('[data-cy="Purchase-Protection-Icon"]')
          .should("exist");
        cy.get('[data-cy="PurchaseProtection-text"]')
          .should("exist")
          .and("contain", "Purshase Protection");
        cy.get('[data-cy="nintyItem-onHorizontalTape"]')
          .should("exist")
          .find('[data-cy="Money-Icon"]')
          .should("exist");
        cy.get('[data-cy="Money-text"]')
          .should("exist")
          .and("contain", "Earn Money With This Order");
        cy.get("[data-cy=container-orderButton]").should("exist"); //Confirm-Order-Button
        cy.get("[data-cy=Confirm-Order-Button]").should("exist"); //backHome-text
        cy.get("[data-cy=confirm-text]")
          .should("exist")
          .contains("Confirm And Continue"); //backHome-text
      }
    });
  });
  it("should display the item details and discount information and shipping information and correct prices correctly", () => {
    cy.Exist("[data-cy=total-expanded]").then((exists) => {
      if (exists) {
        cy.clickElement("[data-cy=total-expanded]");
        cy.get("[data-cy=itemPriceDiscountShipping-container]").should("exist");
        // Check item texts
        cy.get("[data-cy=itemTexts]").should("contain", "Item");
        cy.get("[data-cy=itemTotalTexts]").should("contain", "Total Items");
        cy.get("[data-cy=itemsLength]").should("exist");
        // Check price section
        cy.get("[data-cy=Price-container]").should("exist");
        cy.get("[data-cy=Price-text]").should("contain", "Price");
        cy.get("[data-cy=NormalPrice-text]").should("contain", "Normal Price");
        cy.get("[data-cy=currency_symbol-Price]").should("exist");
        cy.get("[data-cy=discount-container]").should("exist");
        cy.get("[data-cy=totalDiscount-text]").should(
          "contain",
          "Total Discount"
        );
        cy.get("[data-cy=empty-div2]").should("exist");
        cy.get("[data-cy=ShowDiscount]").should(
          "contain",
          "Click To Show All Discount"
        );
        cy.get("[data-cy=Shipping-container]").should("exist");
        cy.get("[data-cy=Shipping-text]").should("contain", "Shipping");
        cy.get("[data-cy=Completely-text]").should(
          "contain",
          "Shipping Is Completely Free Without Any Extras"
        );
      }
    });
  });
  it("should display total information correctly", () => {
    cy.Exist("[data-cy=total-expanded]").then((exists) => {
      if (exists) {
        cy.get("[data-cy=total-expanded]").should("exist");
        // Check total left container texts
        cy.get("[data-cy=total-left-text]").should("contain", "Total");
        cy.get("[data-cy=Inclusive-text]").should(
          "contain",
          "All Inclusive Without Additions"
        );
        // Check total right container
        cy.get("[data-cy=total-right-RoundPrice]").should("exist");
        cy.get("[data-cy=total-right-text]").should("exist");
        cy.get("[data-cy=Confirm-Order-Button]").should("exist");
      }
    });
  });
});
