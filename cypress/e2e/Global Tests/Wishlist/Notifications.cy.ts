describe("should open website and open wishlist", () => {
  before("should open website", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("Should Login Firstly", () => {
    cy.wait(3000);
    cy.ChexkExistElement("[data-cy=NavUserName]").then((exist) => {
      if (exist) {
        cy.get("[data-cy=NavUserName]")
          .invoke("text")
          .then((text) => {
            // Remove all spaces from the extracted text
            const trimmedText = text.replace(/\s+/g, "");
            cy.log(`${trimmedText}`);

            // Compare the trimmed text with "Abdo Hamdan" without spaces
            if (trimmedText !== "AbdoHamdan") {
              cy.logout();
              cy.performLogin();
            } else {
              cy.log("✅✅ The user you want is logged in");
            }
          });
      } else {
        cy.performLogin();
      }
    });
  });
  it("should open wishlist", () => {
    cy.openNotifications();
  });
});
