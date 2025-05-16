describe("4-1 Should Open home page", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
    cy.url().then((url) => {
      if (url === "http://localhost:3000/tr-en") {
        cy.visit("/sy-en");
        cy.clickElement("[data-cy=countain-with]:eq(0)");
      } else {
        cy.visit("/tr-en");
        cy.clickElement("[data-cy=countain-with]:eq(0)");
      }
    });
  });
  it("should open home page", () => {
    cy.log("Home page is open");
  });
});
describe("4-2 should navigate to category`s Boutiques page", () => {
  it("Should Navigation Between Category Icons", () => {
    cy.get("[data-cy=category-Link]").first().click({ force: true });
    cy.wait(3000);
    cy.get("[data-cy=category-Link]").first().click({ force: true });
  });
});
describe("4-3 should navigate to Boutique/product Page", () => {
  it("should click on first boutique", () => {
    cy.get("[data-cy=boutique_link]").first().click({ force: true });
    cy.wait(3000);
  });
  it("should click on first product then go back to boutique page", () => {
    cy.get("[data-cy=product-link]").first().click({ force: true });
    cy.wait(3000);
    cy.get("[data-cy=backIcon_productPage]").click({ force: true });
    cy.wait(3000);
  });
  it("should go back to home page", () => {
    cy.get('[data-cy="BackIcon_boutique"]').click();
    cy.wait(3000);
  });
  it("should go to featured product and go back", () => {
    cy.get('[data-cy="featured_product_link"]').first().click({ force: true });
    cy.wait(3000);
    cy.get("[data-cy=backIcon_productPage]").click({ force: true });
    cy.wait(3000);
  });
});
