let CartLrLength1: number = 0;
let CountItem1: number = 0;
describe("Should Open The trydos & Logout", () => {
  before("Visit The Site", () => {
    Cypress.on("uncaught:exception", (err, runnable) => {
      return false;
    });
    cy.Visit("/sy-en");
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
    cy.clickElement("[data-cy=Confirm-Order-Button]");
    cy.log("✅✅ Confirm & Countinue Button Clicked");
  });
});
describe("should Login If User Is Not Verified", () => {
  it("Should Enter Phone Number", () => {
    cy.ChexkExistElement("[data-cy=FieldToInputNumber]").then((existing) => {
      if (existing) {
        cy.get("[data-testid=animated-container]");
        cy.get("[data-cy=login-operation]").should("exist");
        cy.get("[data-cy=login-operation-svg]").should("exist");
        cy.get("[data-cy=text-loginDesc]").should("exist");
        cy.get("[data-cy=text-loginDesc-text]").should(
          "contain",
          "Enter Your Phone Number To Complete Order"
        ); //login-detail
        cy.get("[data-cy=login-detail]").should("exist");
        cy.get("[data-cy=login-detail-svg]").should("exist");
        cy.get("[data-cy=FieldToInputNumber]").should(
          "contain",
          "Enter Your Phone Number Registered With Us"
        ); //login-detail-Verification
        cy.get("[data-cy=login-detail-Verification]").should("exist");
        cy.get("[data-cy=login-detail-Verification-svg]").should("exist"); //login-detail-Verification-text
        cy.get("[data-cy=login-detail-Verification-text]").should(
          "contain",
          "We Will Send A Verification Code To The Number"
        ); //container-enterPhone
        cy.get("[data-cy=container-enterPhone]").should("exist"); //container-enterPhone-svg
        cy.get("[data-cy=container-enterPhone-svg]").should("exist"); //solidPhhone-enterPhone-svg
        cy.get("[data-cy=solidPhhone-enterPhone-svg]").should("exist"); //span-flag
        cy.get("[data-cy=span-flag]").should("exist"); //plus-icon-span
        cy.get("[data-cy=plus-icon-span]").should("exist"); //phone-number-input
        cy.get("[data-cy=phone-number-input]").should("exist"); //phone-number-input
        cy.enterPhoneNumber("963937764641");
      } else {
        cy.log("✅✅ The Number Verified Last");
      }
    });
  });
  it("Should Select Way To Send Otp Code", () => {
    cy.get("[data-testid=animated-container]").should("exist");
    cy.get("[data-testid=pin-inputs-desc]").should("exist");
    cy.get("[data-cy=pin-inputs-desc-svg]").should("exist");
    cy.get("[data-cy=send-verification-number]").should("exist");
    cy.get("[data-cy=send-verification-number-text]")
      .should("exist")
      .contains("We Will Send A Verification Code To The Number");
    cy.get("[data-cy=Edit-Phone-Number]").should("exist");
    cy.get("[data-cy=Edit-Phone-Number-svg]").should("exist");
    cy.get("[data-cy=Edit-Phone-Number-plus]").should("exist").contains("+");
    cy.get("[data-cy=span-edit-number]").should("exist");
    cy.get("[data-cy=span-edit-number-svg]").should("exist");
    cy.get("[data-cy=choose]").should("exist");
    cy.get("[data-cy=choose-svg]").should("exist");
    cy.get("[data-cy=choose-text]")
      .should("exist")
      .contains("Choose The Verification Method, Receive Code Via:");
    cy.get("[data-cy=send-way]").should("exist");
    cy.get("[data-cy=whatssapp-way]").should("exist");
    cy.get("[data-cy=border-whatssapp-way]").should("exist");
    cy.get("[data-cy=border-whatssapp-way-svg]").should("exist");
    cy.get("[data-cy=way-icon]").should("exist");
    cy.get("[data-cy=whattsapp-text]").should("exist").contains("WhatsApp");
    cy.get("[data-cy=message-way]").should("exist");
    cy.get("[data-cy=message-way-svg-container]").should("exist");
    cy.get("[data-cy=message-way-svg]").should("exist");
    cy.get("[data-cy=message-icon-svg]").should("exist");
    cy.get("[data-cy=message-text]").should("exist").contains("SMS");
    cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
  });
  it("Should Enter OTP Code & Arrived Dual Request", () => {
    cy.typePincode("999999");
    cy.interceptAndWait([
      {
        method: "GET",
        url: "**/api/v1/customer/address/list",
        alias: "ListRequest",
      },
      {
        method: "GET",
        url: "**/api/v1/cart/cart_shipping",
        alias: "CartShiping",
      },
    ]);
    cy.log("✅✅ CartShiping & ListRequest Requests Arrived");
  });
});
// **************************************************************************
describe("Should verify components in address delivery page", () => {
  it("renders the header delivery component", () => {
    cy.get("[data-cy=swiper-slide]").should("exist");
    cy.get('[data-cy="header-delivery"]').should("be.visible");
    cy.get('[data-cy="TitleInOrderPage"]').should(
      "contain",
      "Bag Shipping & Delivery Address"
    );
    cy.get('[data-cy="swiperSlide-backIcon"]').should("be.visible");
  });
  it("triggers back icon click event", () => {
    cy.clickElement('[data-cy="swiperSlide-backIcon"]');
    cy.clickElement("[data-cy=Confirm-Order-Button]");
    cy.log("✅✅ Confirm & Countinue Button Clicked");
    cy.interceptAndWait([
      {
        method: "GET",
        url: "**/api/v1/customer/address/list",
        alias: "ListRequest",
      },
      {
        method: "GET",
        url: "**/api/v1/cart/cart_shipping",
        alias: "CartShiping",
      },
    ]);
    cy.log("✅✅ CartShiping & ListRequest Requests Arrived");
  });
  it("", () => {});
  it("", () => {});
});
// **************************************************************************
describe("Compare Quantity Founded In Order With Quantity Required", () => {
  it("Should Extract The Number Of Items That Confirm To Buy It", () => {
    cy.get("[data-cy=Number-Of-Products-Required]")
      .invoke("text")
      .then((text) => {
        const match = text.match(/^(\d+)\s+items/); // Match number before "items"
        if (match) {
          const cartLength = parseInt(match[1], 10); // Convert extracted value to integer
          cy.log("✅✅ Extracted Cart Length:", cartLength);
          expect(cartLength).to.be.a("number");
          CartLrLength1 = cartLength;
        }
      });
  });
  it("Should Extract Number Of Items in Shopping Bag", () => {
    cy.get("[data-cy=Count-Of-Shiping]")
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
    cy.clickElement("[data-cy=DropDownIcon]");
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
    cy.get("[data-cy=ShipingBox]").should("exist");
    cy.contains("Shipping & Delivery Address").should("be.visible");
    cy.contains("Please Enter Shipping Address To Receive Your Bag").should(
      "be.visible"
    );
    cy.get("[data-cy=WrapIcon1]").should("exist");
    cy.get("[data-cy=WrapIcon]").should("exist");
  });
});
describe("Should delete all address founded lastly", () => {
  it("Should Check If User Add Address Lastly", () => {
    cy.ChexkExistElement("[data-cy=Address-Added-Last]").then((exist) => {
      // Proceed only if the element exists
      if (exist) {
        cy.clickElement("[data-cy=Show-Address-That-Added]");
        cy.log("✅✅ Show Address List Button Clicked");

        cy.get("[data-cy=Address]").each(($el, index) => {
          cy.wrap($el).then(() => {
            cy.clickElement("[data-cy=Delete-Address-Icon]:eq(0)").then(
              (text) => {
                cy.log(`Delete Address Icon ${index + 1}: ${text}`);
                cy.intercept(
                  "POST",
                  "**/api/v1/customer/address/delete?address**"
                ).as("DeleteAddress");
                cy.clickElement("[data-cy=Yes-Delete-Address]");
                cy.wait("@DeleteAddress").then((interception) => {
                  expect(interception.response.statusCode).to.be.eq(200);
                  cy.log("✅✅ Get Address By Text request arrived");
                });
              }
            );
          });
        });
      } else {
        cy.log(
          "❌❌ Address-Added-Last element not found, skipping address deletion."
        );
      }
    });
    cy.get("body").click(0, 0); // Optional: Click to ensure no overlay blocks interactions
  });
  it("Should open add adress interface", () => {
    cy.clickElement("[data-cy=AddAddres]");
    cy.log("✅✅ Add Addres Button Clicked");
  });
  it("should display the address options correctly", () => {
    // Check for Back Icon
    cy.get("[data-cy=back-icon-addadresspage]").should("exist");
    // Check for Add Address Icon
    cy.get("[data-cy=add-address-icon]").should("exist");
    // Check for Address Text
    cy.get("[data-cy=address-text]").then(($text) => {
      const addressText = $text.text();
      expect(addressText).to.be.oneOf([
        "Add Shipping Address",
        "Edit Shipping Address",
      ]);
    });
    // Check for Delete Icon if addressDetails.id exists
    cy.get("[data-cy=delete-icon-container]").then(($container) => {
      if ($container.find("[data-cy=delete-icon]").length) {
        cy.get("[data-cy=delete-icon]").should("exist");
      } else {
        cy.get("[data-cy=delete-icon]").should("not.exist"); // Ensure it doesn't exist if id is not present
      }
    });
    cy.get("[data-cy=country-label]").should("exist");
    cy.get("[data-cy=country-region-div]").should(
      "contain",
      "Country | Region"
    );
    cy.get("[data-cy=country-label] .flex-row.items-center").should("exist");
    cy.get("[data-cy=country-flag]").should("exist");
    cy.get('[data-cy="country-name"]').should("exist").and("not.be.empty");
    cy.get("[data-cy=country-name] ").should("contain", "Syria");
    cy.get("[data-cy=back-icon-addadresspage]").should("exist"); // Check for Back Icon
    cy.get("[data-cy=add-address-icon]").should("exist"); // Check for Add Address Icon
    cy.get("[data-cy=address-text]").then(($text) => {
      const addressText = $text.text();
      expect(addressText).to.be.oneOf([
        "Add Shipping Address",
        "Edit Shipping Address",
      ]);
    }); // Check for Address Text
    cy.get("[data-cy=add-address-form]").should("exist"); // Check for the main form
    cy.get("[data-cy=info-icon]").should("exist"); // Check for Address Icon
    cy.get("[data-cy=address-info-header]").should("exist");
    cy.get("[data-cy=info-text]").should(
      "contain",
      "Entering The Information Below Clearly And Completely"
    ); // Check for the address info header
    cy.get("[data-cy=map-container]").should("exist");
    cy.get("[data-cy=map-toggle]").should("exist");
    cy.get("[data-cy=location-accuracy]")
      .should("exist")
      .should(
        "contain",
        "Location Is Accurate, Making It Easy To Receive Shipments"
      );
    cy.get("[data-cy=address-section]").should("exist"); // Check for address section
    cy.get("[data-cy=add-address-buttons-container]").should("exist"); // Check for address section
    cy.get("[data-cy=address-icon]").should("exist"); // Check for address-info-icon
    cy.get("[data-cy=address-info-text]").should("contain", "Address Info"); // Check for Address Info text
    cy.get("[data-cy=address-info-icon]").should("exist");
    cy.get("[data-cy=expand-map]").should("exist");
    cy.get("[data-cy=expand-map] span")
      .should("exist")
      .should("contain", "Locate Your Location On Map");
    cy.get("[data-cy=expand-map] svg").should("exist");
  });
});
describe("Should add location by map", () => {
  it("Moves marker & clicks it", () => {
    cy.clickElement("[data-cy=expand-map]");
    cy.get("body").click(250, 250);
    cy.clickElement(".leaflet-control-zoom-out");
    cy.clickElement(".leaflet-control-zoom-out");
    cy.clickElement(".leaflet-control-zoom-out");
    cy.clickElement(".leaflet-control-zoom-out");
    cy.clickElement(".leaflet-control-zoom-out");
    // Wait for the map to load
    cy.get(".leaflet-marker-pane img")
      .should("be.visible")
      .then(($marker) => {
        const marker = $marker[0];
        // Get initial position
        const rect = marker.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;
        // Define target position (manually adjust based on map layout)
        const targetX = startX - 100; // Adjust for Tartous position
        const targetY = startY - 50;
        // Simulate dragging
        cy.wrap($marker)
          .trigger("mousedown", { button: 0, clientX: startX, clientY: startY })
          .trigger("mousemove", { clientX: targetX, clientY: targetY })
          .trigger("mouseup", { force: true });
        // Click the marker after movement
        cy.wrap($marker).click({ force: true });
      });
    // cy.get("body").click(100, 250);
    cy.clickElement(".leaflet-control-zoom-out");
    cy.clickElement(".leaflet-control-zoom-out");
    cy.clickElement(".leaflet-control-zoom-out");
    cy.clickElement(".leaflet-control-zoom-out");
    cy.get("body").click(100, 250);
    cy.get("[data-cy=confirm-button]")
      .should("exist")
      .click({ scrollBehavior: false, force: true });
  });
});
describe("Should choose region", () => {
  it("Should Change Place From List", () => {
    cy.get("[data-cy=change-list-statement]")
      .should("exist")
      .contains("Change From List");
    cy.get("[data-cy=point-icon]").should("exist");
    cy.get("[data-cy=Change-From-List]")
      .should("exist")
      .click({ scrollBehavior: false, force: true });
    cy.log("✅✅ Change Place From List Button Clicked");
    cy.get("[data-cy=Extended-Choose-Area]").should("exist");
    cy.log("✅✅ Extended Box To Choose Area Appeared");
  });
  it("Should found components of add region", () => {
    cy.get("[data-cy=target-icon]").should("exist");
    cy.get("[data-cy=Select-From-List]")
      .should("exist")
      .should("contain", "Select From List");
    cy.get("[data-cy=country-flag]").should("exist");
    cy.get("[data-cy=region-div]").should("exist");
  });
  it("displays country name", () => {
    // Assuming you have a way to mock or set the country prop
    cy.get("[data-cy=country-extend]").should("exist").contains("Syria"); // Replace 'Country Name' with the expected country name
  });
  it("displays province, city, and town with default values when not provided", () => {
    // Check for default values when address details are not provided
    cy.get("[data-cy=Province-extend]").should("exist").contains("Province");
    cy.get("[data-cy=Town-extend]").should("exist").contains("Town");
    cy.get("[data-cy=Suburb-extend]").should("exist").contains("Suburb");
  });
  it("displays the search input", () => {
    cy.get("[data-cy=SearchProvince-District-Town-Street]").should("exist");
    // Check if the DebounceInput has the correct placeholder
    cy.get('[data-cy="SearchProvince-District-Town-Street"]').should(
      "have.attr",
      "placeholder",
      "Search Province | District | Town | Street"
    );
    cy.get("[data-cy=search-svg]").should("exist");
    cy.clickElement("[data-cy=SearchProvince-District-Town-Street]");
  });
  it("displays placeholder text", () => {
    // cy.get(".absolute.top-[11px].left-[12px]").should("exist");
    cy.get('[data-cy="SearchProvince-District-Town-Street"]').should(
      "have.attr",
      "placeholder",
      "Search Province | District | Town | Street"
    );
  });
  it("shows loading spinner when loading", () => {
    // Simulate loading state
    cy.intercept("POST", "**/api/addresses/get-address-by-text").as(
      "GetAddressByText"
    );
    cy.get('[data-cy="SearchProvince-District-Town-Street"]').type("Aleppo", {
      force: true,
      scrollBehavior: false,
    });
    cy.wait("@GetAddressByText").then((interception) => {
      expect(interception.response.statusCode).to.be.eq(200);
      cy.log("✅✅ Get Address By Text request arrived");
    });
  });
  it("should select firstly result apperead", () => {
    cy.clickElement("[data-cy=Firstly-Search-Result]:eq(0)");
    cy.log("✅✅ First Option Has Been Selected");
  });
});
describe("Should input detail of address", () => {
  it("Should verify found it", () => {
    cy.get("[data-cy=Detailed-Address-field]").should("exist");
    cy.log("✅✅ Detailed-Address-field founded");
  });
  it("Should check components", () => {
    cy.get("[data-cy=Detailed-Address-statement]")
      .should("exist")
      .contains("Detailed Address & Note");
    cy.log("✅✅ Detailed-Address-statement founded");
  });
  it("should check field ", () => {
    cy.get("[data-cy=Detailed-Address-Note]").should("exist");
    cy.log("✅✅ Detailed-Address-Note founded");
  });
  it("should display placeholder text", () => {
    cy.get("[data-cy=text-area-placeholder]").should("exist");
    cy.log("✅✅ text-area-placeholder founded");
    cy.get("[data-cy=text-area-placeholder]").should(
      "have.attr",
      "placeholder",
      "Write The Address Clearly, Including The Street Address, Building, Flat, Door, Unit."
    );
  });
  it("should fill field", () => {
    cy.clickElement("[data-cy=text-area-placeholder]") // Selects the textarea inside the div
      .type("This Is A Test Detailed Address & Note", {
        force: true,
        scrollBehavior: false,
      });
    cy.log("✅✅ Clicked and Filled Detailed Address & Note Input");
  });
});
describe("Should add title of address", () => {
  it("Should verify found it", () => {
    cy.get("[data-cy=address-title]").should("exist");
    cy.log("✅✅ address-title founded");
  });
  it("Should check components", () => {
    cy.get("[data-cy=add-Address-statement]")
      .should("exist")
      .contains("Address Title");
    cy.log("✅✅ add-Address-statement founded");
  });
  it("should check field ", () => {
    cy.get("[data-cy=Address-Title]").should("exist");
    cy.log("✅✅ Address-Title founded");
  });
  it("should display placeholder text", () => {
    cy.get("[data-cy=add-address-input]").should("exist");
    cy.log("✅✅ add-address-input founded");
    cy.get("[data-cy=add-address-input]").should(
      "have.attr",
      "placeholder",
      "Ex: Home, My Office, 2 Home Ect."
    );
  });
  it("should fill field", () => {
    cy.clickElement("[data-cy=add-address-input]") // Selects the textarea inside the div
      .type("This Is A Test Address Title", {
        force: true,
        scrollBehavior: false,
      });
    cy.log("✅✅ Clicked and Filled Address Title Input");
  });
});
describe("Should add name", () => {
  it("Should verify found it", () => {
    cy.get("[data-cy=container-name-phone]").should("exist");
    cy.log("✅✅ container-name-phone founded");
  });
  it("Should check components", () => {
    cy.get("[data-cy=contact-info-icon]").should("exist");
    cy.log("✅✅ contact-info-icon founded");
    cy.get("[data-cy=contact-info-text]")
      .should("exist")
      .contains("Contact Info");
    cy.log("✅✅ contact-info-text founded");
    cy.get("[data-cy=Address-info-icon]").should("exist");
    cy.log("✅✅ Address-info-icon founded");
  });
  it("Should verify found it", () => {
    cy.get("[data-cy=name-container]").should("exist");
    cy.log("✅✅ name-container founded");
    cy.get("[data-cy=recipient-name-statement]")
      .should("exist")
      .contains("Recipient Name");
    cy.log("✅✅ recipient-name-statement founded");
  });
  it("should check field ", () => {
    cy.get("[data-cy=Recipient-Name]").should("exist");
    cy.log("✅✅ Recipient-Name founded");
  });
  it("should display placeholder text", () => {
    cy.get("[data-cy=recipient-name-input]").should("exist");
    cy.log("✅✅ recipient-name-input founded");
    cy.get("[data-cy=recipient-name-input]").should(
      "have.attr",
      "placeholder",
      "Enter Full Recipient Name"
    );
  });
  it("should fill field", () => {
    cy.clickElement("[data-cy=recipient-name-input]") // Selects the textarea inside the div
      .type("This Is A Test Recipient Name", {
        force: true,
        scrollBehavior: false,
      });
    cy.log("✅✅ Clicked and Filled Recipient Name Input");
  });
});
describe("Should add phone number", () => {
  it("Should verify found it", () => {
    cy.get("[data-cy=phone-container]").should("exist");
    cy.log("✅✅ phone-container founded");
  });
  it("Should check components", () => {
    cy.get("[data-cy=phone-statement]")
      .should("exist")
      .contains("Contact Phone");
    cy.log("✅✅ phone-statement founded");
  });
  it("should check field ", () => {
    cy.get("[data-cy=Contact-Phone]").should("exist");
    cy.log("✅✅ Contact-Phone founded");
  });
  it("should display placeholder text", () => {
    cy.get("[data-cy=Contact-Phone-input]").should("exist");
    cy.log("✅✅ Contact-Phone-input founded");
    cy.get("[data-cy=Contact-Phone-input]").should(
      "have.attr",
      "placeholder",
      "Enter Recipient Phone"
    );
  });
  it("should fill field", () => {
    cy.clickElement("[data-cy=Contact-Phone-input]") // Selects the textarea inside the div
      .type("0963937764641", {
        force: true,
        scrollBehavior: false,
      });
    cy.log("✅✅ Clicked and Filled Contact Phone Input");
  });
});
describe("Should add phone number", () => {
  it("Should verify found it", () => {
    cy.get("[data-cy=altarnative-Phone-container]").should("exist");
    cy.log("✅✅ altarnative-Phone-container founded");
  });
  it("Should check components", () => {
    cy.get("[data-cy=altarnative-Phone-statement]")
      .should("exist")
      .contains("Alternative Phone");
    cy.log("✅✅ altarnative-Phone-statement founded");
    cy.get("[data-cy=optional-statement]")
      .should("exist")
      .contains("(Optional)");
    cy.log("✅✅ optional-statement founded");
  });
  it("should display placeholder text", () => {
    cy.get("[data-cy=optional-input]").should("exist");
    cy.log("✅✅ optional-input founded");
    cy.get("[data-cy=optional-input]").should(
      "have.attr",
      "placeholder",
      "Enter Alternative Recipient Phone"
    );
  });
  it("should fill field", () => {
    cy.clickElement("[data-cy=optional-input]") // Selects the textarea inside the div
      .type("0963937764641", {
        force: true,
        scrollBehavior: false,
      });
    cy.log("✅✅ Clicked and Filled Contact Phone Input");
  });
});
describe("should save address & wait the requests", () => {
  it("Should Add & Save Address", () => {
    // add - address - buttons - container;
    cy.get("[data-cy=add-address-buttons-container]").should("exist");
    cy.clickElement("[data-cy=AddSaveButton]");
    cy.log("✅✅ Add & Save Button Clicked");
  });
  it("Should wait the requests", () => {
    cy.interceptAndWait([
      {
        method: "POST",
        url: "**/api/v1/customer/address/add",
        alias: "addAddress",
      },
      {
        method: "GET",
        url: "**/api/v1/customer/address/list",
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
    cy.get("[data-cy=AddressListContainer]", {
      timeout: 10000,
    }).should("be.visible");
    cy.get("[data-cy=Address]", {
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
      .click({ force: true, scrollBehavior: false });
    cy.log("✅✅ Clicked on Edit Address Icon");
    // Check for Back Icon
    cy.get("[data-cy=back-icon-addadresspage]").should("exist");
    // Check for Add Address Icon
    cy.get("[data-cy=add-address-icon]").should("exist");
    // Check for Address Text
    cy.get("[data-cy=address-text]").then(($text) => {
      const addressText = $text.text();
      expect(addressText).to.be.oneOf([
        "Add Shipping Address",
        "Edit Shipping Address",
      ]);
    });
    // Check for Delete Icon if addressDetails.id exists
    cy.get("[data-cy=delete-icon-container]").then(($container) => {
      if ($container.find("[data-cy=delete-icon]").length) {
        cy.get("[data-cy=delete-icon]").should("exist");
      } else {
        cy.get("[data-cy=delete-icon]").should("not.exist"); // Ensure it doesn't exist if id is not present
      }
    });
    cy.clickElement("[data-cy=text-area-placeholder]") // Selects the textarea inside the div
      .type("This Is A Test Detailed Address & Note", {
        force: true,
        scrollBehavior: false,
      });
    cy.log("✅✅ Clicked and Filled Detailed Address & Note Input");
    cy.intercept("POST", "**/api/v1/customer/address/update").as(
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
    cy.clickElement("[data-cy=Delete-Address-Icon]:eq(0)").then((text) => {
      cy.log(`Delete Address Icon`);
      cy.intercept("POST", "**/api/v1/customer/address/delete?address**").as(
        "DeleteAddress"
      );
      cy.clickElement("[data-cy=Yes-Delete-Address]");
      cy.wait("@DeleteAddress").then((interception) => {
        expect(interception.response.statusCode).to.be.eq(200);
        cy.log("✅✅ Get Address By Text request arrived");
      });
    });
  });
});
