describe.only("Login Scenario Test", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false;
    });
    cy.clearAllCookies();
    cy.Visit("/");

    cy.get("#country").select("TR");
    cy.wait(5000);
  });
  it("Login Successful Attempt should login to 3 servers", () => {
    let count = 0;
    cy.intercept("**/login", () => {
      // we are not changing the request or response here
      // just counting the matched calls
      count += 1;
    });

    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.viewport(783, 824);

    cy.wait(5000);
    cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    cy.wait(3000);
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
      expect(count).to.be.greaterThan(0);
    });
    //
  });
  it("Login UnSuccessful Attempt should show error message to user", () => {
    let count = 0;
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.intercept("**/login", () => {
      // we are not changing the request or response here
      // just counting the matched calls
      count += 1;
    });

    cy.clearAllCookies();

    cy.viewport(783, 824);

    cy.wait(5000);
    cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    cy.wait(3000);
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
      expect(count).to.be.equal(0);
    });
    //
  });
});
