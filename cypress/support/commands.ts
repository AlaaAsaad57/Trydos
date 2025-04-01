/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }// Custom command to visit a URL with overridden Notification permissions
Cypress.Commands.add("Visit", function (url: string) {
  cy.intercept("GET", "**/api/new_v1/countries").as("CountriesApi");
  cy.visit(url, {
    onLoad(win) {
      // @ts-ignore
      cy.stub(win.Notification, "permission").resolves("granted");
    },
  });
  cy.url().then((ur) => {
    // @ts-ignore
    if (ur.includes("-country")) {
      cy.wait("@CountriesApi").then((i) => {
        console.log("sahsahj", i);
        if (i) {
          cy.Exist("#country").then((exist) => {
            if (exist) {
              cy.get("#country").select("TR");
            } else {
              cy.get("[data-cy='countain-with']").first().click({
                force: true,
                scrollBehavior: false,
              });
            }
          });
        }
      });
    }
  });
  // cy.interceptAndWait([
  //   {
  //     method: "GET",
  //     url: "**/api/new_v1/web/home/startingSettings",
  //     alias: "startingSettings",
  //   },
  //   {
  //     method: "GET",
  //     url: "**/api/products/search?with_products=false",
  //     alias: "popular-search",
  //   },
  // ]);
  // cy.log("✅✅ startingSettings & popular-search Requests Arrived");
});
Cypress.Commands.add("Exist", (selector) => {
  cy.wait(3000);
  cy.get("body")
    .should("exist")
    .then(($body) => {
      return new Cypress.Promise((resolve, reject) => {
        if ($body.find(selector).length > 0) {
          cy.log("✅✅ cy.exist() - Matching element found in DOM!");
          resolve(true);
        } else {
          cy.log("❌❌ cy.exist() - Element did not exist!");
          resolve(false);
        }
      });
    });
});
Cypress.Commands.add("ChexkExistElement", (selector) => {
  cy.get("body")
    .should("exist")
    .then(($body) => {
      return new Cypress.Promise((resolve, reject) => {
        if ($body.find(selector).length > 0) {
          cy.log(" ✅✅cy.exist() - Matching element found in DOM!");
          resolve(true);
        } else {
          cy.log("❌❌ cy.exist() - Element did not exist!");
          resolve(false);
        }
      });
    });
});
Cypress.Commands.add("logout", () => {
  cy.Exist("[data-cy=Logout-ReLogout]").then((exist) => {
    if (exist) {
      cy.get("[data-cy=Logout-ReLogout]").click({ force: true });
      cy.get("[data-cy=logout]").click({ force: true, scrollBehavior: false });
      cy.log("✅✅ You have successfully logged out");
    } else {
      cy.log("❌❌ No Login Founded!");
    }
  });
});
// ********************************add******************************************
Cypress.Commands.add("WaitUntilLoadWebsiteAndlogoutAndViewport", () => {
  cy.wait(3000);
  cy.logout();
  cy.viewport(783, 824);
});
Cypress.Commands.add("OpenLoginInterface", () => {
  cy.clickElement(".en-regular:nth-child(2)");
  cy.get("[data-cy=login-widget-container]", { timeout: 30000 });
  cy.log("✅✅ Click On Login Icon & Open Its Interface");
});
Cypress.Commands.add("HaveAccount", () => {
  cy.clickElement(".login-button:nth-child(1)");
  cy.log("✅✅ Click On I Have Already Acount Button");
});
Cypress.Commands.add("CreateNewAccount", () => {
  cy.clickElement(".login-button:nth-child(2)");
  cy.log("✅✅ Click On Create New Acount Button");
});
Cypress.Commands.add("ComplateLoginByMobilePhone", () => {
  cy.ChexkExistElement("[data-cy=login-method-phone]").then((exist) => {
    if (exist) {
      cy.clickElement("[data-cy=login-method-phone]");
      cy.log("✅✅ The User Attempt LogIn From Mobile Phone");
    } else {
      cy.log("✅✅ User Does Not Attempt LogIn From Mobile Phone");
    }
  });
});
Cypress.Commands.add("AgreeTerms", () => {
  cy.clickElement(".agree-terms");
  cy.log("✅✅ Agree & Countinue Button Clicked Successfuly");
});
Cypress.Commands.add("ChooseWayToRecieveOtpAndWaitOtpRequest", () => {
  cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
  cy.clickElement(".message-recieve-option:nth-child(2)");
  cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
  cy.wait("@sendOtpApi").then((response) => {
    // expect(response.response.statusCode).to.be.eq(200);
  });
  cy.log("✅✅ Send Otp Api Request Successfuly");
});
Cypress.Commands.add("CheckIfTrySendOtp", () => {
  cy.ChexkExistElement("[data-cy=WaitForTryAgain]").then((exist) => {
    if (exist) {
      cy.get("[data-cy=WaitForTryAgain]").then(($element) => {
        const waitTime = parseInt($element.text().match(/\d+/)[0]);
        cy.log(`✅✅ Waiting for ${waitTime} seconds before trying again`);
        cy.wait(waitTime * 1000 + 1); // Wait for the specified time in milliseconds
        cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
        cy.clickElement(".message-recieve-option:nth-child(2)");
        cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
        cy.wait("@sendOtpApi").then((interception) => {
          expect(interception.response.statusCode).to.be.eq(200);
        });
        cy.log("✅✅ Send Otp Api Request Successfuly");
      });
    }
  });
});
Cypress.Commands.add("EndLoginOperation", () => {
  cy.clickElement("[data-testid=login-close-icon]");
});
Cypress.Commands.add("InputFieldNameVisible", () => {
  cy.clickElement("[data-cy=inputToWriteName]").should("be.visible");
  cy.log("✅✅ Input Field For Writ User Name is clicked on");
});
Cypress.Commands.add("TypeName", () => {
  cy.intercept("POST", "**/customer/update-name").as("update-name");
  cy.intercept("POST", "**/api/v1/users/update").as("update");
  cy.clickElement("[data-cy=InputFiledForName]");
  cy.get("[data-cy=InputFiledForName]", { timeout: 10000 })
    .type("Abdo Hamdan", { force: true, scrollBehavior: false })
    .should("have.value", "Abdo Hamdan"); // Ensure text was typed
  cy.log("✅✅ User Name is Writ In Input Field");
  cy.clickElement(".phone-arrow");
  cy.wait(["@update-name", "@update"]).then((inter) => {
    expect(inter[0].response.statusCode).to.be.eq(200);
    expect(inter[1].response.statusCode).to.be.eq(200);
  });
});
Cypress.Commands.add("MakeOtpExpired", () => {
  cy.wait(70000);
});
Cypress.Commands.add("SkipForNow", () => {
  cy.clickElement("[data-cy=skipForNow]");
  cy.log("✅✅ Skip For Now Button clicked");
});
Cypress.Commands.add("ColoredFieldRed", () => {
  cy.get(".input-failed", { timeout: 5000 }).should("be.visible");
  cy.log("✅✅ OTP Code Input Fields Be Colored Red");
});
Cypress.Commands.add("RequestForThreeServers", () => {
  let count = 0;
  cy.intercept("POST", "**/login", () => {
    count += 1;
  }).as("login");
  cy.intercept("GET", "**/api/v1/stories/users_stories", () => {
    count += 1;
  }).as("Stories");
  cy.wait("@login", { timeout: 10000 }).then((interception) => {
    expect(interception.response.statusCode).to.be.eq(200);
    cy.log("✅✅ login request arrived");
  });
  cy.wait("@Stories", { timeout: 10000 }).then((interception) => {
    expect(interception.response.statusCode).to.be.eq(200);
    cy.log("✅✅ Stories request arrived");
  });
  cy.wait(500).then(() => {
    cy.log(`Count is: ${count}`);
    expect(count).to.be.greaterThan(1);
  });
});
Cypress.Commands.add("typePincode", (pincode: string) => {
  cy.get(".pincode-input-text").first().focus();
  const digits = pincode.split("");
  digits.forEach((digit, index) => {
    cy.get(`.pincode-input-text:nth-child(${index + 1})`, {
      timeout: 3000,
    }).type(digit, { scrollBehavior: false });
  });
});

