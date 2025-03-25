describe("Should visit the home page and add a product to the cart from the boutique page and pass through it to the cart page", () => {
  before("Visit the home page", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/sy-en");
  });
  it("Should change the url if it matches the condition", () => {
    cy.get("[data-cy=Change-Url-Container]", { timeout: 30000 }).should(
      "be.visible"
    );
    cy.clickElement("[data-cy=countain-with]:eq(0)");
  });
  it("should verify the user is login", () => {
    cy.ChexkExistElement("[data-cy=NavUserName]").then((exist) => {
      if (!exist) {
        cy.log("❌❌ Should Do login");
        cy.performLogin();
      } else {
        cy.get("[data-cy=NavUserName]")
          .invoke("text")
          .then((text) => {
            cy.log(`${text}`);
            if (text != "Abdo Hamdan") {
              cy.logout();
              cy.performLogin();
            } else {
              cy.log("✅✅ The user you want he is login");
            }
          });
      }
    });
  });
  it("Should add a product to the cart from the boutique page and pass through it to the cart page", () => {
    cy.ComplateAddProductOperationAndGoCartPage();
  });
});
describe("Should Confirm Order Operation", () => {
  it("Should Click On Confirm & Countinue Button", () => {
    cy.ConfirmAndComplateOrderButton();
  });
});
describe("Should Chheck if address added last & add if not found", () => {
  it("Chheck if address added last", () => {
    cy.ChexkExistElement("[data-cy=Address-Added-Last]").then((exist) => {
      if (!exist) {
        cy.clickElement("[data-cy=AddAddres]");
        cy.log("✅✅ Add Addres Button Clicked");
        cy.AddAdress();
      } else {
        cy.log("✅✅ Address Added Last");
      }
    });
  });
});
describe("Should Choose The way for payment", () => {
  it("Should Choose The way for payment", () => {
    cy.clickElement("[data-cy=Cach-on-delivery]");
    cy.clickElement("[data-cy=Confirm-shipping-and-payment]");
  });
  it("should verify the payment container is visible", () => {
    cy.get('[data-cy="Payment-Container-Cart-Page"]').should("be.visible");
  });
  it("should verify the payment SVG icon is visible", () => {
    cy.get('[data-cy="svg-payment"]').should("be.visible");
  });
  it("should verify the payment method statement is correct", () => {
    cy.get('[data-cy="Payment-Method-Statement"]')
      .should("be.visible")
      .and("contain.text", "Payment Method"); // Modify as needed
  });
  it("should verify the Cash on Delivery section is visible", () => {
    cy.get('[data-cy="cachondelivry-cartpage"]').should("be.visible");
  });
  it("should verify the Cash on Delivery text is correct", () => {
    cy.get('[data-cy="cachondelivry-cartpage"] span')
      .first()
      .should("contain.text", "Cash On Delivery");
  });
  it("should verify the total amount is displayed correctly", () => {
    cy.get('[data-cy="cachondelivry-cartpage"] span')
      .last()
      .should("not.be.empty");
  });
  it("should verify the Read and Agree checkbox is present and clickable", () => {
    cy.get('[data-cy="read-and-agree"]').should("be.visible").click();
  });
  it("should verify the Place Order button is visible and clickable", () => {
    cy.get("div").contains("Place Order").should("be.visible").click();
  });
});
describe("Order Success Page", () => {
  it("should verify the order completion text appears after placing order", () => {
    cy.get("div", { timeout: 15000 }).contains("Done").should("be.visible");
  });
  it("should display the success message when order is completed", () => {
    cy.get('[data-cy="The-Purchas"]').should("be.visible");
    cy.get('[data-cy="The-Purchas"] span')
      .contains("The Purchase Was Completed Successfully")
      .should("be.visible");
  });
  it("should display the order number", () => {
    cy.get('[data-cy="The-Purchas"]').should("be.visible").and("not.be.empty");
  });
  it("should display the order invoice option", () => {
    cy.get('[data-cy="The-Purchas"]')
      .contains("Order Invoice")
      .should("be.visible");
  });
});
