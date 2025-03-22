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
      cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
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
  cy.get(".message-recieve-option:nth-child(2)").click({
    scrollBehavior: false,
    force: true,
  });
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
        cy.get(".message-recieve-option:nth-child(2)").click({
          scrollBehavior: false,
        });
        cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
        cy.wait("@sendOtpApi");
        cy.log("✅✅ Send Otp Api Request Successfuly");
      });
    }
  });
});
Cypress.Commands.add("EndLoginOperation", () => {
  cy.get("[data-testid=login-close-icon]").click({
    scrollBehavior: false,
    force: true,
  });
});
Cypress.Commands.add("InputFieldNameVisible", () => {
  cy.clickElement("[data-cy=inputToWriteName]").should("be.visible");
  cy.log("✅✅ Input Field For Writ User Name is clicked on");
});
Cypress.Commands.add("TypeName", () => {
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
  let count = 0;
  cy.wait(3000);
  cy.logout();
  cy.viewport(783, 824);
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.get("[data-cy=login-widget-container]", { timeout: 30000 });
  cy.log("✅✅ Click On Login Icon & Open Its Interface");
  cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false }); //have account
  cy.log("✅✅ Click On I Have Already Acount Button");
  cy.Exist("[data-cy=login-method-phone]").then((exist) => {
    if (exist) {
      cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
      cy.log("✅✅ The User Attempt LogIn From Mobile Phone");
    } else {
      cy.log("✅✅ User Does Not Attempt LogIn From Mobile Phone");
    }
  });
  cy.enterPhoneNumber("963937764641");
  cy.log("✅✅ Number Phone Entered Successfuly");
  cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
  cy.get(".message-recieve-option:nth-child(2)").click({
    scrollBehavior: false,
  });
  cy.log("✅✅ Recive Otp Code By SMS Button Clicked Successfuly");
  cy.wait("@sendOtpApi");
  cy.log("✅✅ Send Otp Api Request Successfuly");
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
  cy.typePincode("999999");
  cy.log("✅✅ Type Pin Code Entred Successfuly");
  cy.get("[data-testid=login-close-icon]").click({
    scrollBehavior: false,
  });
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
// ****************************************************************************************************************************************
Cypress.Commands.add(
  "getProductNameFirstly",
  (selector = "[data-cy=productName]") => {
    return cy
      .get(selector)
      .eq(0)
      .invoke("text")
      .then((text) => {
        const productName = text.trim(); // Trim spaces to ensure consistency
        cy.log(
          "✅✅ Product Name Obtained & The Product Name Is:",
          productName
        );
        return cy.wrap(productName); // Wrap the value to keep it within Cypress' chainable context
      });
  }
);
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
      cy.get("[data-cy=categoryBox", { timeout: 5000 });
      cy.log("✅✅ Category Box Founded");
    } else {
      cy.log("❌❌ Category Box Not Founded");
    }
  });
  cy.ChexkExistElement("[data-cy=brandBox").then((exist) => {
    if (exist) {
      cy.get("[data-cy=brandBox", { timeout: 5000 });
      cy.log("✅✅ brand Box Founded");
    } else {
      cy.log("❌❌ brand Box Not Founded");
    }
  });
  cy.ChexkExistElement("[data-cy=colorBox").then((exist) => {
    if (exist) {
      cy.get("[data-cy=colorBox", { timeout: 5000 });
      cy.log("✅✅ color Box Box Founded");
    } else {
      cy.log("❌❌ color Box Not Founded");
    }
  });
  cy.ChexkExistElement("[data-cy=priceBox").then((exist) => {
    if (exist) {
      cy.get("[data-cy=priceBox", { timeout: 5000 });
      cy.log("✅✅ price Box Box Founded");
    } else {
      cy.log("❌❌ price Box Not Founded");
    }
  });
});
Cypress.Commands.add("verifyComponentsInProductCard", () => {
  cy.get('[data-cy="productName"]').should("exist");
  cy.log("✅✅ productName Exists");
  cy.get('[data-cy="productName"]').should("not.be.empty");
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
Cypress.Commands.add("AddProductToCart", () => {
  let productName = "";
  cy.clickElement(".offer-widget:nth-child(6)");
  cy.log("✅✅ An Boutique Selected & Click");
  cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
  cy.log("✅✅ The Boutiue Page Opened");
  cy.getProductNameFirstly().then((name) => {
    productName = name;
  });
  cy.get("[data-cy=Cart-ByButton]").eq(0).click({ force: true });
  cy.log("✅✅ Buy Button Clicked");
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
  cy.intercept("POST", /\/cart\/(add|update)/).as("CartRequest");
  cy.clickElement("[data-cy=AddToCartButton-data-cy]");
  cy.wait("@CartRequest", { timeout: 10000 }).then((interception) => {
    if (interception?.response) {
      console.log("✅ Intercepted request addToCart");
      expect(interception.response.statusCode).to.eq(200);
    } else {
      console.warn("❌❌ @CartRequest was not intercepted or has no response.");
    }
  });
  cy.log(
    "✅✅ CartRequest Request Arrived & Click On Add To Cart Button Button"
  );
  cy.clickElement("[data-cy=back_icon_boutique_page]");
  cy.log("✅✅ Dual Back Icon Clicked & Returned To Main Page");
});
// ***********************************Orders******************************
Cypress.Commands.add("AddAdress", () => {
  cy.clickElement("[data-cy=Change-From-List]");
  cy.log("✅✅ Change Place From List Button Clicked");
  cy.get("[data-cy=Extended-Choose-Area]").should("exist");
  cy.log("✅✅ Extended Box To Choose Area Apperead");
  cy.clickElement("[data-cy=SearchProvince-District-Town-Street]");
  cy.log("✅✅ Search Province District Town Street");
  cy.intercept("POST", "**/api/addresses/get-address-by-text").as(
    "GetAddressByText"
  );
  cy.get('[data-cy="SearchProvince-District-Town-Street"]').type("Damascus", {
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
  cy.wait(5000);
  cy.get("[data-cy=Firstly-Search-Result]").eq(0).click({ force: true });
  cy.log("✅✅ First Option Has Been Selected");

  cy.clickElement("[data-cy=Detailed-Address-Note]");
  cy.log("✅✅ Click On Detailed Address & Note Field");
  cy.get("[data-cy=Detailed-Address-Note]").type(
    "This Is A Test Detailed Address & Note",
    {
      force: true,
      scrollBehavior: false,
    }
  );
  cy.log("✅✅ Detailed Address & Note Input Filled");

  cy.clickElement("[data-cy=Address-Title]");
  cy.log("✅✅ Click On Add Address Title Field");
  cy.get('[data-cy="Address-Title"]').type("This Is A Test Address Title", {
    force: true,
    scrollBehavior: false,
  });
  cy.log("✅✅ Address Title Input Filled");

  cy.clickElement("[data-cy=Recipient-Name]");
  cy.log("✅✅ Click On Recipient Name Field");
  cy.get('[data-cy="Recipient-Name"]').type("This Is A Test Recipient Name", {
    force: true,
    scrollBehavior: false,
  });
  cy.log("✅✅ Recipient Name Input Filled");

  cy.clickElement("[data-cy=Contact-Phone]");
  cy.log("✅✅ Click On Contact Phone Field");
  cy.get('[data-cy="Contact-Phone"]').type("0963937764641", {
    force: true,
    scrollBehavior: false,
  });
  cy.log("✅✅ Contact Phone Input Filled");

  cy.clickElement("[data-cy=AddSaveButton]");
  cy.log("✅✅ Add & Save Button Clicked");
});
// *********************************************
Cypress.Commands.add("AddProductToCartThenComplateOrder", () => {
  let productName = "";
  cy.clickElement(".offer-widget:nth-child(6)");
  cy.log("✅✅ An Boutique Selected & Click");
  cy.get("[data-cy=boutique_top_info]", { timeout: 15000 });
  cy.log("✅✅ The Boutiue Page Opened");
  cy.getProductNameFirstly().then((name) => {
    productName = name;
  });
  cy.get("[data-cy=Cart-ByButton]").eq(0).click({ force: true });
  cy.log("✅✅ Buy Button Clicked");
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
  cy.intercept("POST", /\/cart\/(add|update)/).as("CartRequest");
  cy.clickElement("[data-cy=AddToCartButton-data-cy]");
  cy.wait("@CartRequest", { timeout: 10000 }).then((interception) => {
    if (interception?.response) {
      console.log("✅ Intercepted request addToCart");
      expect(interception.response.statusCode).to.eq(200);
    } else {
      console.warn("❌❌ @CartRequest was not intercepted or has no response.");
    }
  });
  cy.log(
    "✅✅ CartRequest Request Arrived & Click On Add To Cart Button Button"
  );
  cy.clickElement("[data-cy=cartIcon_mainPage]");
});
