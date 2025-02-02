describe("open cart and view products", () => {
  let productName = "";
  let inputValue = 0;
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.clearAllData();
    cy.Visit("/");
    cy.wait(5000);
  });
  it("should add product to cart from any boutique page", () => {
    cy.wait(5000);
    cy.Exist(".offer-widget:first-child").then((exist) => {
      if (exist) {
        cy.clickElementScroll(".offer-widget:first-child");
      }
    });
    cy.wait(10000);
    cy.getProductNameFirstly().then((name) => {
      productName = name;
    });
    cy.Exist("[data-cy=Cart-ByButton]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=Cart-ByButton]").eq(0).click({ force: true });
      }
    });
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
    cy.wait(10000);

    cy.intercept("POST", /\/cart\/(add|update)/).as("CartRequest");
    cy.Exist("[data-cy=AddToCartButton-data-cy]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=AddToCartButton-data-cy]");
      }
    });
    cy.wait(10000);
    cy.wait("@CartRequest").then((interception) => {
      // Check that only one request was triggered (either cart/add or cart/update)

      // Make sure only one request was triggered
      console.log("Intercepted request:", interception);

      // Ensure that the triggered request is successful
      expect(interception.response.statusCode).to.eq(200);
    });
    cy.wait(10000);
    cy.Exist("[data-cy=CartIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=CartIcon]");
      }
    });
    cy.wait(10000);
    cy.get("[data-cy=productNameInCart]")
      .invoke("text")
      .then((text) => {
        const productNameInCart = text as unknown as string;
        console.log("Product Name In Cart:", productNameInCart);
        if (productName.indexOf(productNameInCart) !== -1) {
          console.log("Success: Product names are similar");
        } else {
          console.log("Error: Product names do not match");
        }
      });
    cy.wait(10000);
    cy.Exist("[data-cy=CartBackIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=CartBackIcon]");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
      }
    });
    cy.wait(4000);
  });

  it("should add product to cart from any product page", () => {
    cy.Exist(".offer-widget:first-child").then((exist) => {
      if (exist) {
        cy.clickElementScroll(".offer-widget:first-child");
      }
    });
    cy.wait(20000);
    cy.getProductNameFirstly().then((name) => {
      productName = name;
    });
    cy.Exist("[data-cy=on_mouse_over_product]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=on_mouse_over_product]").eq(0).click({ force: true });
      }
    });
    cy.wait(20000);
    cy.Exist("[data-cy=addToCartButton_productPage]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=addToCartButton_productPage]");
      }
    });
    cy.wait(10000);
    cy.intercept("POST", /\/cart\/(add|update)/).as("CartRequest");

    cy.Exist("[data-cy=AddToCartButton-data-cy]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=AddToCartButton-data-cy]")
          // .eq(0)
          .click({ force: true });
      }
    });
    cy.wait("@CartRequest").then((interception) => {
      // Check that only one request was triggered (either cart/add or cart/update)

      // Make sure only one request was triggered
      console.log("Intercepted request:", interception);

      // Ensure that the triggered request is successful
      expect(interception.response.statusCode).to.eq(200);
    });

    cy.wait(10000);
    cy.Exist("[data-cy=CartIcon_Productpage]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=CartIcon_Productpage]").eq(0).click({ force: true });
      }
    });
    cy.wait(10000);
    cy.get("[data-cy=productNameInCart]")
      .invoke("text")
      .then((text) => {
        const productNameInCart = text as unknown as string;
        console.log("Product Name In Cart:", productNameInCart);
        if (productName.indexOf(productNameInCart) !== -1) {
          console.log("Success: Product names are similar");
        } else {
          console.log("Error: Product names do not match");
        }
      });
    cy.Exist("[data-cy=CartBackIcon]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=CartBackIcon]");
      }
    });
    cy.Exist("[data-cy=backIcon_productPage]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=backIcon_productPage]");
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=back_icon_boutique_page]");
      }
    });
    cy.wait(4000);
  });
  it("should Click on the CartIcon on the home page and increase the quantity", () => {
    cy.Exist("[data-cy=cartIcon_mainPage]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=cartIcon_mainPage]");
      }
    });
    cy.intercept("POST", "**/api/new_v1/cart/update").as("increaseQuantity");
    cy.wait(5000);
    cy.get('[data-cy="QuantityInCart"]')
      .eq(0) // Replace with actual test ID
      .invoke("val")
      .then((value) => {
        inputValue = parseInt(value as string, 10);
        cy.log(`Input value is ${inputValue}`);
        console.log(`Input value is ${inputValue}`);
        // cy.wrap(inputValue).as("storedInputValue");
      });
    cy.Exist("[data-cy=PlusIcon_CartPage]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=PlusIcon_CartPage]");
        cy.get('[data-cy="QuantityInCart"]') // Replace with actual test ID
          .invoke("val")
          .then((value) => {
            const inputValueAfterUpdate = parseInt(value as string, 10);
            cy.log(`Input value is ${inputValueAfterUpdate}`);
            console.log(`Input value is ${inputValueAfterUpdate}`);
            if (inputValueAfterUpdate > inputValue) {
              console.log("Success: Quantity increaseded in cart");
            } else {
              console.log("Error: Quantity did not increaseded in cart");
            }
          });
        cy.wait("@increaseQuantity").then((interception) => {
          console.log("increaseQuantity request Successfully");
        });
        cy.Exist("[data-cy=CartBackIcon]").then((exist) => {
          if (exist) {
            cy.clickElementForce("[data-cy=CartBackIcon]");
          }
        });
      }
    });
  });
  it("should Click on the CartIcon on the home page and decrease the quantity", () => {
    cy.Exist("[data-cy=cartIcon_mainPage]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=cartIcon_mainPage]");
      }
    });
    cy.intercept("POST", "**/api/new_v1/cart/update").as("decreaseQuantity");
    cy.intercept("POST", "**/api/new_v1/cart/remove").as("removeRequest");
    cy.wait(10000);
    cy.get('[data-cy="QuantityInCart"]')
      .eq(0) // Replace with actual test ID
      .invoke("val")
      .then((value) => {
        inputValue = parseInt(value as string, 10);
        cy.log(`Input value is ${inputValue}`);
        console.log(`Input value is ${inputValue}`);
      });
    cy.wait(5000);
    cy.Exist("[data-cy=DeleteIcon_CartPage]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=DeleteIcon_CartPage]");
        cy.wait("@removeRequest").then((interception) => {
          console.log("removeRequest Successfully");
        });
        cy.Exist("[data-cy=CartBackIcon]").then((exist) => {
          if (exist) {
            cy.clickElementForce("[data-cy=CartBackIcon]");
          }
        });
      }
    });
    cy.Exist("[data-cy=MinusIcon_CartPage]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=MinusIcon_CartPage]");
        cy.get('[data-cy="QuantityInCart"]') // Replace with actual test ID
          .invoke("val")
          .then((value) => {
            const inputValueAfterUpdate = parseInt(value as string, 10);
            cy.log(`Input value is ${inputValueAfterUpdate}`);
            console.log(`Input value is ${inputValueAfterUpdate}`);
            if (inputValueAfterUpdate < inputValue) {
              console.log("Success: Quantity decreaseded in cart");
            } else {
              console.log("Error: Quantity did not decreaseded in cart");
            }
          });
        cy.wait("@decreaseQuantity").then((interception) => {
          console.log("decreaseQuantity request Successfully");
        });
        cy.Exist("[data-cy=CartBackIcon]").then((exist) => {
          if (exist) {
            cy.clickElementForce("[data-cy=CartBackIcon]");
          }
        });
      }
    });
    cy.wait(5000);
  });
  // **************************************************************************************
  it.skip("should search icon ", () => {
    cy.wait(10000);
    cy.Exist("[data-cy=searchIcon_mainPage]").then((exist) => {
      if (exist) {
        cy.clickElementScroll("[data-cy=searchIcon_mainPage]");
        console.log("Find item");
      }
    });
    cy.wait(5000);
    cy.Exist("[data-cy=brandItem]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=brandItem]").eq(0).click({ scrollBehavior: false });
        // cy.clickElementScroll("[data-cy=brandItem]");
        console.log("Find item");
      }
    });
  });
});
