let CartLrLength1: number = 0;
let CountItem1: number = 0;
describe("Should Open The Website & Logout", () => {
  before("Visit The Site", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/");
    cy.interceptAndWait([
      {
        method: "GET",
        url: "**/api/v1/stories/users_stories",
        alias: "users_stories",
      },
      {
        method: "GET",
        url: "**/api/products/popular-search",
        alias: "popular-search",
      },
    ]);
    cy.log("✅✅ users_stories & popular-search Requests Arrived");
  });

  it("Should change the url if it matches the condition", () => {
    cy.url().then((currentUrl) => {
      if (currentUrl === "http://localhost:3000/tr-en") {
        cy.visit("http://localhost:3000/sy-en"); // Change URL
        cy.get("[data-cy=Change-Url-Container]", { timeout: 10000 }).should(
          "be.visible"
        );
        cy.clickElement("[data-cy=countain-with]");
      }
    });
  });
  it("Should Ensure The User Has Not LogIn Previously", () => {
    cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  });
  it("Should Add To Cart", () => {
    cy.ComplateAddProductOperationAndGoCartPage();
  });
});
describe("Should Cart Page &Confirm Order Operation", () => {
  it("Should Click On Confirm & Countinue Button", () => {
    cy.ConfirmAndComplateOrderButton();
  });
});
describe("should Login If User Is Not Verified", () => {
  it("Should Enter Phone Number", () => {
    cy.ChexkExistElement("[data-cy=FieldToInputNumber]").then((existing) => {
      if (existing) {
        cy.enterPhoneNumber("963937764641");
      } else {
        cy.log("✅✅ The Number Verified Last");
      }
    });
  });
  it("Should Select Way To Send Otp Code", () => {
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
  });
  it("Should Enter OTP Code & Arrived Dual Request", () => {
    cy.typePincode("999999");
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
describe("Compare Quantity Founded In Order With Quantity Required", () => {
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
  it("Should Extract Number Of Items in Shopping Bag", () => {
    cy.get('[data-cy="Count-Of-Shiping"]')
      .invoke("text")
      .then((text) => {
        cy.log("✅✅ Extracted Text:", text); // Log the text to debug
        const match = text.match(/(\d+)\s*\w*/); // Extract first number
        if (match) {
          const itemCount = parseInt(match[1], 10); // Convert extracted value to integer
          CountItem1 = itemCount;
          cy.log("✅✅Extracted Item Count:", itemCount);
          expect(itemCount).to.be.a("number");
          expect(itemCount).to.be.eq(CartLrLength1);
          cy.log("✅✅ Matxhed"); // Log the text to debug
        } else {
          throw new Error("Could not extract item count from: " + text);
        }
      });
  });
  // *********************************************
  it("Should Check Other Components", () => {
    cy.get("[data-cy=Order-Cart-Icon]", { timeout: 15000 }).should("exist");
    cy.log("✅✅ Order Cart Icon Exists");

    cy.get(".regular")
      .should("contain.text", "Your Shopping Bag")
      .should("exist");
    cy.log("✅✅ The Text Exists");

    cy.get("[data-cy=DropDownIcon]").click({ force: true });
    cy.log("✅✅ Drop Down Icon Click");

    cy.get("[data-cy=Item]")
      .its("length")
      .then((count) => {
        cy.log(`✅✅ The Count Of Item Required Is: ${count}`);
        expect(count).to.be.eq(CountItem1);
      });
  });
});
describe("Shipping & Delivery Address Component", () => {
  it("Should Verify Shipping & Delivery Address Title", () => {
    cy.get("[data-cy=TitleInOrderPage]", { timeout: 10000 })
      .should("be.visible")
      .should("contain.text", "Bag Shipping & Delivery Address");
    cy.log("✅✅ Title 'Bag Shipping & Delivery Address' Exists");
    cy.get("[data-cy=TitleInOrderPage] svg")
      .should("exist")
      .should("be.visible");
    cy.log("✅✅ SVG Icon Exists in Title");
  });
  it("should render the shipping and delivery address component", () => {
    cy.get('[data-cy="ShipingBox"]').should("exist");
    cy.contains("Shipping & Delivery Address").should("be.visible");
    cy.contains("Please Enter Shipping Address To Receive Your Bag").should(
      "be.visible"
    );
    cy.get('[data-cy="WrapIcon1"]').should("exist");
    cy.get('[data-cy="WrapIcon"]').should("exist");
  });
});
describe("Should Add Address", () => {
  it("Should Check If User Add Address Lastly", () => {
    cy.ChexkExistElement("[data-cy=Address-Added-Last]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=Show-Address-That-Added]");
        cy.log("✅✅ Show Address List Button Clicked");
        cy.get("[data-cy=Address]").each(($el, index) => {
          cy.wrap($el).then(() => {
            cy.get("[data-cy=Delete-Address-Icon]")
              .eq(0)
              .click({ force: true })
              .then((text) => {
                cy.log(`Delete Address Icon ${index + 1}: ${text}`);
                cy.intercept(
                  "POST",
                  "**/api/new_v1/customer/address/delete?address**"
                ).as("DeleteAddress");
                cy.clickElement("[data-cy=Yes-Delete-Address]");
                cy.wait("@DeleteAddress").then((interception) => {
                  cy.log("✅✅ Get Address By Text request arrived");
                });
              });
          });
        });
      }
    });
  });
  it("Should Add Address", () => {
    cy.ChexkExistElement("[data-cy=Add-Shipping-Address]").then((exist) => {
      if (exist) {
        cy.clickElement("[data-cy=Add-Shipping-Address]");
        cy.log("✅✅ Add-Shipping-Address Button Clicked");
      } else {
        cy.clickElement("[data-cy=AddAddres]");
        cy.log("✅✅ Add Addres Button Clicked");
      }
    });
  });
  it("Should Change Place From List", () => {
    cy.clickElement("[data-cy=Change-From-List]");
    cy.log("✅✅ Change Place From List Button Clicked");
    cy.get("[data-cy=Extended-Choose-Area]").should("exist");
    cy.log("✅✅ Extended Box To Choose Area Appeared");
    cy.clickElement("[data-cy=SearchProvince-District-Town-Street]");
    cy.log("✅✅ Search Province District Town Street");
    cy.intercept("POST", "**/api/addresses/get-address-by-text").as(
      "GetAddressByText"
    );
    cy.get('[data-cy="SearchProvince-District-Town-Street"]').type("Latakia", {
      force: true,
      scrollBehavior: false,
    });
    cy.wait("@GetAddressByText").then((interception) => {
      cy.log("✅✅ Get Address By Text request arrived");
    });
    cy.log("✅✅ SearchProvince-District-Town-Street Filled");
    cy.get('[data-cy="SearchProvince-District-Town-Street"]', {
      timeout: 10000,
    }).should("be.visible");
    cy.clickElement("[data-cy=Firstly-Search-Result]:eq(0)");
    cy.log("✅✅ First Option Has Been Selected");
  });
  it("Should Add Detailed Address & Note", () => {
    cy.get("[data-cy=Detailed-Address-Note] textarea") // Selects the textarea inside the div
      .click()
      .type("This Is A Test Detailed Address & Note", {
        force: true,
        scrollBehavior: false,
      });
    cy.log("✅✅ Clicked and Filled Detailed Address & Note Input");
  });
  it("Should Add Address Title", () => {
    cy.get('[data-cy="Address-Title"] input') // Selects the input inside the div
      .click()
      .type("This Is A Test Address Title", {
        force: true,
        scrollBehavior: false,
      });
    cy.log("✅✅ Clicked and Filled Address Title Input");
  });
  it("Should Add Recipient Name", () => {
    cy.get('[data-cy="Recipient-Name"] input') // Selects the input inside the div
      .click()
      .type("This Is A Test Recipient Name", {
        force: true,
        scrollBehavior: false,
      });
    cy.log("✅✅ Clicked and Filled Recipient Name Input");
  });
  it("Should Add Contact Phone", () => {
    cy.get('[data-cy="Contact-Phone"] input') // Selects the input inside the div
      .click()
      .type("0963937764641", { force: true, scrollBehavior: false });

    cy.log("✅✅ Clicked and Filled Contact Phone Input");
  });
  it("Should Add & Save Address", () => {
    cy.clickElement("[data-cy=AddSaveButton]");
    cy.log("✅✅ Add & Save Button Clicked");
    cy.interceptAndWait([
      {
        method: "POST",
        url: "**/api/new_v1/customer/address/add",
        alias: "addAddress",
      },
      {
        method: "GET",
        url: "**/api/new_v1/customer/address/list",
        alias: "list",
      },
    ]);
    cy.log("✅✅ addAddress & list Requests Arrived");
  });
});
describe("Should Check Address & Add other Address", () => {
  it("Should Show Address List", () => {
    cy.clickElement("[data-cy=Show-Address-That-Added]");
    cy.log("✅✅ Show Address List Button Clicked");
  });
  it("Should Show Address Added Last", () => {
    cy.get('[data-cy="AddressListContainer"]', {
      timeout: 10000,
    }).should("be.visible");
    cy.get('[data-cy="Address"]', {
      timeout: 10000,
    }).should("be.visible");
  });
  it("Should Add Other Address", () => {
    cy.clickElement("[data-cy=Add-Shipping-Address]");
    cy.log("✅✅ Show Address List Button Clicked");
    cy.AddAdress();
  });
  it("Should Show Address List", () => {
    cy.clickElement("[data-cy=Show-Address-That-Added]");
    cy.log("✅✅ Show Address List Button Clicked");
    cy.get("[data-cy=Address]")
      .its("length")
      .then((count) => {
        cy.log(`✅✅ The Count Of Address Added Until Now Is: ${count}`);
      });
  });
});
describe("Should Edit Address", () => {
  it("Should Check If User Adds Address Lastly", () => {
    cy.get("[data-cy=Edit-Addres-Icon]", { timeout: 10000 })
      .first()
      .should("be.visible")
      .click({ force: true });
    cy.log("✅✅ Clicked on Edit Address Icon");
    cy.get("[data-cy=Detailed-Address-Note] textarea") // Selects the textarea inside the div
      .click()
      .type("This Is A Test Detailed Address & Note", {
        force: true,
        scrollBehavior: false,
      });
    cy.log("✅✅ Clicked and Filled Detailed Address & Note Input");
    cy.intercept("POST", "**/api/new_v1/customer/address/update").as(
      "UpdateAddress"
    );
    cy.clickElement("[data-cy=AddSaveButton]");
    cy.log("✅✅ Add & Save Button Clicked");
    cy.wait("@UpdateAddress", { timeout: 15000 })
      .its("response.statusCode")
      .should("eq", 200)
      .then(() => {
        cy.log("✅✅ Update Address API request was successful");
      });
  });
});
describe("Should Delete Address", () => {
  it("Should Delete Address", () => {
    cy.clickElement("[data-cy=Show-Address-That-Added]");
    cy.log("✅✅ Show Address List Button Clicked");
    cy.get("[data-cy=Delete-Address-Icon]")
      .eq(0)
      .click({ force: true })
      .then((text) => {
        cy.log(`Delete Address Icon`);
        cy.intercept(
          "POST",
          "**/api/new_v1/customer/address/delete?address**"
        ).as("DeleteAddress");
        cy.clickElement("[data-cy=Yes-Delete-Address]");
        cy.wait("@DeleteAddress").then((interception) => {
          cy.log("✅✅ Get Address By Text request arrived");
        });
      });
  });
});
