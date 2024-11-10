describe.only("Login Scenario Test", () => {
  it("Login Successful Attempt", () => {
    let count = 0;
    cy.intercept("**/login", () => {
      // we are not changing the request or response here
      // just counting the matched calls
      count += 1;
    });
    before(() => {
      cy.clearAllCookies();
      cy.visit("/");

      cy.get("#country").select("TR");
      cy.wait(5000);
    });
    cy.visit("/", {
      onBeforeLoad(win) {
        cy.stub(win.Notification, "requestPermission")
          .resolves("granted") // @ts-ignore
          .as("premission");
      },
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
    cy.wait(5000);
    cy.get("@premission")
      .should("have.been.called")
      .then((s) => {
        expect(count).to.be.greaterThan(0);
      });
    //
  });
});
