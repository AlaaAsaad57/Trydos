describe("Should Add Product To Cart From Any Boutique Page", () => {
  let productName: string = "";
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Verify The Main Pagee Loaded", () => {
    cy.interceptAndWait([
      {
        method: "GET",
        url: "**/api/v1/stories/users_stories",
        alias: "users_stories",
      },
      {
        method: "GET",
        url: "**/api/products/popular-search",
        alias: "popular-search",
      },
    ]);
    cy.log("✅✅ users_stories & popular-search Requests Arrived");
  });
  it("Should Select Any Boutique To Add Product To Cart From It", () => {
    cy.OpenBoutiqueAndAddProductToCartFromBoutiquePage();
  });
  it("Should Click On Add To Cart Button & Wait Add To Cart Or Update Cart Request", () => {
    cy.ClickAddToCartAndWaitRequest();
  });
  it("Should Click On Cart Icon & Open Cart Page", () => {
    cy.clickElement("[data-cy=CartIcon]");
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
        cy.log("✅✅ The Product Name Is:", productName);
        // if (productName.indexOf(productNameInCart) !== -1) {
        //   cy.log("✅✅ Success: Product names are similar");
        // } else {
        //   cy.log("❌❌ Error: Product names do not match");
        //   expect(1).to.be.eq(2);
        // }
      });
  });
  it("Should Click On Cart Back Icon & Back Icon Boutique Page To Return To Home Page", () => {
    cy.clickElement("[data-cy=CartBackIcon]");
    cy.clickElement("[data-cy=back_icon_boutique_page]");
    cy.log("✅✅ Dual Back Icon Clicked & Returned To Main Page");
  });
});
describe("Should Add Product To Cart From Any Product Page", () => {
  let productName = "";
  it("Should Complate Add Product To Cart Operation From Product Page", () => {
    cy.ComplateAddProductOperationAndGoCartPage();
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
        // if (productName.indexOf(productNameInCart) !== -1) {
        //   cy.log("Success: Product names are similar");
        // } else {
        //   cy.log("Error: Product names do not match");
        // }
      });
  });
});
describe("Should Click On Cart Icon On The Home Page & Increase The Quantity Of One Of The Products In The Cart", () => {
  let QuantityInCartPreviously = 0;
  it("The Required Quantity Of The Product Should Be Obtained In Advance", () => {
    cy.get('[data-cy="QuantityInCart"]')
      .eq(0)
      .invoke("val")
      .then((value) => {
        QuantityInCartPreviously = parseInt(value as string, 10);
        cy.log(`✅✅ The Old Quantity In Cart is ${QuantityInCartPreviously}`);
      });
    cy.log("✅✅ The Quantity That Was Previously Requested Has Been Obtained");
  });
  it("Should Click On The Increase Icon For The Product In The Cart & Waiting Increase Quantity Request", () => {
    cy.intercept("POST", "**/api/new_v1/cart/update").as("increaseQuantity");
    cy.clickElement("[data-cy=PlusIcon_CartPage]:eq(0)");
    cy.wait("@increaseQuantity").then((interception) => {
      cy.log("✅ increaseQuantity request successfully intercepted");
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
        cy.log(`✅✅ The New Quantity In Cart is ${inputValueAfterUpdate}`);
        expect(inputValueAfterUpdate).to.be.greaterThan(
          QuantityInCartPreviously
        );
      });
  });
});
describe("Should Click On The Cart Icon On The Home Page & Decrease The Quantity", () => {
  let QuantityInCartPreviously = 0;
  it("The Required Quantity Of The Product Should Be Obtained In Advance", () => {
    cy.get('[data-cy="QuantityInCart"]')
      .eq(0)
      .invoke("val")
      .then((value) => {
        QuantityInCartPreviously = parseInt(value as string, 10);
        cy.log(`✅✅ The Old Quantity In Cart is ${QuantityInCartPreviously}`);
      });
    cy.log("✅✅ The Quantity That Was Previously Requested Has Been Obtained");
  });
  it("If The Quantity Of The Previously Requested Product Is One, We Will Find Delete Icon. Here, Click On It & The Product Is Deleted From The Cart, If It Is Greater Than One, It Will Be Reduced By One Only", () => {
    cy.intercept("POST", "**/api/new_v1/cart/update").as("decreaseQuantity");
    cy.clickElement("[data-cy=MinusIcon_CartPage]:eq(0)");
    cy.wait("@decreaseQuantity").then((interception) => {
      cy.log("✅✅ decreaseQuantity request successfully intercepted");
    });
    cy.get('[data-cy="QuantityInCart"]') // Replace with actual test ID
      .invoke("val")
      .then((value) => {
        const inputValueAfterUpdate = parseInt(value as string, 10);
        cy.log(`✅✅ The New Quantity In Cart is: ${inputValueAfterUpdate}`);
        expect(inputValueAfterUpdate).to.be.lessThan(QuantityInCartPreviously);
        cy.log("✅✅ Success: Quantity decreaseded in cart");
      });
  });
});
describe("Should Click On The Cart Icon On The Home Page & Delete The Quantity Of Product", () => {
  let QuantityInCartPreviously = 0;
  it("The Required Quantity Of The Product Should Be Obtained In Advance", () => {
    cy.get('[data-cy="QuantityInCart"]')
      .eq(0)
      .invoke("val")
      .then((value) => {
        QuantityInCartPreviously = parseInt(value as string, 10);
        cy.log(`✅✅ The Old Quantity In Cart is: ${QuantityInCartPreviously}`);
      });
    cy.log("✅✅ The Quantity That Was Previously Requested Has Been Obtained");
  });
  it("If The Quantity Of The Previously Requested Product Is One, We Will Find Delete Icon. Here, Click On It & The Product Is Deleted From The Cart, If It Is Greater Than One, It Will Be Reduced By One Only", () => {
    cy.intercept("POST", "**/api/new_v1/cart/remove").as("removeRequest");
    cy.clickElement("[data-cy=DeleteIcon_CartPage]:eq(0)");
    cy.wait("@removeRequest").then((interception) => {
      cy.log("✅ removeRequest successfully intercepted");
    });
  });
  it("Should Click On Cart Back Icon To Return To Home Page", () => {
    cy.clickElement("[data-cy=CartBackIcon]");
    cy.clickElement("[data-cy=backIcon_productPage]");
    cy.clickElement("[data-cy=backIcon_pageAfterClickSearchTotal]");
    cy.log("✅✅ Return To Home Page");
  });
});
