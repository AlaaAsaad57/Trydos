describe("Should visit the home page and add a product to the cart from the boutique page and pass through it to the cart page", () => {
  before("Visit the home page", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should change the url", () => {});
  it("Should add a product to the cart from the boutique page and pass through it to the cart page", () => {
    cy.AddProductToCartThenComplateOrder();
  });
});
