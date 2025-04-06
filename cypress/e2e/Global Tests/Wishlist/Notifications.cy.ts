describe("Notifications Tests", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });

  describe("When user is logged out", () => {
    it("Should logout if already logged in", () => {
      cy.ChexkExistElement("[data-cy=NavUserName]").then((exist) => {
        if (exist) {
          cy.logout();
        }
      });
    });

    it("should open notifications panel", () => {
      cy.openNotificationsWhenLogout();
    });

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
  });

  describe("When user is logged in", () => {
    it("Should login", () => {
      cy.performLogin();
    });

    it("should open notifications panel", () => {
      cy.openNotificationsWhenLogin();
    });

    it("Should verify user name appears", () => {
      cy.get("[data-cy=NavUserName]")
        .invoke("text")
        .then((text) => {
          expect(text).to.not.be.empty;
        });
    });

    it("should verify components and notifications appear", () => {
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
      cy.get("[data-cy=notification-body]").should("exist");
    });
  });
});
