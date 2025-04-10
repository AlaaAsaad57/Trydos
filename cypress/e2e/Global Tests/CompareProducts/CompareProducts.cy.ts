describe("Should Open Website and Open Product Detail Page", () => {
  before("Open Website", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Open Product Detail Page", () => {
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
        url: "**/api/products/search?&boutique_slugs**",
        alias: "LoadallProducts",
      },
    ]);
    cy.log("✅✅ OpenBoutique & LoadallProducts Requests Arrived");
    cy.clickElement("[data-cy=on_mouse_over_product]:eq(0)");
    cy.intercept(
      "GET",
      "**/api/new_v1/firebase_device_tokens/my_firebase_settings"
    ).as("firebaseRequest");
    cy.clickElement("[data-cy=ThreePointsIcon]");
    cy.wait("@firebaseRequest").then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
    });
    //bg-green-300
  });
});
describe("Should Add Product To Compare and Open Compare Page", () => {
  it("Add Product To Compare", () => {
    //bg-green-300
    cy.get("[data-cy=add-compare]").then(($button) => {
      if ($button.hasClass("bg-green-300")) {
        cy.clickElement("[data-cy=ThreePointsIcon]");
        cy.intercept("GET", "**/api/new_v1/countries").as("getCountries");
        cy.clickElement("[data-cy=Logout-ReLogout]");
        cy.wait("@getCountries").then((interception) => {
          expect(interception.response.statusCode).to.be.eq(200);
        });
        cy.intercept("POST", "**/compare").as("compare");
        cy.clickElement("[data-cy=Compare-Icon]");
        cy.wait("@compare").then((interception) => {
          expect(interception.response.statusCode).to.be.eq(200);
        });
        cy.clickElement("[data-cy=end-compare]");
      } else {
      }
    });
  });
});
