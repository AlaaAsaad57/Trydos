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
          cy.log("sd");
          cy.get("#country").select("TR");
        }
      });
    }
  });
});
Cypress.Commands.add("Exist", (selector) => {
  cy.wait(3000);
  cy.get("body")
    .should("exist")
    .then(($body) => {
      return new Cypress.Promise((resolve, reject) => {
        if ($body.find(selector).length > 0) {
          console.log("cy.exist() - Matching element found in DOM!");
          resolve(true);
        } else {
          console.log("cy.exist() - Element did not exist!");
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
          console.log("cy.exist() - Matching element found in DOM!");
          resolve(true);
        } else {
          console.log("cy.exist() - Element did not exist!");
          resolve(false);
        }
      });
    });
});
Cypress.Commands.add("logout", () => {
  cy.Exist("[data-cy=Logout-ReLogout]").then((exist) => {
    if (exist) {
      cy.get("[data-cy=Logout-ReLogout]").click({ force: true });
      cy.get("[data-cy=logout]").click({ force: true });
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
  cy.wait("@sendOtpApi");
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
        cy.wait("@sendOtpApi");
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
  cy.clickElement("[data-cy=InputFiledForName]");
  cy.get("[data-cy=InputFiledForName]", { timeout: 10000 })
    .type("Abdo Hamdan", { force: true })
    .should("have.value", "Abdo Hamdan"); // Ensure text was typed
  cy.log("✅✅ User Name is Writ In Input Field");
  cy.clickElement(".phone-arrow");
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
    cy.log("✅✅ login request arrived");
  });
  cy.wait("@Stories", { timeout: 10000 }).then((interception) => {
    cy.log("✅✅ Stories request arrived");
  });
  cy.wait(500).then(() => {
    cy.log(`Count is: ${count}`);
    expect(count).to.be.greaterThan(2);
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
Cypress.Commands.add("performLogin1", (s?: string) => {
  cy.WaitUntilLoadWebsiteAndlogoutAndViewport();
  cy.OpenLoginInterface();
  cy.HaveAccount();
  cy.ComplateLoginByMobilePhone();
  cy.enterPhoneNumber("963937764641");
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
  cy.clickElement(".offer-widget:eq(2)");
  cy.log("✅✅ An Boutique Selected & Click");
  cy.get("[data-cy=boutique_top_info]", { timeout: 10000 }).should(
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
  });
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
  cy.get("[data-cy=Detailed-Address-Note] textarea") // Selects the textarea inside the div
    .click()
    .type("This Is A Test Detailed Address & Note", {
      force: true,
      scrollBehavior: false,
    });

  cy.log("✅✅ Clicked and Filled Detailed Address & Note Input");
  cy.get('[data-cy="Address-Title"] input') // Selects the input inside the div
    .click()
    .type("This Is A Test Address Title", {
      force: true,
      scrollBehavior: false,
    });
  cy.log("✅✅ Clicked and Filled Address Title Input");
  cy.get('[data-cy="Recipient-Name"] input') // Selects the input inside the div
    .click()
    .type("This Is A Test Recipient Name", {
      force: true,
      scrollBehavior: false,
    });
  cy.log("✅✅ Clicked and Filled Recipient Name Input");
  cy.get('[data-cy="Contact-Phone"] input') // Selects the input inside the div
    .click()
    .type("0963937764641", { force: true, scrollBehavior: false });

  cy.log("✅✅ Clicked and Filled Contact Phone Input");
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
    cy.clickElement(".offer-widget:eq(4)");
    cy.log("✅✅ An Boutique Selected & Click");
    cy.get("[data-cy=boutique_top_info]", { timeout: 10000 }).should(
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
            cy.wait("@getProductData2");
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
  cy.wait("@CartRequest", { timeout: 10000 }).then((interception) => {
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
});
Cypress.Commands.add(
  "ChooseBoutiqueAndVerifyComponentsAndBoxsInBoutiquePage",
  () => {
    cy.clickElement(".offer-widget:eq(4)");
    cy.log("✅✅ An Boutique Selected & Click");
    cy.get("[data-cy=boutique_top_info]", { timeout: 10000 }).should(
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
    cy.clickElement("[data-cy=on_mouse_over_product]:eq(0)");
    cy.log(
      "✅✅ The Card Of The First Product Is Clicked & The Page Of Product Is Opned"
    );
  }
);
