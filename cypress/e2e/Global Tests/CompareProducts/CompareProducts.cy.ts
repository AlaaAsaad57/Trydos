describe("Should Open trydos and Open Product Detail Page", () => {
  before("Open trydos", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Open Boutique Page", () => {
    cy.clickElement(".offer-widget:eq(0)");
    cy.log("✅✅ An Boutique Selected & Click");
    cy.get("[data-cy=boutique_top_info]", { timeout: 20000 }).should(
      "be.visible"
    );
    cy.log("✅✅ The Boutique Page Opened");
    cy.interceptAndWait([
      {
        method: "POST",
        url: "**/boutiques/**",
        alias: "OpenBoutique",
      },
      {
        method: "GET",
        url: "**/api/products/searchInCatalog?boutique_slugs**",
        alias: "LoadallProducts",
      },
    ]);
    cy.log("✅✅ OpenBoutique & LoadallProducts Requests Arrived");
    //bg-green-300
  });
  it("Open Product Detail Page", () => {
    cy.intercept("Get", "**/product/likesCommentsSharesDetails/**").as(
      "getProductData2"
    );
    cy.clickElement("[data-cy=on_mouse_over_product]:eq(0)");
    cy.wait("@getProductData2").then((interception) => {
      expect(interception.response.statusCode).to.be.eq(200);
    });
  });
  it("Open More Option", () => {
    cy.intercept(
      "GET",
      "**/api/v1/firebase_device_tokens/my_firebase_settings"
    ).as("firebaseRequest");
    cy.clickElement("[data-cy=ThreePointsIcon]");
    cy.wait("@firebaseRequest").then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
    });
  });
});
describe("Should Add Product To Compare and Open Compare Page", () => {
  it("Add Product To Compare", () => {
    cy.get("[data-cy=add-compare]").then(($button) => {
      if ($button.hasClass("bg-green-300")) {
        cy.clickElement("[data-cy=ThreePointsIcon]");
        cy.intercept("GET", "**/api/v1/countries").as("getCountries");
        cy.clickElement("[data-cy=avatar-options]");
        cy.wait("@getCountries").then((interception) => {
          expect(interception.response.statusCode).to.be.eq(200);
        });
        cy.intercept("POST", "**/compare").as("compare");
        cy.clickElement("[data-cy=Compare-Icon]");
        cy.wait("@compare").then((interception) => {
          expect(interception.response.statusCode).to.be.eq(200);
        });
        cy.clickElement("[data-cy=end-compare]:eq(0)");
        cy.intercept(
          "GET",
          "**/api/v1/web/product/likesCommentsSharesDetails/**"
        ).as("loadProductDetail");
        cy.go(-1);
        cy.wait("@loadProductDetail", { timeout: 30000 }).then((inter) => {
          expect(inter.response.statusCode).to.be.eq(200);
          cy.log("✅✅ Load Product Detail Request Arrived");
        });
        cy.intercept(
          "GET",
          "**/api/v1/firebase_device_tokens/my_firebase_settings"
        ).as("firebaseRequest");
        cy.clickElement("[data-cy=ThreePointsIcon]");
        cy.wait("@firebaseRequest").then((interception) => {
          expect(interception.response.statusCode).to.eq(200);
        });
        cy.clickElement("[data-cy=add-compare]");
      } else {
        cy.clickElement("[data-cy=add-compare]");
      }
    });
  });
});
