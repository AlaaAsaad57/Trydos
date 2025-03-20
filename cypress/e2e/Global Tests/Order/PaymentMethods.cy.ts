describe("Should visit the home page and add a product to the cart from the boutique page and pass through it to the cart page", () => {
  before("Visit the home page", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
  });
  it("should verify the user is login", () => {
    cy.Exist1("[data-cy=NavUserName]").then((exist) => {
      if (!exist) {
        cy.performLogin1();
      } else {
        cy.get("[data-cy=NavUserName]")
          .invoke("text")
          .then((text) => {
            if (text != "Abdo Hamdan") {
              cy.logout();
              cy.performLogin1();
            } else {
              cy.log("✅✅ The user you want he is login");
            }
          });
      }
    });
  });
  it("Should change the url if it matches the condition", () => {
    cy.url().then((currentUrl) => {
      if (currentUrl === "http://localhost:3000/tr-en") {
        cy.visit("http://localhost:3000/sy-en"); // Change URL
        cy.get("[data-cy=Change-Url-Container]", { timeout: 10000 }).should(
          "be.visible"
        );
        cy.clickElementForce("[data-cy=countain-with]");
      }
    });
  });
  it("Should add a product to the cart from the boutique page and pass through it to the cart page", () => {
    cy.AddProductToCartThenComplateOrder();
  });
});
describe("Should Confirm Order Operation", () => {
  it("Should Click On Confirm & Countinue Button", () => {
    cy.clickElementForce("[data-cy=Confirm-Order-Button]");
    cy.log("✅✅ Confirm & Countinue Button Clicked");
  });
  it("Should Arrived Dual Request", () => {
    cy.interceptAndWait([
      {
        method: "GET",
        url: "**/api/new_v1/customer/address/list",
        alias: "ListRequest",
      },
      {
        method: "GET",
        url: "**/api/new_v1/cart/cart_shipping",
        alias: "CartShiping",
      },
    ]);
    cy.log("✅✅ CartShiping & ListRequest Requests Arrived");
  });
});
describe("Should Chheck if address added last & add if not found", () => {
  it("Chheck if address added last", () => {
    cy.Exist("[data-cy=Address-Added-Last]").then((exist) => {
      if (!exist) {
        cy.clickElementForce("[data-cy=AddAddres]");
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
    cy.clickElementForce("[data-cy=Cach-on-delivery]");
    cy.clickElementForce("[data-cy=Confirm-shipping-and-payment]");
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
  // it("should include InfoOrder component", () => {
  //   cy.get('[data-cy="The-Purchas"]').find("InfoOrder").should("exist");
  // });
});
