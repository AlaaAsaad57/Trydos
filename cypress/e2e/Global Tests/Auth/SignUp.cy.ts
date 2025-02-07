describe("SignUp Scenario Test", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.clearAllData();
    cy.Visit("/");
    cy.wait(5000);
  });
  it("Signup Successful Attempt should login to 3 servers", () => {
    cy.signupProcess();
  });
  it("Signup UnSuccessful Attempt should show error message to user", () => {
    cy.failedSignupProcess();
  });
  it("Should show user is already registered when registering with registered number", () => {
    cy.alreadyRegisteredSignup();
  });
});
