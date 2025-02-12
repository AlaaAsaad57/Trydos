describe("Login Scenario Test", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Login Successful Attempt should login to 3 servers", () => {
    cy.wait(3000);
    cy.logout();
    cy.performLogin();
  });
  it.skip("Login UnSuccessful Attempt should show error message to user", () => {
    cy.wait(3000);
    cy.logout();
    cy.performErrorLogin();
  });
  it.skip("Login UnSuccessful Attempt when otp code expired should show button for resend otp and resend code and continue to login", () => {
    cy.wait(3000);
    cy.logout();
    cy.performExpireOtpLogin();
  });
  it.skip("Should show user not found when registering with non registered number", () => {
    cy.Performloginfailure();
  });
});
