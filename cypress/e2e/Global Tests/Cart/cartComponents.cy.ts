describe("Should open trydos then open cart page", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
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
});
describe("Should check if products purchased later are out of the bag", () => {
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
    // cy.get("[data-cy=length-ofItems]").should("exist").and("be.visible");
    cy.get("[data-cy=textContainer-textOnHeader]")
      .should("exist")
      .and("be.visible")
      .contains("Shopping Bag");
    cy.get("[data-cy=shareIcon-onHeader]").should("exist").and("be.visible");
    cy.get("[data-cy=container-ofProducts]").should("exist").and("be.visible");
    cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    cy.log("✅✅ All components founded");
  });
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
        cy.OpenBoutiqueAndAddProductToCartFromBoutiquePage();
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
});
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
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
    // cy.get("[data-cy=container2-ofProducts]").should("exist").and("be.visible");
  });
});
