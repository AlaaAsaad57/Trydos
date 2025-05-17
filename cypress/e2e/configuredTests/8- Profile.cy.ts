describe("8-1 should login and visit profile page", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.wait(3000);
    cy.logout();
    cy.viewport(783, 824);
  });
  it("should Login If User Is Not Verified", () => {
    cy.performLogin();
  });
  it("should visit profile page", () => {
    cy.get("[data-cy=avatar-options]").click({
      force: true,
      scrollBehavior: false,
    });
    cy.get('[data-cy="Settings-Icon"]').click({ force: true });
    cy.get('[data-cy="profile-card"]');
  });
});
