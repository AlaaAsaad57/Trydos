let CartLrLength1: number = 0;
describe("Should Open The Website & Logout", () => {
  before("Visit The Site", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit1("/");
  });
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.wait(3000);
    cy.logout();
    cy.viewport(783, 824);
  });
  it("Should Add To Cart", () => {
    cy.AddProductToCart();
  });
});
describe("Should Cart Page &Confirm Order Operation", () => {
  it("Should Click On Cart Icon & Open Cart Page", () => {
    cy.get("[data-cy=boutiques]", { timeout: 15000 });
    cy.clickElementForce("[data-cy=cartIcon_mainPage]");
    cy.log("✅✅ Click On Cart Icon In Main Page & Open Cart Page");
  });
  it("Should Click On Confirm & Countinue Button", () => {
    cy.clickElementForce("[data-cy=Confirm-Order-Button]");
    cy.log("✅✅ Confirm & Countinue Button Clicked");
  });
});
describe("should Login If User Is Not Verified", () => {
  it("Should Apperead Box To Verified The Way To Send Otp Code", () => {
    cy.Exist("[data-cy=FieldToInputNumber]").then((exist) => {
      if (exist) {
        cy.enterPhoneNumber1("963937764641");
        cy.log("✅✅ Number Phone Entered Successfuly");
      }
    });
  });
  it("Should Apperead Box To Verified The Way To Send Otp Code", () => {
    cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
    cy.get(".message-recieve-option:nth-child(2)").click({
      scrollBehavior: false,
    });
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS", () => {
    cy.typePincode("999999");
    cy.log("✅✅ Type Pin Code Entred Successfuly");
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

describe("Compare Quantity", () => {
  it("Should Extract The Number Of Items That Confirm To Buy It", () => {
    cy.get('[data-cy="Number-Of-Products-Required"]')
      .invoke("text")
      .then((text) => {
        const match = text.match(/^(\d+)\s+items/); // Match number before "items"
        if (match) {
          const cartLength = parseInt(match[1], 10); // Convert extracted value to integer
          cy.log("✅✅ Extracted Cart Length:", cartLength);
          expect(cartLength).to.be.a("number");
          CartLrLength1 = cartLength;
        } else {
          throw new Error("Could not extract cart length");
        }
      });
  });
  it("Should Extract The Number Of Items in Shopping Bag", () => {
    cy.get('[data-cy="Count-Of-Shiping"]')
      .invoke("text")
      .then((text) => {
        cy.log("✅✅ Extracted Text:", text); // Log the text to debug
        const match = text.match(/(\d+)\s*\w*/); // Extract first number
        if (match) {
          const itemCount = parseInt(match[1], 10); // Convert extracted value to integer
          cy.log("✅✅Extracted Item Count:", itemCount);
          expect(itemCount).to.be.a("number");
          expect(itemCount).to.be.eq(CartLrLength1);
          cy.log("✅✅ Matxhed"); // Log the text to debug
        } else {
          throw new Error("Could not extract item count from: " + text);
        }
      });
  });
});
describe("Should Add Address", () => {
  it("Should Click On Add Address Button", () => {
    cy.clickElementForce("[data-cy=AddAddres]");
    cy.log("✅✅ Add Addres Button Clicked");
  });
  it("Should Fill All Input Field To Complate Add Address Operation", () => {});
});
