describe("open cart and view products", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false;
    });
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.Visit("/");
    cy.wait(5000);
    cy.get("#country").select("TR");
    cy.wait(5000);
  });
  it("should open cart when click on cart icon and close it corrcetly", function () {
    cy.get(".cart-icon-selector").click({ scrollBehavior: false });
    cy.get(".back-icon").click({ scrollBehavior: false });
  });
  it("should add product to cart from any boutique page", () => {
    let productName;
    cy.get(".offer-widget:first-child").click({ scrollBehavior: false });
    cy.wait(5000);
    cy.get(
      ":nth-child(1) > .product-container .product-body .product-details"
    ).then(($div) => {
      productName = $div.text();
    });
    cy.get(
      ":nth-child(1) > .product-container .product-footer .buy-button"
    ).click({ scrollBehavior: false });
    cy.wait(5000);
    cy.get(".add-cart-button").click({ scrollBehavior: false });
    cy.get(".add-cart-button").click({ scrollBehavior: false });
    cy.wait(5000);
    cy.get(".back-icon").click({ scrollBehavior: false });
    cy.get(".cart-icon-selector").click({ scrollBehavior: false });
  });
});
