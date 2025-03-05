let CartLrLength1: number = 0;
let CountItem1: number = 0;
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
  it("Should Enter Phone Number", () => {
    cy.Exist("[data-cy=FieldToInputNumber]").then((exist) => {
      if (exist) {
        cy.enterPhoneNumber1("963937764641");
        cy.log("✅✅ Number Phone Entered Successfuly");
      }
    });
  });
  it("Should Select Way To Send Otp Code", () => {
    cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
    cy.get(".message-recieve-option:nth-child(2)").click({
      scrollBehavior: false,
    });
    cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
    cy.wait("@sendOtpApi");
    cy.log("✅✅ Send Otp Api Request Successfuly");
  });
  it("Should Enter OTP Code", () => {
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
  // it("Should Chack Other Components", () => {
  //   cy.get("[data-cy=OrderCartIcon").should("exist");
  //   cy.log("✅✅ Order Cart Icon Exists");
  //   cy.get(".regular text-[#1D1D1D]")
  //     .should("contain.text", "Your Shopping Bag")
  //     .should("exist");
  //   cy.log("✅✅ The Text Exists");
  //   cy.clickElementForce("[data-cy=DropDownIcon]");
  //   cy.log("✅✅ Drop Down Icon Click");
  //   cy.get("data-cy=Item")
  //     .its("length")
  //     .then((count) => {
  //       cy.log(`✅✅ The Count Of Item Required Is: ${count}`);
  //       expect(count).to.be.eq(CountItem1);
  //     });
  // });
  // *********************************************
});
describe("Shipping & Delivery Address Component", () => {
  // it("should render the Bag shipping", () => {
  //   cy.get("[data-cy=TitleInOrderPage]")
  //     .find("svg")
  //     .should("contain.text", "Bag Shipping & Delivery Address")
  //     .should("exist");
  // });
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
    cy.Exist("[data-cy=Address-Added-Last]").then((exist) => {
      if (exist) {
        cy.clickElementForce("[data-cy=Show-Address-That-Added]");
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
                cy.clickElementForce("[data-cy=Yes-Delete-Address]");
                cy.wait("@DeleteAddress").then((interception) => {
                  cy.log("✅✅ Get Address By Text request arrived");
                });
              });
          });
        });
      }
    });
    cy.log("✅✅ Add Addres Button Clicked");
  });
  it("Should Add Address", () => {
    cy.clickElementForce("[data-cy=AddAddres]");
    cy.log("✅✅ Add Addres Button Clicked");
  });
  it("Should Change Place From List", () => {
    cy.clickElementForce("[data-cy=Change-From-List]");
    cy.log("✅✅ Change Place From List Button Clicked");
    cy.get("[data-cy=Extended-Choose-Area]").should("exist");
    cy.log("✅✅ Extended Box To Choose Area Apperead");
    cy.clickElementForce("[data-cy=SearchProvince-District-Town-Street]");
    cy.log("✅✅ Search Province District Town Street");
    cy.intercept("POST", "**/api/addresses/get-address-by-text").as(
      "GetAddressByText"
    );
    cy.get('[data-cy="SearchProvince-District-Town-Street"]').type("Latakia");
    cy.wait("@GetAddressByText").then((interception) => {
      cy.log("✅✅ Get Address By Text request arrived");
    });
    cy.log("✅✅ SearchProvince-District-Town-Street Filled");
    cy.get('[data-cy="SearchProvince-District-Town-Street"]', {
      timeout: 10000,
    }).should("be.visible");
    cy.wait(2000);
    cy.get("[data-cy=Firstly-Search-Result]").eq(0).click({ force: true });
    cy.log("✅✅ First Option Has Been Selected");
  });
  it("Should Add Detailed Address & Note", () => {
    cy.clickElementForce("[data-cy=Detailed-Address-Note]");
    cy.log("✅✅ Click On Detailed Address & Note Field");
    cy.get("[data-cy=Detailed-Address-Note]").type(
      "This Is A Test Detailed Address & Note"
    );
    cy.log("✅✅ Detailed Address & Note Input Filled");
  });
  it("Should Add Address Title", () => {
    cy.clickElementForce("[data-cy=Address-Title]");
    cy.log("✅✅ Click On Add Address Title Field");
    cy.get('[data-cy="Address-Title"]').type("This Is A Test Address Title");
    cy.log("✅✅ Address Title Input Filled");
  });
  it("Should Add Recipient Name", () => {
    cy.clickElementForce("[data-cy=Recipient-Name]");
    cy.log("✅✅ Click On Recipient Name Field");
    cy.get('[data-cy="Recipient-Name"]').type("This Is A Test Recipient Name");
    cy.log("✅✅ Recipient Name Input Filled");
  });
  it("Should Add Contact Phone", () => {
    cy.clickElementForce("[data-cy=Contact-Phone]");
    cy.log("✅✅ Click On Contact Phone Field");
    cy.get('[data-cy="Contact-Phone"]').type("0963937764641");
    cy.log("✅✅ Contact Phone Input Filled");
  });
  it("Should Add & Save Address", () => {
    cy.clickElementForce("[data-cy=AddSaveButton]");
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
    cy.clickElementForce("[data-cy=Show-Address-That-Added]");
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
    cy.clickElementForce("[data-cy=Add-Shipping-Address]");
    cy.log("✅✅ Show Address List Button Clicked");
    cy.AddAdress();
  });
  it("Should Show Address List", () => {
    cy.clickElementForce("[data-cy=Show-Address-That-Added]");
    cy.log("✅✅ Show Address List Button Clicked");
    cy.get("[data-cy=Address]")
      .its("length")
      .then((count) => {
        cy.log(`The Count Of Address Added Until Now Is: ${count}`);
      });
  });
});
describe("Should Edit Address", () => {
  it("Should Check If User Add Address Lastly", () => {
    // cy.intercept("POST", "**/api/new_v1/customer/address/update").as(
    //   "UpdateAddress"
    // );
    cy.get("[data-cy=Edit-Addres-Icon]", { timeout: 10000 })
      .eq(0)
      .click({ force: true })
      .then((text) => {
        cy.clickElementForce("[data-cy=Detailed-Address-Note]");
        cy.log("✅✅ Click On Detailed Address & Note Field");
        cy.get("[data-cy=Detailed-Address-Note]").type(
          "This Is A Test Detailed Address & Note After Edit"
        );
        cy.log("✅✅ Detailed Address & Note Input Filled");
        cy.clickElementForce("[data-cy=AddSaveButton]");
        cy.log("✅✅ Add & Save Button Clicked");
      });
    cy.wait(5000);
    // cy.wait("@UpdateAddress").then((interception) => {
    //   if (interception) {
    //     cy.log("✅✅ Update Address By Text request arrived");
    //   } else {
    //     cy.log("Error");
    //   }
    // });
  });
});
describe("Should Delete Address", () => {
  it("Should Delete Address", () => {
    cy.clickElementForce("[data-cy=Show-Address-That-Added]");
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
        cy.clickElementForce("[data-cy=Yes-Delete-Address]");
        cy.wait("@DeleteAddress").then((interception) => {
          cy.log("✅✅ Get Address By Text request arrived");
        });
      });
  });
});
