describe("Login Scenario Test", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.clearAllData();
    cy.Visit("/");
    cy.wait(5000);
  });
  it("Login Successful Attempt should login to 3 servers", () => {
    let count = 0;
    cy.intercept("**/login", () => {
      count += 1;
    });
    cy.performLogin();
    cy.wait(5000).then(() => {
      cy.clearAllDataWithoutCookies();
      expect(count).to.be.greaterThan(1);
    });
  });
  it("Login UnSuccessful Attempt should show error message to user", () => {
    cy.wait(60000);
    let count = 0;
    cy.reload();
    cy.intercept("**/login", () => {
      count += 1;
    });
    cy.performErrorLogin();
    cy.wait(5000).then(() => {
      cy.get('[data-testid="login-close-icon"]').click({
        scrollBehavior: false,
      });
      expect(count).to.be.equal(0);
    });
  });
  it("Login UnSuccessful Attempt when otp code expired should show button for resend otp and resend code and continue to login", () => {
    let count = 0;
    cy.clearAllDataWithoutCookies();
    cy.intercept("**/login", () => {
      count += 1;
    });
    cy.performExpireOtpLogin();
  });
  it("Should show user not found when registering with non registered number", () => {
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        // Modify the response body
        res.body.data.already_exists = false; // Fake email field
      });
    }).as("verifyOtpSignin");
    cy.Performloginfailure();
  });
});
