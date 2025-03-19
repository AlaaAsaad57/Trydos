describe("Should Add Product To Cart From Any Boutique Page", () => {
  let productName = "";
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Select Any Boutique & Click On", () => {
    cy.get("[data-cy=boutiques]", { timeout: 20000 });
    cy.clickElementForce(".offer-widget:nth-child(6)");
    cy.log("✅✅ An Boutique Selected & Click");
    cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  it("Should Get The Name Of The First Product From Its Display Card", () => {
    cy.get("[data-cy=allCategory]", { timeout: 15000 });
    cy.getProductNameFirstly().then((name) => {
      productName = name;
    });
  });
  it("Should Click On Buy Button For The First Product From Its Display Card", () => {
    cy.get("[data-cy=Cart-ByButton]").eq(0).click({ force: true });
    cy.log("✅✅ Buy Button Clicked");
  });
  it("Should Waiting The Dual Request (getProductData1,getProductData2) As Dual Request Should Arrive Together", () => {
    cy.interceptAndWait([
      {
        method: "GET",
        url: "**/product/qtyPriceDetails/**",
        alias: "getProductData1",
      },
      {
        method: "GET",
        url: "**/product/likesCommentsSharesDetails/**",
        alias: "getProductData2",
      },
    ]);
    cy.log("✅✅ getProductData1 & getProductData2 Requests Arrived");
  });
  it("Should Click On Add To Cart Button & Wait Add To Cart Or Update Cart Request", () => {
    cy.intercept("POST", /\/cart\/(add|update)/).as("CartRequest");
    cy.clickElementScroll("[data-cy=AddToCartButton-data-cy]");
    cy.wait("@CartRequest", { timeout: 10000 }).then((interception) => {
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
  });
  it("Should Click On Cart Icon & Open Cart Page", () => {
    cy.clickElementForce("[data-cy=CartIcon]");
    cy.log("✅✅ Click On Cart Icon & Open Cart Page");
  });
  it("Should Get The Name Of Product That Was Added To cart To Compare It With The Name Obtained Previously", () => {
    cy.get("[data-cy=productNameInCart]")
      .invoke("text")
      .then((text) => {
        const productNameInCart = text as unknown as string;
        cy.log(
          "✅✅ Product Name In Cart Obtained & The Product Name In Cart Is:",
          productNameInCart
        );
        if (productName.indexOf(productNameInCart) !== -1) {
          cy.log("Success: Product names are similar");
        } else {
          cy.log("Error: Product names do not match");
        }
      });
  });
  it("Should Click On Cart Back Icon & Back Icon Boutique Page To Return To Home Page", () => {
    cy.clickElementForce("[data-cy=CartBackIcon]");
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ Dual Back Icon Clicked & Returned To Main Page");
  });
});
describe("Should Add Product To Cart From Any Product Page", () => {
  let productName = "";
  it("Should Select Any Boutique & Click On", () => {
    cy.get("[data-cy=boutiques]", { timeout: 20000 });
    cy.clickElementForce(".offer-widget:nth-child(6)");
    cy.log("✅✅ An Boutique Selected & Click");
    cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
    cy.log("✅✅ The Boutiue Page Opened");
  });
  it("Should Get The Name Of The First Product From Its Display Card", () => {
    cy.get("[data-cy=allCategory]", { timeout: 15000 });
    cy.getProductNameFirstly().then((name) => {
      productName = name;
    });
  });
  it("Should Click On The Card Of The First Product & View Its Page", () => {
    cy.get("[data-cy=on_mouse_over_product]").eq(0).click({ force: true });
    cy.log("✅✅ The Card Of The First Product Clicked");
  });
  it("Should Click On Add To Cart Button Thats Founded In Product Page", () => {
    cy.clickElementScroll("[data-cy=addToCartButton_productPage]");
    cy.log("✅✅ Add To Cart Button Thats Founded In Product Page Clicked");
  });
  it("Should Click On Add To Cart Button Thats Founded In Boutique Page & Wait Add To Cart Or Update Cart Request", () => {
    cy.intercept("POST", /\/cart\/(add|update)/).as("CartRequest");
    cy.clickElementScroll("[data-cy=AddToCartButton-data-cy]");
    cy.wait("@CartRequest", { timeout: 10000 }).then((interception) => {
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
  });
  it("Should Click On Cart Icon & Open Cart Page", () => {
    cy.clickElementForce("[data-cy=CartIcon_Productpage]");
    cy.log("✅✅ Click On Cart Icon & Open Cart Page");
  });
  it("Should Get The Name Of Product That Was Added To cart To Compare It With The Name Obtained Previously", () => {
    cy.get("[data-cy=productNameInCart]")
      .invoke("text")
      .then((text) => {
        const productNameInCart = text as unknown as string;
        cy.log(
          "✅✅ Product Name In Cart Obtained & The Product Name In Cart Is:",
          productNameInCart
        );
        if (productName.indexOf(productNameInCart) !== -1) {
          cy.log("Success: Product names are similar");
        } else {
          cy.log("Error: Product names do not match");
        }
      });
  });
  it("Should Click On Cart Back Icon & Back Icon Product Page & Back Icon Boutique Page To Return To Home Page", () => {
    cy.clickElementForce("[data-cy=CartBackIcon]");
    cy.clickElementForce("[data-cy=backIcon_productPage]");
    cy.clickElementForce("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ Dual Back Icon Clicked & Returned To Main Page");
  });
});
// *************************************************************************************************
describe("Should Click On Cart Icon On The Home Page & Increase The Quantity Of One Of The Products In The Cart", () => {
  let QuantityInCartPreviously = 0;
  it("Should Click On Cart Icon In The Home Page & Open Cart Page", () => {
    cy.get("[data-cy=boutiques]", { timeout: 15000 });
    cy.clickElementForce("[data-cy=cartIcon_mainPage]");
    cy.log("✅✅ Click On Cart Icon In Main Page & Open Cart Page");
  });
  it("The Required Quantity Of The Product Should Be Obtained In Advance", () => {
    cy.get('[data-cy="QuantityInCart"]')
      .eq(0)
      .invoke("val")
      .then((value) => {
        QuantityInCartPreviously = parseInt(value as string, 10);
        cy.log(`Input value is ${QuantityInCartPreviously}`);
      });
    cy.log("✅✅ The Quantity That Was Previously Requested Has Been Obtained");
  });
  it("Should Click On The Increase Icon For The Product In The Cart & Waiting Increase Quantity Request", () => {
    cy.intercept("POST", "**/api/new_v1/cart/update").as("increaseQuantity");
    cy.get("[data-cy=PlusIcon_CartPage]").eq(0).click({ force: true });
    cy.wait("@increaseQuantity", { timeout: 10000 }).then((interception) => {
      if (interception) {
        cy.log("✅ increaseQuantity request successfully intercepted");
      } else {
        console.warn("❌❌ increaseQuantity request did not arrive");
      }
    });
    cy.log(
      "✅✅ Increase Icon Clicked & The Increase Quantity Request Arrived"
    );
  });
  it("The Required Amount Of Product After Increasing Should Be Compared With Previously Existing Peak To Ensure The Increase Process Has Been Completed", () => {
    cy.get('[data-cy="QuantityInCart"]')
      .eq(0)
      .invoke("val")
      .then((value) => {
        const inputValueAfterUpdate = parseInt(value as string, 10);
        cy.log(`Input value is ${inputValueAfterUpdate}`);
        expect(inputValueAfterUpdate).to.be.greaterThan(
          QuantityInCartPreviously
        );
        // cy.log("Success: Quantity increaseded in cart");
        // if (inputValueAfterUpdate > QuantityInCartPreviously) {
        //   cy.log("Success: Quantity increaseded in cart");
        // } else {
        //   cy.log("Error: Quantity did not increaseded in cart");
        // }
      });
  });
  it("Should Click On Cart Back Icon To Return To Home Page", () => {
    cy.clickElementForce("[data-cy=CartBackIcon]");
    cy.log("✅✅ Dual Back Icon Clicked & Returned To Main Page");
  });
});
// *************************************************************************************************
describe("Should Click On The Cart Icon On The Home Page & Decrease The Quantity", () => {
  let QuantityInCartPreviously = 0;
  it("Should Click On Cart Icon In The Home Page & Open Cart Page", () => {
    cy.get("[data-cy=boutiques]", { timeout: 15000 });
    cy.clickElementForce("[data-cy=cartIcon_mainPage]");
    cy.log("✅✅ Click On Cart Icon In Main Page & Open Cart Page");
  });
  it("The Required Quantity Of The Product Should Be Obtained In Advance", () => {
    cy.get('[data-cy="QuantityInCart"]')
      .eq(0)
      .invoke("val")
      .then((value) => {
        QuantityInCartPreviously = parseInt(value as string, 10);
        cy.log(`Input value is ${QuantityInCartPreviously}`);
      });
    cy.log("✅✅ The Quantity That Was Previously Requested Has Been Obtained");
  });
  it("If The Quantity Of The Previously Requested Product Is One, We Will Find Delete Icon. Here, Click On It & The Product Is Deleted From The Cart, If It Is Greater Than One, It Will Be Reduced By One Only", () => {
    cy.intercept("POST", "**/api/new_v1/cart/update").as("decreaseQuantity");
    cy.get("[data-cy=MinusIcon_CartPage]").eq(0).click({ force: true });
    cy.wait("@decreaseQuantity").then((interception) => {
      if (interception) {
        cy.log("✅ decreaseQuantity request successfully intercepted");
      }
    });
    cy.get('[data-cy="QuantityInCart"]') // Replace with actual test ID
      .invoke("val")
      .then((value) => {
        const inputValueAfterUpdate = parseInt(value as string, 10);
        cy.log(`Input value is ${inputValueAfterUpdate}`);
        cy.log(`Input value is ${inputValueAfterUpdate}`);
        expect(inputValueAfterUpdate).to.be.lessThan(QuantityInCartPreviously);
        cy.log("Success: Quantity decreaseded in cart");
        // if (inputValueAfterUpdate < QuantityInCartPreviously) {
        //   cy.log("Success: Quantity decreaseded in cart");
        // }
      });
  });
  it("Should Click On Cart Back Icon To Return To Home Page", () => {
    cy.clickElementForce("[data-cy=CartBackIcon]");
    cy.log("✅✅ Dual Back Icon Clicked & Returned To Main Page");
  });
});
// **********************************************Added Last*****************************************************
describe("Should Click On The Cart Icon On The Home Page & Delete The Quantity Of Product", () => {
  let QuantityInCartPreviously = 0;
  it("Should Click On Cart Icon In The Home Page & Open Cart Page", () => {
    cy.get("[data-cy=boutiques]", { timeout: 15000 });
    cy.clickElementForce("[data-cy=cartIcon_mainPage]");
    cy.log("✅✅ Click On Cart Icon In Main Page & Open Cart Page");
  });
  it("The Required Quantity Of The Product Should Be Obtained In Advance", () => {
    cy.get('[data-cy="QuantityInCart"]')
      .eq(0)
      .invoke("val")
      .then((value) => {
        QuantityInCartPreviously = parseInt(value as string, 10);
        cy.log(`Input value is ${QuantityInCartPreviously}`);
      });
    cy.log("✅✅ The Quantity That Was Previously Requested Has Been Obtained");
  });
  it("If The Quantity Of The Previously Requested Product Is One, We Will Find Delete Icon. Here, Click On It & The Product Is Deleted From The Cart, If It Is Greater Than One, It Will Be Reduced By One Only", () => {
    cy.intercept("POST", "**/api/new_v1/cart/remove").as("removeRequest");
    cy.Exist("[data-cy=DeleteIcon_CartPage]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=DeleteIcon_CartPage]").eq(0).click({ force: true });
        cy.wait("@removeRequest").then((interception) => {
          if (interception) {
            cy.log("✅ removeRequest successfully intercepted");
          }
        });
      }
    });
  });
  it("Should Click On Cart Back Icon To Return To Home Page", () => {
    cy.clickElementForce("[data-cy=CartBackIcon]");
    cy.log("✅✅ Dual Back Icon Clicked & Returned To Main Page");
  });
});
