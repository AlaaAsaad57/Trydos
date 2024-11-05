describe("Navigations Test", () => {
  it("it should visit home page and navigate to listing/filter page correctly", () => {
    cy.visit("/tr-en");
    cy.wait(5000);
    cy.get(".offer-widget:first-child")
      .invoke("attr", "href")
      .then((href) => {
        const link = href;
        cy.get(".offer-widget:first-child").click();

        cy.log(link);
        cy.url().should("contain", link);
      });
  });
  it("should go back to homepage", () => {
    cy.get(".back-icon").click();
  });
});
