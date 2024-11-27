describe.only("SignUp Scenario Test", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false;
    });
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.Visit("/");

    cy.get("#country").select("TR");
    cy.wait(5000);
  });
  it("Signup Successful Attempt should login to 3 servers", () => {
    let count = 0;
    cy.intercept("**/login", () => {
      // we are not changing the request or response here
      // just counting the matched calls
      count += 1;
    });
    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        // Modify the response body
        res.body.data.already_exists = false;
      });
    }).as("verifyOtpSignin");
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.viewport(783, 824);
    cy.wait(5000);
    cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    cy.wait(3000);
    cy.get(".login-button:nth-child(2)").click({ scrollBehavior: false });
    cy.get(".agree-terms").click({ scrollBehavior: false });

    // cy.get(".login-method-phone > .border-button").click();
    cy.get("#phoneInput").click({ scrollBehavior: false });
    cy.get("#phoneInput").type("963937288307{enter}", {
      scrollBehavior: false,
    });
    cy.get(".phone-arrow").click({ scrollBehavior: false });
    cy.get(".message-recieve-option:nth-child(1)").click({
      scrollBehavior: false,
    });
    cy.wait(5000);
    cy.get(".pincode-input-text:nth-child(1)").type("9", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(2)").type("9", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(3)").type("9", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(4)").type("9", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(5)").type("9", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(6)").type("9", {
      scrollBehavior: false,
    });
    cy.wait(5000).then(() => {
      cy.clearAllLocalStorage();
      cy.clearAllSessionStorage();
      expect(count).to.be.greaterThan(0);
    });
    //
  });
  it("Signup UnSuccessful Attempt should show error message to user", () => {
    cy.wait(60000);
    let count = 0;
    cy.reload();
    cy.intercept("**/login", () => {
      // we are not changing the request or response here
      // just counting the matched calls
      count += 1;
    });
    cy.viewport(783, 824);
    cy.wait(5000);
    cy.Exist(".en-regular:nth-child(2)").then((exists) => {
      if (exists) {
        cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
      } else {
        cy.clearAllLocalStorage();
        cy.clearAllCookies();
        cy.reload();
        cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
      }
    });

    cy.wait(8000);
    cy.get(".login-button:nth-child(2)").click({ scrollBehavior: false });
    cy.get(".agree-terms").click({ scrollBehavior: false });
    // cy.get(".login-method-phone > .border-button").click();
    cy.get("#phoneInput").click({ scrollBehavior: false });
    cy.get("#phoneInput").type("963937288307{enter}", {
      scrollBehavior: false,
    });
    cy.get(".phone-arrow").click({ scrollBehavior: false });
    cy.get(".message-recieve-option:nth-child(1)").click({
      scrollBehavior: false,
    });
    cy.wait(5000);
    cy.get(".pincode-input-text:nth-child(1)").type("4", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(2)").type("9", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(3)").type("9", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(4)").type("9", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(5)").type("9", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(6)").type("9", {
      scrollBehavior: false,
    });

    cy.get(".input-failed", { timeout: 10000 }).should("be.visible");
    cy.wait(5000).then(() => {
      cy.get('[data-testid="login-close-icon"]').click();
      expect(count).to.be.equal(0);
    });
    //
  });

  it.only("Should show user is already registered when registering with registered number", () => {
    let count = 0;

    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.viewport(783, 824);
    cy.wait(10000);

    cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
      req.continue((res) => {
        // Modify the response body
        res.body.data.already_exists = true;
      });
    }).as("verifyOtpSignin");

    cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    cy.wait(8000);
    cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false });

    // cy.get(".login-method-phone > .border-button").click();
    cy.get("#phoneInput").click({ scrollBehavior: false });
    cy.get("#phoneInput").type("963937288307{enter}", {
      scrollBehavior: false,
    });
    cy.get(".phone-arrow").click({ scrollBehavior: false });
    cy.get(".message-recieve-option:nth-child(1)").click({
      scrollBehavior: false,
    });
    cy.wait(6000);
    cy.get(".pincode-input-text:nth-child(1)").type("9", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(2)").type("9", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(3)").type("9", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(4)").type("9", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(5)").type("9", {
      scrollBehavior: false,
    });
    cy.get(".pincode-input-text:nth-child(6)").type("9", {
      scrollBehavior: false,
    });
    cy.wait("@verifyOtpSignin", { timeout: 20000 }).then((s) => {
      console.log(s);
    });
    cy.wait(6000);

    cy.wait(5000).then(() => {
      cy.get(".already-registered").should("be.visible");
    });
  });
});
