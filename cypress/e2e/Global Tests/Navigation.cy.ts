describe("Navigations Test", () => {
  beforeEach(() => {
    Cypress.config().chromeWebSecurity = false;
  });
  it("it should visit home page and navigate to listing/filter page correctly", () => {
    cy.visit("/tr-en");
    cy.get("a:first-child > .offer-container").invoke("href").as("BoutiqeUrl");
    cy.wait(3000);
    cy.url().as("WinUrl").should("contain", "@BoutiqeUrl");
  });
});
