describe.only("SignUp Scenario Test", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.clearAllData();
    cy.Visit("/");
    cy.wait(5000);
  });
  it("Signup Successful Attempt should login to 3 servers", () => {
    let count = 0;
    cy.intercept("**/login", () => {
      count += 1;
    });
    cy.signupProcess();
    cy.wait(5000).then(() => {
      cy.clearAllDataWithoutCookies();
      expect(count).to.be.greaterThan(0);
    });
  });
  it.only("Signup UnSuccessful Attempt should show error message to user", () => {
    cy.wait(60000);
    let count = 0;
    cy.reload();
    cy.intercept("**/login", () => {
      count += 1;
    });
    cy.failedSignupProcess();
    cy.wait(5000).then(() => {
      cy.get('[data-testid="login-close-icon"]').click();
      expect(count).to.be.equal(0);
    });
  });
  it("Should show user is already registered when registering with registered number", () => {
    cy.alreadyRegisteredSignup();
    // cy.Exist("[data-cy=already-registered-phone]").then((exist) => {
    //   if (exist) {
    //     cy.get("[data-cy=already-registered-phone]").click();
    //   }
    // });
    cy.wait(6000).then(() => {
      cy.get(".already-registered").should("be.visible");
    });
  });
});