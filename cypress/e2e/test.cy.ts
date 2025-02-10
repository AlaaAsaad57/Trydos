describe("Navigations Test", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false;
    });
    cy.clearAllCookies();
    cy.Visit("/");
    cy.wait(10000);

    cy.wait(10000);
  });
  it("it should visit home page and navigate to listing/filter page correctly", () => {
    cy.wait(5000);
    cy.get(".offer-widget:first-child").click();
  });
});
