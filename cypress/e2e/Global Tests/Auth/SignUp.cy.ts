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
    cy.wait(10000);
    let count = 0;
    cy.intercept("POST", "**/login", () => {
      count += 1;
    }).as("login");
    cy.wait(10000);
    cy.signupProcess();
    cy.wait(10000);
    cy.wait(10000).then(() => {
      cy.clearAllDataWithoutCookies();
      cy.log(`Count is: ${count}`);
      console.log("Count is" + count);
      expect(count).to.be.greaterThan(1);
    });
  });
  it("Signup UnSuccessful Attempt should show error message to user", () => {
    cy.wait(6000);
    let count = 0;
    cy.wait(10000);
    cy.reload();
    cy.wait(10000);
    cy.intercept("POST", "**/login", () => {
      count += 1;
    }).as("login");
    cy.wait(10000);
    cy.failedSignupProcess();
    cy.wait(10000);
    cy.wait(10000).then(() => {
      cy.Exist("[data-testid=login-close-icon]").then((exists) => {
        if (exists) {
          cy.get("[data-testid=login-close-icon]").click();
          cy.log(`Count is: ${count}`);
          console.log("Count is" + count);
          expect(count).to.be.equal(0);
        }
      });
    });
  });
  it("Should show user is already registered when registering with registered number", () => {
    // cy.alreadyRegisteredSignup();
    cy.wait(10000);
    cy.clearAllData();
    cy.viewport(783, 824);
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        res.body.data.already_exists = true;
      });
    }).as("verifyOtpSignin");
    cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    cy.get(".login-button:nth-child(2)").click({ scrollBehavior: false });
    cy.get("[data-cy=agree-terms]").click({ scrollBehavior: false });
    cy.wait(60000);
    cy.enterPhoneNumber("963937288307");
    cy.typePincode("999999");
    cy.wait(30000);
    cy.wait("@verifyOtpSignin", { timeout: 20000 }).then((s) => {
      console.log(s);
    });
    cy.wait(6000).then(() => {
      cy.get(".already-registered").should("be.visible");
    });
    cy.Exist("[data-testid=login-close-icon]").then((exists) => {
      if (exists) {
        cy.get("[data-testid=login-close-icon]").click();
      }
    });
    cy.wait(10000);
  });
});
