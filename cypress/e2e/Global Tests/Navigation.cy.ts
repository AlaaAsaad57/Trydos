describe("Navigations Test", () => {
  it("it should visit home page and navigate to listing/filter page correctly", () => {
    cy.visit("/tr-en");
    cy.wait(5000);
    cy.get(".offer-widget:first-child")
      .invoke("attr", "href")
      .then((href) => {
        const link = href;
        cy.get(".offer-widget:first-child").click();

        cy.url().should("contain", link);
      });
  });
  it("should go back to homepage from listing when click on Back Icon", () => {
    cy.visit("/tr-en");
    cy.wait(5000);
    cy.get(".offer-widget:first-child").click();
    cy.get(".back-icon").click();
  });
  it("should go back to listing from product page when click on Back Icon", () => {
    cy.visit("/tr-en");
    cy.wait(5000);
    cy.get(".offer-widget:first-child").click();
    cy.wait(6000);
    cy.get(":nth-child(1) > .product-container").eq(0).click();
    cy.wait(6000);
    cy.get(".back-icon").click({ force: true });
  });
  it("should filter boutiques by categories when click on categories nav item and reset filter when click on it again", () => {
    cy.visit("/tr-en");
    cy.wait(5000);
    cy.get(".home-navbar > .categories-bar-container > a")
      .eq(0)
      .invoke("attr", "href")
      .then((href) => {
        cy.get(".home-navbar > .categories-bar-container > a").eq(0).click();
        cy.wait(6000);
        cy.url().should("contain", href);
        cy.get(".home-navbar > .categories-bar-container > a").eq(0).click();
        cy.wait(5000);
        cy.url().should("not.contain", href);
      });
  });
});