Cypress.Commands.add("enterPhoneNumber", (phoneNumber: string) => {
  phoneNumber.split("").forEach((char) => {
    cy.get("#phoneInput")
      .type(char, { delay: 200, force: true, scrollBehavior: false }) // Force typing into the hidden input
      .should("be.focused"); // Verify that the input is still focused
  });
  cy.get("#phoneInput").type("{enter}", {
    force: true,
    scrollBehavior: false,
  });
  cy.log("✅✅ Number Phone Entered Successfuly");
  cy.get('[data-testid="phone-number-input"]').should("not.be.focused");
});
Cypress.Commands.add("reEnterPhoneNumber", (phoneNumber: string) => {
  cy.clickElement("[data-cy=Edit-Phone-Number]");
  cy.log("✅✅ Back To Write Correct Number Phone Successfuly");
  cy.get("#phoneInput").type(`${phoneNumber}`, {
    scrollBehavior: false,
  });
  cy.clickElement(".phone-arrow");
});
Cypress.Commands.add("performLogin", (s?: string) => {
  cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  cy.OpenLoginInterface();
  cy.HaveAccount();
  cy.ComplateLoginByMobilePhone();
  cy.enterPhoneNumber(s || "963937764641");
  cy.ChooseWayToRecieveOtpAndWaitOtpRequest();
  cy.CheckIfTrySendOtp();
  cy.typePincode("999999");
  cy.EndLoginOperation();
  cy.RequestForThreeServers();
});
Cypress.Commands.add("interceptAndWait", (routes) => {
  // Iterate through the provided routes and set up intercepts
  routes.forEach((route) => {
    cy.intercept(route.method || "GET", route.url).as(route.alias);
  });
  const aliases = routes.map((route) => `@${route.alias}`);
  cy.wait(aliases, { timeout: 30000 }); // Adjust timeout as needed
});
Cypress.Commands.add("clickElement", (selector: string) => {
  cy.get(selector).click({ scrollBehavior: false, force: true });
});
Cypress.Commands.add("OpenBoutiqueAndAddProductToCartFromBoutiquePage", () => {
  let productName: string = "";
  cy.clickElement(".offer-widget:eq(1)");
  cy.log("✅✅ An Boutique Selected & Click");
  cy.get("[data-cy=boutique_top_info]", { timeout: 20000 }).should(
    "be.visible"
  );
  cy.log("✅✅ The Boutique Page Opened");
  cy.interceptAndWait([
    {
      method: "POST",
      url: "**/boutiques/**",
      alias: "OpenBoutique",
    },
    {
      method: "GET",
      url: "**/api/products/search?&boutique_slugs**",
      alias: "LoadallProducts",
    },
  ]);
  cy.log("✅✅ OpenBoutique & LoadallProducts Requests Arrived");
  cy.get('[data-cy="on_mouse_over_product"]', { timeout: 15000 }).then(
    ($items) => {
      const count = $items.length;
      cy.log(
        `✅✅ Number of items found after clicking the first offer widget: ${count}`
      );
      function processItem(index) {
        if (index >= count) {
          cy.log("✅✅ No more items to process.");
          return;
        }
        cy.get("[data-cy=productName]", { timeout: 15000 })
          .eq(index)
          .invoke("text")
          .then((text) => {
            productName = text.trim();
            cy.log(
              "✅✅ Product Name Obtained & The Product Name Is:",
              productName
            );
            cy.clickElement(`[data-cy=Cart-ByButton]:eq(${index})`);
            cy.interceptAndWait([
              {
                method: "GET",
                url: "**/product/qtyPriceDetails/**",
                alias: "getProductData1",
              },
              {
                method: "GET",
                url: "**/product/likesCommentsSharesDetails/**",
                alias: "getProductData2",
              },
            ]);
            cy.log("✅✅ getProductData1 & getProductData2 Requests Arrived");
            cy.ChexkExistElement("[data-cy=ProductQuantityFinished]").then(
              (exists) => {
                if (exists) {
                  cy.clickElement("[data-cy=Back-Icon-AddToWedgit]");
                  cy.log(
                    `✅✅ Clicked Back-Icon-AddToWedgit for item ${index + 1}`
                  );
                  processItem(index + 1); // Continue looping
                } else {
                  cy.log("✅✅ Product successfully added. Stopping loop.");
                }
              }
            );
          });
      }
      processItem(0);
    }
  );
});
Cypress.Commands.add("verifyProductInCart", (productName: string) => {
  cy.get("[data-cy=productNameInCart]")
    .invoke("text")
    .then((text) => {
      const productNameInCart: string = text.trim(); // Ensure it's a clean string

      // Remove first two and last two characters from both strings
      const trimmedProductName = productName.slice(2, -2);
      const trimmedProductNameInCart = productNameInCart.slice(2, -2);

      console.log("Original Product Name:", productName);
      console.log("Trimmed Product Name:", trimmedProductName);
      console.log("Original Product Name In Cart:", productNameInCart);
      console.log("Trimmed Product Name In Cart:", trimmedProductNameInCart);

      if (trimmedProductNameInCart.indexOf(trimmedProductName) !== -1) {
        console.log(
          "✅ Success: Product name in cart is similar to expected product name"
        );
      } else {
        console.log(
          "Error: Product name in cart does not match the expected similarity"
        );
      }
    });
});
// ***********************************Products Details******************************
Cypress.Commands.add("verifyBoxsInBoutiquePage", () => {
  cy.ChexkExistElement("[data-cy=categoryBox").then((exist) => {
    if (exist) {
      cy.get("[data-cy=categoryBox]", { timeout: 5000 });
      cy.log("✅✅ Category Box Founded");
    } else {
      cy.log("❌❌ Category Box Not Founded");
    }
  });
  cy.ChexkExistElement("[data-cy=brandBox]").then((exist) => {
    if (exist) {
      cy.get("[data-cy=brandBox", { timeout: 5000 });
      cy.log("✅✅ brand Box Founded");
    } else {
      cy.log("❌❌ brand Box Not Founded");
    }
  });
  cy.ChexkExistElement("[data-cy=colorBox]").then((exist) => {
    if (exist) {
      cy.get("[data-cy=colorBox", { timeout: 5000 });
      cy.log("✅✅ color Box Box Founded");
    } else {
      cy.log("❌❌ color Box Not Founded");
    }
  });
  cy.ChexkExistElement("[data-cy=priceBox]").then((exist) => {
    if (exist) {
      cy.get("[data-cy=priceBox", { timeout: 5000 });
      cy.log("✅✅ price Box Box Founded");
    } else {
      cy.log("❌❌ price Box Not Founded");
    }
  });
});
Cypress.Commands.add("verifyComponentsInProductCard", () => {
  cy.get("[data-cy=productName]").should("exist");
  cy.log("✅✅ productName Exists");
  cy.get("[data-cy=productName]").should("not.be.empty");
  cy.get("[data-cy=Cart-ByButton]").contains("Buy").should("exist");
  cy.ChexkExistElement("[data-cy=productPhotoSlider]").then((exist) => {
    if (exist) {
      cy.get("[data-cy=productPhotoSlider]", { timeout: 5000 })
        .eq(0)
        .as("firstProductPhotoSlider");
      cy.get("@firstProductPhotoSlider").should("exist");
      cy.log("✅✅ First Product Photo Slider Exists");
      cy.get("@firstProductPhotoSlider")
        .find("[data-cy=wrapperPhotoSlider]", { timeout: 5000 })
        .as("allWrapperPhotoSliders")
        .its("length")
        .then((count) => {
          cy.log(
            `✅✅ Found ${count} wrapperPhotoSlider inside First Product Photo Slider`
          );
        });
      let textArray = [];
      cy.get("@allWrapperPhotoSliders")
        .eq(0)
        .trigger("mouseover")
        .then(() => {
          cy.get("@allWrapperPhotoSliders")
            .find("[data-cy=TextAboveImageOnSlider]")
            .should("exist")
            .should("be.visible")
            .invoke("text")
            .then((text) => {
              textArray.push(text.trim());
              cy.log(`✅ TextAboveImageOnSlider : ${text.trim()}`);
            });
        })
        .then(() => {
          cy.log(
            "✅✅ All Extracted Texts for First Product Photo Slider:",
            textArray
          );
        });
    } else {
      cy.log("❌❌ There aren't any photos slider");
    }
  });
  cy.scrollTo("bottom");
  cy.get('[data-cy="ReachEnd"]', { timeout: 15000 })
    .should("be.visible")
    .and("contain.text", "Reach End");
});
// ***********************************Orders******************************
Cypress.Commands.add("AddAdress", () => {
  cy.clickElement("[data-cy=expand-map]");
  cy.clickElement("[data-cy=cancel-button]");
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
  cy.get("[data-cy=target-icon]").should("exist");
  cy.get("[data-cy=Select-From-List]")
    .should("exist")
    .should("contain", "Select From List");
  cy.get("[data-cy=country-flag]").should("exist");
  cy.get("[data-cy=region-div]").should("exist");
  // Assuming you have a way to mock or set the country prop
  cy.get("[data-cy=country-extend]").should("exist").contains("Syria"); // Replace 'Country Name' with the expected country name
  // Check for default values when address details are not provided
  cy.get("[data-cy=Province-extend]").should("exist").contains("Province");
  cy.get("[data-cy=Town-extend]").should("exist").contains("Town");
  cy.get("[data-cy=Suburb-extend]").should("exist").contains("Suburb");
  cy.get("[data-cy=SearchProvince-District-Town-Street]").should("exist");
  // Check if the DebounceInput has the correct placeholder
  cy.get('[data-cy="SearchProvince-District-Town-Street"]').should(
    "have.attr",
    "placeholder",
    "Search Province | District | Town | Street"
  );
  cy.get("[data-cy=search-svg]").should("exist");
  cy.clickElement("[data-cy=SearchProvince-District-Town-Street]");
  // cy.get(".absolute.top-[11px].left-[12px]").should("exist");
  cy.get('[data-cy="SearchProvince-District-Town-Street"]').should(
    "have.attr",
    "placeholder",
    "Search Province | District | Town | Street"
  );
  // Simulate loading state
  cy.intercept("POST", "**/api/addresses/get-address-by-text").as(
    "GetAddressByText"
  );
  cy.get('[data-cy="SearchProvince-District-Town-Street"]').type("Latakia", {
    force: true,
    scrollBehavior: false,
  });
  cy.wait("@GetAddressByText").then((interception) => {
    expect(interception.response.statusCode).to.be.eq(200);
    cy.log("✅✅ Get Address By Text request arrived");
  });
  cy.clickElement("[data-cy=Firstly-Search-Result]:eq(0)");
  cy.log("✅✅ First Option Has Been Selected");
  cy.get("[data-cy=Detailed-Address-field]").should("exist");
  cy.log("✅✅ Detailed-Address-field founded");
  cy.get("[data-cy=Detailed-Address-statement]")
    .should("exist")
    .contains("Detailed Address & Note");
  cy.log("✅✅ Detailed-Address-statement founded");
  cy.get("[data-cy=Detailed-Address-Note]").should("exist");
  cy.log("✅✅ Detailed-Address-Note founded");
  cy.get("[data-cy=text-area-placeholder]").should("exist");
  cy.log("✅✅ text-area-placeholder founded");
  cy.get("[data-cy=text-area-placeholder]").should(
    "have.attr",
    "placeholder",
    "Write The Address Clearly, Including The Street Address, Building, Flat, Door, Unit."
  );
  cy.clickElement("[data-cy=text-area-placeholder]") // Selects the textarea inside the div
    .type("This Is A Test Detailed Address & Note", {
      force: true,
      scrollBehavior: false,
    });
  cy.log("✅✅ Clicked and Filled Detailed Address & Note Input");
  cy.get("[data-cy=address-title]").should("exist");
  cy.log("✅✅ address-title founded");
  cy.get("[data-cy=add-Address-statement]")
    .should("exist")
    .contains("Address Title");
  cy.log("✅✅ add-Address-statement founded");
  cy.get("[data-cy=Address-Title]").should("exist");
  cy.log("✅✅ Address-Title founded");
  cy.get("[data-cy=add-address-input]").should("exist");
  cy.log("✅✅ add-address-input founded");
  cy.get("[data-cy=add-address-input]").should(
    "have.attr",
    "placeholder",
    "Ex: Home, My Office, 2 Home Ect."
  );
  cy.clickElement("[data-cy=add-address-input]") // Selects the textarea inside the div
    .type("This Is A Test Address Title", {
      force: true,
      scrollBehavior: false,
    });
  cy.log("✅✅ Clicked and Filled Address Title Input");
  cy.get("[data-cy=container-name-phone]").should("exist");
  cy.log("✅✅ container-name-phone founded");
  cy.get("[data-cy=contact-info-icon]").should("exist");
  cy.log("✅✅ contact-info-icon founded");
  cy.get("[data-cy=contact-info-text]")
    .should("exist")
    .contains("Contact Info");
  cy.log("✅✅ contact-info-text founded");
  cy.get("[data-cy=Address-info-icon]").should("exist");
  cy.log("✅✅ Address-info-icon founded");
  cy.get("[data-cy=name-container]").should("exist");
  cy.log("✅✅ name-container founded");
  cy.get("[data-cy=recipient-name-statement]")
    .should("exist")
    .contains("Recipient Name");
  cy.log("✅✅ recipient-name-statement founded");
  cy.get("[data-cy=Recipient-Name]").should("exist");
  cy.log("✅✅ Recipient-Name founded");
  cy.get("[data-cy=recipient-name-input]").should("exist");
  cy.log("✅✅ recipient-name-input founded");
  cy.get("[data-cy=recipient-name-input]").should(
    "have.attr",
    "placeholder",
    "Enter Full Recipient Name"
  );
  cy.clickElement("[data-cy=recipient-name-input]") // Selects the textarea inside the div
    .type("This Is A Test Recipient Name", {
      force: true,
      scrollBehavior: false,
    });
  cy.log("✅✅ Clicked and Filled Recipient Name Input");
  cy.get("[data-cy=phone-container]").should("exist");
  cy.log("✅✅ phone-container founded");
  cy.get("[data-cy=phone-statement]").should("exist").contains("Contact Phone");
  cy.log("✅✅ phone-statement founded");
  cy.get("[data-cy=Contact-Phone]").should("exist");
  cy.log("✅✅ Contact-Phone founded");
  cy.get("[data-cy=Contact-Phone-input]").should("exist");
  cy.log("✅✅ Contact-Phone-input founded");
  cy.get("[data-cy=Contact-Phone-input]").should(
    "have.attr",
    "placeholder",
    "Enter Recipient Phone"
  );
  cy.clickElement("[data-cy=Contact-Phone-input]") // Selects the textarea inside the div
    .type("0963937764641", {
      force: true,
      scrollBehavior: false,
    });
  cy.log("✅✅ Clicked and Filled Contact Phone Input");
  cy.get("[data-cy=altarnative-Phone-container]").should("exist");
  cy.log("✅✅ altarnative-Phone-container founded");
  cy.get("[data-cy=altarnative-Phone-statement]")
    .should("exist")
    .contains("Alternative Phone");
  cy.log("✅✅ altarnative-Phone-statement founded");
  cy.get("[data-cy=optional-statement]").should("exist").contains("(Optional)");
  cy.log("✅✅ optional-statement founded");
  cy.get("[data-cy=optional-input]").should("exist");
  cy.log("✅✅ optional-input founded");
  cy.get("[data-cy=optional-input]").should(
    "have.attr",
    "placeholder",
    "Enter Alternative Recipient Phone"
  );
  cy.clickElement("[data-cy=optional-input]") // Selects the textarea inside the div
    .type("0963937764641", {
      force: true,
      scrollBehavior: false,
    });
  cy.log("✅✅ Clicked and Filled Contact Phone Input");
  // add - address - buttons - container;
  cy.get("[data-cy=add-address-buttons-container]").should("exist");
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
Cypress.Commands.add(
  "OpenBoutiqueAndAddProductToCartFromBoutiqueDatailPage",
  () => {
    let productName: string = "";
    cy.clickElement(".offer-widget:eq(1)");
    cy.log("✅✅ An Boutique Selected & Click");
    cy.get("[data-cy=boutique_top_info]", { timeout: 20000 }).should(
      "be.visible"
    );
    cy.log("✅✅ The Boutique Page Opened");
    cy.interceptAndWait([
      {
        method: "POST",
        url: "**/boutiques/**",
        alias: "OpenBoutique",
      },
      {
        method: "GET",
        url: "**/api/products/search?&boutique_slugs**",
        alias: "LoadallProducts",
      },
    ]);
    cy.log("✅✅ OpenBoutique & LoadallProducts Requests Arrived");
    cy.get('[data-cy="on_mouse_over_product"]').then(($items) => {
      const count = $items.length;
      cy.log(
        `✅✅ Number of items found after clicking the first offer widget: ${count}`
      );
      function processItem(index) {
        if (index >= count) {
          cy.log("✅✅ No more items to process.");
          return;
        }
        cy.get("[data-cy=productName]")
          .eq(index)
          .invoke("text")
          .then((text) => {
            productName = text.trim();
            cy.log(
              "✅✅ Product Name Obtained & The Product Name Is:",
              productName
            );
            cy.intercept("Get", "**/product/likesCommentsSharesDetails/**").as(
              "getProductData2"
            );
            cy.clickElement(`[data-cy=on_mouse_over_product]:eq(${index})`);
            cy.wait("@getProductData2").then((interception) => {
              expect(interception.response.statusCode).to.be.eq(200);
            });
            cy.clickElement("[data-cy=addToCartButton_productPage]");
            cy.log(
              "✅✅ Add To Cart Button Thats Founded In Product Page Clicked"
            );
            cy.ChexkExistElement("[data-cy=ProductQuantityFinished]").then(
              (exists) => {
                if (exists) {
                  cy.clickElement(
                    "[data-cy=BackIcon-WhenAddFromProductDetails]"
                  );
                  cy.clickElement("[data-cy=backIcon_productPage]");
                  cy.log(
                    `✅✅ Clicked Back-Icon-AddToWedgit for item ${index + 1}`
                  );
                  processItem(index + 1); // Continue looping
                } else {
                  cy.log("✅✅ Product successfully added. Stopping loop.");
                }
              }
            );
          });
      }
      processItem(0);
    });
  }
);
Cypress.Commands.add("ClickAddToCartAndWaitRequest", () => {
  cy.intercept("POST", /\/cart\/(add|update)/).as("CartRequest");
  cy.clickElement("[data-cy=AddToCartButton-data-cy]");
  cy.wait("@CartRequest", { timeout: 30000 }).then((interception) => {
    if (interception?.response) {
      expect(interception.response.statusCode).to.eq(200);
    } else {
      console.warn("❌❌ @CartRequest was not intercepted or has no response.");
    }
  });
  cy.log(
    "✅✅ CartRequest Request Arrived & Click On Add To Cart Button Button"
  );
});
Cypress.Commands.add("ComplateAddProductOperationAndGoCartPage", () => {
  cy.OpenBoutiqueAndAddProductToCartFromBoutiqueDatailPage();
  cy.ClickAddToCartAndWaitRequest();
  cy.clickElement("[data-cy=CartIcon_Productpage]");
  cy.log("✅✅ Click On Cart Icon & Open Cart Page");
});
Cypress.Commands.add("ConfirmAndComplateOrderButton", () => {
  cy.clickElement("[data-cy=Confirm-Order-Button]");
  cy.log("✅✅ Confirm & Countinue Button Clicked");
  cy.get("[data-cy=FieldToInputNumber]").then((exist) => {
    if (!exist) {
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
    } else {
      cy.log("❌❌ Should Complate Login Operation");
    }
  });
});
Cypress.Commands.add(
  "ChooseBoutiqueAndVerifyComponentsAndBoxsInBoutiquePage",
  () => {
    cy.clickElement(".offer-widget:eq(1)");
    cy.log("✅✅ An Boutique Selected & Click");
    cy.get("[data-cy=boutique_top_info]", { timeout: 30000 }).should(
      "be.visible"
    );
    cy.log("✅✅ The Boutique Page Opened");
    cy.interceptAndWait([
      {
        method: "POST",
        url: "**/boutiques/**",
        alias: "OpenBoutique",
      },
      {
        method: "GET",
        url: "**/api/products/search?&boutique_slugs**",
        alias: "LoadallProducts",
      },
    ]);
    cy.log("✅✅ OpenBoutique & LoadallProducts Requests Arrived");
    cy.verifyBoxsInBoutiquePage();
    cy.verifyComponentsInProductCard();
    cy.intercept("Get", "**/product/likesCommentsSharesDetails/**").as(
      "getProductData2"
    );
    cy.clickElement("[data-cy=on_mouse_over_product]:eq(0)");
    cy.wait("@getProductData2").then((interception) => {
      expect(interception.response.statusCode).to.be.eq(200);
    });
    cy.log(
      "✅✅ The Card Of The First Product Is Clicked & The Page Of Product Is Opned"
    );
  }
);
