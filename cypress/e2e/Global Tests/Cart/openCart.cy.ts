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
  it.skip("should add product to cart from any boutique page", () => {
    cy.get(".offer-widget:first-child").click({ scrollBehavior: false });
    cy.wait(5000);

    cy.get("[data-cy=productName]")
      .eq(0)
      .invoke("text")
      .then((text) => {
        productName = text as unknown as string;
        console.log("Product Name:", productName);
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
    cy.intercept("POST", "**/api/new_v1/cart/add").as("addToCart");
    cy.intercept("POST", "**/api/new_v1/cart/**").as("updateCart");
    cy.get("[data-cy=AddToCartButton-data-cy]").should("exist").click({
      scrollBehavior: false,
    });
    cy.wait(["@addToCart", "@updateCart"], { timeout: 30000 }).then(
      ([addToCart, updateCart]) => {
        if (addToCart.response?.statusCode === 200) {
          console.log("cart/add was called");
          expect(addToCart.response!.statusCode).to.eq(200);
        } else if (updateCart.response?.statusCode === 200) {
          console.log("cart/update was called");
          expect(updateCart.response!.statusCode).to.eq(200);
        } else {
          throw new Error("Neither cart/add nor cart/update was called");
        }
      }
    );
    cy.Exist("[data-cy=CartIcon]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=CartIcon]").click({ force: true });
      }
    });
    cy.wait(4000);
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
    cy.wait(5000);
    cy.Exist("[data-cy=CartBackIcon]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=CartBackIcon]").click({ force: true });
      }
    });
    cy.wait(5000);
    cy.Exist("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=back_icon_boutique_page]").click({ force: true });
      }
    });
    cy.wait(4000);
  });
  it("should add product to cart from any product page", () => {
    cy.get(".offer-widget:first-child").click({ scrollBehavior: false });
    cy.wait(5000);
    cy.get("[data-cy=productName]")
      .eq(0)
      .invoke("text")
      .then((text) => {
        productName = text as unknown as string;
        console.log("Product Name:", productName);
      });
    cy.Exist("[data-cy=on_mouse_over_product]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=on_mouse_over_product]").eq(0).click({ force: true });
      }
    });
    cy.wait(10000);
    cy.get("[data-cy=AddToCartButton-data-cy]").should("exist").click({
      scrollBehavior: false,
    });
    cy.wait(10000);
    cy.intercept("POST", "**/api/new_v1/cart/add").as(
      "addToCartFromAnyProductPage"
    );
    cy.intercept("POST", "**/api/new_v1/cart/**").as(
      "updateCartFromAnyProductPage"
    );
    cy.get("[data-cy=AddToCartButton-data-cy]").should("exist").click({
      scrollBehavior: false,
    });
    cy.wait(["@addToCartFromAnyProductPage", "@updateCart"], {
      timeout: 30000,
    }).then(([addToCartFromAnyProductPage, updateCartFromAnyProductPage]) => {
      if (addToCartFromAnyProductPage.response?.statusCode === 200) {
        console.log("cart/add was called");
        expect(addToCartFromAnyProductPage.response!.statusCode).to.eq(200);
      } else if (updateCartFromAnyProductPage.response?.statusCode === 200) {
        console.log("cart/update was called");
        expect(updateCartFromAnyProductPage.response!.statusCode).to.eq(200);
      } else {
        throw new Error("Neither cart/add nor cart/update was called");
      }
    });
    cy.wait(10000);
    cy.get("[data-cy=CartIcon_Productpage]").should("exist").click({
      scrollBehavior: false,
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
        cy.get("[data-cy=CartBackIcon]").click({ force: true });
      }
    });
    cy.Exist("[data-cy=backIcon_productPage]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=backIcon_productPage]").click({ force: true });
      }
    });
    cy.wait(10000);
    cy.Exist("[data-cy=back_icon_boutique_page]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=back_icon_boutique_page]").click({ force: true });
      }
    });
    cy.wait(4000);
  });
  it("should Click on the CartIcon on the home page and increase the quantity", () => {
    cy.Exist("[data-cy=cartIcon_mainPage]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=cartIcon_mainPage]").click({ force: true });
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
        cy.get("[data-cy=PlusIcon_CartPage]").click({ force: true });
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
            cy.get("[data-cy=CartBackIcon]").click({ force: true });
          }
        });
      }
    });
  });
  it("should Click on the CartIcon on the home page and decrease the quantity", () => {
    cy.Exist("[data-cy=cartIcon_mainPage]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=cartIcon_mainPage]").click({ force: true });
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
    cy.Exist("[data-cy=MinusIcon_CartPage]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=MinusIcon_CartPage]").click({ force: true });
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
            cy.get("[data-cy=CartBackIcon]").click({ force: true });
          }
        });
      }
    });
    cy.wait(5000);
    cy.Exist("[data-cy=DeleteIcon_CartPage]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=DeleteIcon_CartPage]").click({ force: true });
        cy.wait("@removeRequest").then((interception) => {
          console.log("removeRequest Successfully");
        });
        cy.Exist("[data-cy=CartBackIcon]").then((exist) => {
          if (exist) {
            cy.get("[data-cy=CartBackIcon]").click({ force: true });
          }
        });
      }
    });
    cy.wait(5000);
  });
});
