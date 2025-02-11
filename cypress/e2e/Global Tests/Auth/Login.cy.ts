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
    let count = 0;
    cy.intercept("POST", "**/login", () => {
      count += 1;
    }).as("login");

    cy.wait(5000);
    cy.performLogin();
    cy.wait(20000);
    cy.wait("@login").then((interception) => {
      cy.log("✅ login request arrived");
      console.log("login request arrived");
    });
    cy.wait(5000).then(() => {
      cy.clearAllDataWithoutCookies();
      cy.log(`Count is: ${count}`);
      console.log("Count is" + count);
      expect(count).to.be.greaterThan(1);
    });
  });
  it("Login UnSuccessful Attempt should show error message to user", () => {
    cy.wait(10000);
    let count = 0;
    cy.reload();
    cy.intercept("POST", "**/login", () => {
      count += 1;
    }).as("login1");
    cy.performErrorLogin();
    // cy.wait(20000);
    cy.wait(10000).then(() => {
      cy.Exist("[data-testid=login-close-icon]").then((exist) => {
        if (exist) {
          cy.get("[data-testid=login-close-icon]").click({
            scrollBehavior: false,
          });
          expect(count).to.be.equal(0);
        }
      });
    });
  });
  it("Login UnSuccessful Attempt when otp code expired should show button for resend otp and resend code and continue to login", () => {
    cy.wait(10000);
    let count = 0;
    cy.clearAllDataWithoutCookies();
    cy.intercept("POST", "**/login", () => {
      count += 1;
    }).as("login2");
    cy.wait(10000);
    cy.performExpireOtpLogin();
  });
  it("Should show user not found when registering with non registered number", () => {
    cy.wait(10000);
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        // Modify the response body
        res.body.data.already_exists = false; // Fake email field
      });
    }).as("verifyOtpSignin");
    cy.Performloginfailure();
  });
});
