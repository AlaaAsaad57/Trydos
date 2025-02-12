describe("Login Scenario Test", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });

    cy.Visit("/");
    cy.wait(5000);
    cy.clearAllData();
  });
  it("Login Successful Attempt should login to 3 servers", () => {
    cy.performLogin();
  });
  it("Login UnSuccessful Attempt should show error message to user", () => {
    cy.performErrorLogin();
  });
  it("Login UnSuccessful Attempt when otp code expired should show button for resend otp and resend code and continue to login", () => {
    cy.performExpireOtpLogin();
  });
  it("Should show user not found when registering with non registered number", () => {
    cy.Performloginfailure();
  });
});
