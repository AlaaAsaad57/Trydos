describe("Should Open The Website & Logout", () => {
  before("Visit The Site", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
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
    cy.Exist1("[data-cy=FieldToInputNumber]").then((exist) => {
      if (exist) {
        cy.enterPhoneNumber1("963937764641");
        cy.log("✅✅ Number Phone Entered Successfuly");
        cy.log("✅✅ The User IS Not Verified LogIn Previously");
        cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
        cy.get(".message-recieve-option:nth-child(2)").click({
          scrollBehavior: false,
        });
        cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
        cy.wait("@sendOtpApi");
        cy.log("✅✅ Send Otp Api Request Successfuly");
      }
    });
  });
  it("Should Verify If Have To Try Again To Send Otp Code", () => {
    cy.Exist("[data-cy=WaitForTryAgain]").then((exist) => {
      if (exist) {
        cy.wait(60000);
        cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
        cy.get(".message-recieve-option:nth-child(2)").click({
          scrollBehavior: false,
        });
        cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
        cy.wait("@sendOtpApi");
        cy.log("✅✅ Send Otp Api Request Successfuly");
      }
    });
  });
  it("Should Enter The 6-digit OTP Code That He Received On SMS", () => {
    cy.typePincode("999999");
    cy.log("✅✅ Type Pin Code Entred Successfuly");
  });
});
