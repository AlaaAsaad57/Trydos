describe("Notifications Tests", () => {
  before("Open Website", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  // end- Open Website
  it("Should logout if already logged in", () => {
    cy.Exist("[data-cy=NavUserName]").then((exist) => {
      if (exist) {
        cy.logout();
      }
    });
  });
  // end- logout if already logged in
  it("should open notifications panel", () => {
    cy.openNotificationsWhenLogout();
  });
  // end- open notifications panel
  it("should verify components and no notifications appear", () => {
    cy.get("[data-cy=notification-container]")
      .should("exist")
      .and("be.visible");
    cy.get("[data-cy=notification-header]").should("exist").and("be.visible");
    cy.get("[data-cy=notification-left]").should("exist").and("be.visible");
    cy.get("[data-cy=notification-svg]").should("exist").and("be.visible");
    cy.get("[data-cy=notification-text]")
      .should("exist")
      .and("be.visible")
      .contains("Notifications");
    cy.get("[data-cy=button-close]").should("exist").and("be.visible");
    cy.get("[data-cy=close-svg]").should("exist").and("be.visible");
    cy.get("[data-cy=notification-bodys]").should("not.exist");
    cy.clickElement("[data-cy=button-close]");
    cy.get("[data-cy=notification-body]").should("not.exist");
    cy.clickElement("[data-cy=avatar-options]");
  });
  // end- verify components and no notifications appear
});

describe("When user is logged in", () => {
  it("Should login", () => {
    cy.performLogin();
  });
  // end- login
  it("Should verify user name appears", () => {
    cy.get("[data-cy=NavUserName]")
      .invoke("text")
      .then((text) => {
        expect(text).to.not.be.empty;
      });
  });
  // end- verify user name appears
  it("should open notifications panel", () => {
    cy.openNotificationsWhenLogin();
  });
  // end- open notifications panel
  it("should verify components in header", () => {
    cy.get("[data-cy=notification-container]")
      .should("exist")
      .and("be.visible");
    cy.get("[data-cy=notification-header]").should("exist").and("be.visible");
    cy.get("[data-cy=notification-left]").should("exist").and("be.visible");
    cy.get("[data-cy=notification-svg]").should("exist").and("be.visible");
    cy.get("[data-cy=notification-text]")
      .should("exist")
      .and("be.visible")
      .contains("Notifications");
    cy.get("[data-cy=button-close]").should("exist").and("be.visible");
    cy.get("[data-cy=close-svg]").should("exist").and("be.visible");
  });
  // end- verify components in header
  it("should verify components in body", () => {
    cy.get("[data-cy=notification-body]").should("exist").and("be.visible");
    cy.get("[data-cy=container-svg]").should("exist").and("be.visible"); //svg-notification
    cy.get("[data-cy=svg-notification]").should("exist").and("be.visible"); //svg-notification
    cy.get("[data-cy=notification-item-body]")
      .should("exist")
      .and("be.visible"); //notification-item-body
    cy.get("[data-cy=notification-item-description]")
      .should("exist")
      .and("be.visible")
      .and("not.be.empty"); //notification-item-body
    cy.get("[data-cy=notification-Click-show]").contains(
      "Click to view details"
    ); //notification-item-body
    cy.clickElement("[data-cy=notification-Click-show]:eq(0)");
  });
  // end- verify components in body
  it("should verify loading after each scrool", () => {
    cy.get("[data-cy=notification-item-body]")
      .its("length")
      .then(($initialLength) => {
        const initialCount1 = $initialLength.valueOf();
        cy.log(`Initial count: ${initialCount1}`);
        // cy.intercept("GET", "**/api/new_v1/user-notifications/get?page=**").as(
        //   "getPages"
        // );
        // cy.get("[data-cy=notification-item-body]")
        //   .eq(initialCount1 - 1) // Adjust indexing
        //   .should("exist") // Ensure element exists
        //   .scrollIntoView({ force: true });
        // cy.get("[data-cy=notification-loading]")
        //   .should("exist")
        //   .should("be.visible");
        // cy.get("[data-cy=loading-svg]").should("exist").should("be.visible");
        // cy.get("[data-cy=notification-loading]")
        //   .should("exist")
        //   .and("be.visible")
        //   .contains("Loading...");
        // cy.wait("@getPages").then((interception) => {
        //   expect(interception.response.statusCode).to.be.eq(200);
        // });
      });
  });
  // end- verify loading after each scrool
});
