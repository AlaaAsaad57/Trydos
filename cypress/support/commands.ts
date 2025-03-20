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
Cypress.Commands.add("Exist1", (selector) => {
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
      cy.Exist("[data-cy=logout]").then((exists) => {
        if (exists) {
          cy.get("[data-cy=logout]").click({ force: true });
          cy.log("✅✅ You have successfully logged out");
        }
      });
    }
  });
});
Cypress.Commands.add("typePincode", (pincode: string) => {
  const digits = pincode.split(""); // Split the pincode into individual digits
  digits.forEach((digit, index) => {
    cy.get(`.pincode-input-text:nth-child(${index + 1})`, {
      timeout: 3000,
    }).type(digit, {
      scrollBehavior: false,
    });
  });
});
// **********************************AddedLast**********************************************
Cypress.Commands.add("typePincode1", (pincode: string) => {
  cy.get(".pincode-input-text").first().focus(); // Ensure the first input field gets focus

  const digits = pincode.split(""); // Split the pincode into individual digits
  digits.forEach((digit, index) => {
    cy.get(`.pincode-input-text:nth-child(${index + 1})`, {
      timeout: 3000,
    }).type(digit, { scrollBehavior: false });
  });
});
Cypress.Commands.add("enterPhoneNumber11", (phoneNumber: string) => {
  phoneNumber.split("").forEach((char) => {
    cy.get("#phoneInput")
      .type(char, { delay: 200, force: true, scrollBehavior: false }) // Force typing into the hidden input
      .should("be.focused"); // Verify that the input is still focused
  });
  cy.get("#phoneInput").type("{enter}", { force: true, scrollBehavior: false });
});

// **********************************AddedLast**********************************************
Cypress.Commands.add("enterPhoneNumber1", (phoneNumber: string) => {
  cy.get("#phoneInput").click({ scrollBehavior: false, force: true });
  cy.get("#phoneInput").type(`${phoneNumber}{enter}`, {
    force: true,
    scrollBehavior: false,
  });
});
Cypress.Commands.add("reEnterPhoneNumber", (phoneNumber: string) => {
  cy.clickElementForce("[data-cy=Edit-Phone-Number]");
  cy.log("✅✅ Back To Write Correct Number Phone Successfuly");
  cy.get("#phoneInput").type(`${phoneNumber}`, {
    scrollBehavior: false,
  });
  cy.clickElementForce(".phone-arrow");
});
Cypress.Commands.add("enterPhoneNumber", (phoneNumber: string) => {
  cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
  cy.get("#phoneInput").click({ scrollBehavior: false, force: true });
  cy.get("#phoneInput").type(`${phoneNumber}{enter}`, {
    scrollBehavior: false,
    force: true,
  });
  cy.get(".message-recieve-option:nth-child(1)").click({
    scrollBehavior: false,
    force: true,
  });
  cy.wait("@sendOtpApi");
});
Cypress.Commands.add("performLogin", (s?: string) => {
  cy.viewport(783, 824);
  let count = 0;
  cy.intercept("POST", "**/login", () => {
    count += 1;
  }).as("login");
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.get("[data-cy=login-widget-container]", { timeout: 30000 });
  cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false }); //have account
  cy.Exist("[data-cy=login-method-phone]").then((exist) => {
    if (exist) {
      cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
    }
  });
  cy.wait(1000);
  cy.enterPhoneNumber(s || "963937288307");
  cy.typePincode("999999");
  cy.get("[data-testid=login-close-icon]").click({
    scrollBehavior: false,
  });
  cy.wait("@login").then((interception) => {
    cy.log("✅ login request arrived");
    console.log("login request arrived");
  });
  cy.wait(500).then(() => {
    cy.log(`Count is: ${count}`);
    console.log("Count is" + count);
  });
});
// ********************************************************
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
  cy.enterPhoneNumber1("963937764641");
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
  cy.wait("@login", { timeout: 10000 }).then((interception) => {
    cy.log("✅✅ login request arrived");
  });

  cy.wait(500).then(() => {
    cy.log(`Count is: ${count}`);
    expect(count).to.be.greaterThan(1);
  });
});
// ********************************************************
Cypress.Commands.add("performErrorLogin", () => {
  let count = 0;
  cy.intercept("POST", "**/login1", () => {
    count += 1;
  }).as("login1");
  cy.viewport(783, 824);
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.get("[data-cy=login-widget-container]", { timeout: 30000 });
  cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false }); //have account
  cy.Exist("[data-cy=login-method-phone]").then((exist) => {
    if (exist) {
      cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
    }
  });
  cy.wait(1000);
  cy.enterPhoneNumber("963937764641");
  cy.typePincode("499999");
  cy.get(".input-failed", { timeout: 5000 }).should("be.visible");
  cy.get("[data-testid=login-close-icon]").click({
    scrollBehavior: false,
  });
  expect(count).to.be.equal(0);
  cy.get("@login1").then((alias) => {
    if (alias) {
      cy.wait("@login1").then((interception) => {
        cy.log("✅ login request arrived");
        console.log("login request arrived");
      });
    } else {
      cy.log("❌❌ login request did not arrive");
      console.warn("login request did not arrive");
    }
  });
});
Cypress.Commands.add("performExpireOtpLogin", () => {
  cy.logout();
  cy.reload();
  let count = 0;
  cy.intercept("POST", "**/login2", () => {
    count += 1;
  }).as("login2");
  cy.viewport(783, 824);
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.get("[data-cy=login-widget-container]", { timeout: 30000 });
  cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false }); //have account
  cy.Exist("[data-cy=login-method-phone]").then((exist) => {
    if (exist) {
      cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
    }
  });
  cy.wait(1000);
  cy.enterPhoneNumber("963753159877");

  cy.wait(70000);
  cy.Exist(".resend-code-button").then((s) => {
    if (s) {
      cy.get(".resend-code-button").click({ scrollBehavior: false });
      cy.typePincode("999999");
    } else {
      expect(1).to.equal(2);
    }
  });
  cy.get("[data-testid=login-close-icon]").click({
    scrollBehavior: false,
  });
  cy.get("@login2", { timeout: 10000 }).then((alias) => {
    if (alias) {
      cy.wait("@login2").then((interception) => {
        cy.log("✅ login request arrived");
        console.log("login request arrived");
      });
    } else {
      cy.log("❌❌ login request did not arrive");
      console.warn("login request did not arrive");
    }
  });
});
Cypress.Commands.add("Performloginfailure", () => {
  cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
    req.continue((res) => {
      res.body.data.already_exists = false; // Fake email field
    });
  }).as("verifyOtpSignin");
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.get("[data-cy=login-widget-container]", { timeout: 30000 });
  cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false }); //have account
  cy.Exist("[data-cy=login-method-phone]").then((exist) => {
    if (exist) {
      cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
    }
  });
  cy.wait(1000);
  cy.enterPhoneNumber("963937288307");
  cy.typePincode("999999");
  cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
    console.log(interception);
  });
  cy.get(".not-registered").should("be.visible");
  cy.get("[data-testid=login-close-icon]").click({
    scrollBehavior: false,
  });
});

// **************************Sign up*************************** *//
Cypress.Commands.add("signupProcess", () => {
  let count = 0;
  cy.intercept("POST", "**/login", () => {
    count += 1;
  }).as("login");
  cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
    req.continue((res) => {
      res.body.data.already_exists = false;
    });
  }).as("verifyOtpSignin");
  cy.logout();
  cy.viewport(783, 824);
  cy.get(".en-regular:nth-child(2)").click({ force: true });
  cy.get("[data-cy=login-widget-container]", { timeout: 30000 });
  cy.get(".login-button:nth-child(2)").click({ force: true });
  cy.get(".agree-terms").click({ force: true });
  cy.enterPhoneNumber("963937288307");
  cy.typePincode("999999");
  cy.clickElementForce("[data-cy=inputToWriteName]");
  cy.get("[data-cy=InputFiledForName]")
    .type("Alaa Asaad", { force: true, scrollBehavior: false })
    .should("have.value", "Alaa Asaad"); // Ensure text was typed
  cy.get(".phone-arrow").click({ scrollBehavior: false });
  cy.clickElementForce("[data-cy=skipForNow]");
  cy.wait(5000).then(() => {
    cy.log(`Count is: ${count}`);
    expect(count).to.be.greaterThan(1);
  });
  cy.get("@login", { timeout: 10000 }).then((alias) => {
    if (alias) {
      cy.wait("@login", { timeout: 10000 }).then((interception) => {
        cy.log("✅ login request arrived");
        console.log("login request arrived");
      });
    } else {
      cy.log("❌❌ login request did not arrive");
      console.warn("login request did not arrive");
    }
  });
  cy.get("@verifyOtpSignin", { timeout: 10000 }).then((alias) => {
    if (alias) {
      cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
        console.log(interception);
      });
    } else {
      console.warn("❌❌ verifyOtpSignin alias does not exist");
    }
  });
});
Cypress.Commands.add("failedSignupProcess", () => {
  let count = 0;
  cy.intercept("POST", "**/login", () => {
    count += 1;
  }).as("login1");
  cy.viewport(783, 824);
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.get("[data-cy=login-widget-container]", { timeout: 30000 });
  cy.get(".login-button:nth-child(2)").click({ scrollBehavior: false });
  cy.get(".agree-terms").click({ scrollBehavior: false });
  cy.enterPhoneNumber("963937288307");
  cy.typePincode("499999");
  cy.get(".input-failed", { timeout: 10000 }).should("be.visible");
  cy.get("[data-testid=login-close-icon]").click({
    scrollBehavior: false,
  });
  cy.wait(5000).then(() => {
    cy.log(`Count is: ${count}`);
    expect(count).to.be.equal(0);
  });
  cy.get("@login1", { timeout: 10000 }).then((alias) => {
    if (alias) {
      cy.wait("@login", { timeout: 10000 }).then((interception) => {
        cy.log("✅ login request arrived");
        console.log("login request arrived");
      });
    } else {
      cy.log("❌❌ login request did not arrive");
      console.warn("login request did not arrive");
    }
  });
});
Cypress.Commands.add("alreadyRegisteredSignup", () => {
  cy.logout();
  cy.viewport(783, 824);
  cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
    req.continue((res) => {
      res.body.data.already_exists = true;
    });
  }).as("verifyOtpSignin");
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.get(".login-button:nth-child(2)").click({ scrollBehavior: false });
  cy.get("[data-cy=agree-terms]").click({ scrollBehavior: false });
  cy.enterPhoneNumber("963937288307");
  cy.typePincode("999999");
  cy.get("@verifyOtpSignin", { timeout: 10000 }).then((alias) => {
    if (alias) {
      cy.wait("@verifyOtpSignin", { timeout: 10000 }).then((interception) => {
        console.log(interception);
      });
    } else {
      console.warn("❌❌ verifyOtpSignin alias does not exist");
    }
  });
  cy.get(".already-registered").should("be.visible");
  cy.get("[data-testid=login-close-icon]").click();
});
// ************************ Open Cart **************************************
Cypress.Commands.add("interceptAndWait", (routes) => {
  // Iterate through the provided routes and set up intercepts
  routes.forEach((route) => {
    cy.intercept(route.method || "GET", route.url).as(route.alias);
  });
  const aliases = routes.map((route) => `@${route.alias}`);
  cy.wait(aliases, { timeout: 30000 }); // Adjust timeout as needed
});
Cypress.Commands.add("clickElementScroll", (selector: string) => {
  cy.get(selector).click({ scrollBehavior: false });
});
Cypress.Commands.add("clickElementForce", (selector: string) => {
  cy.get(selector).click({ force: true });
});
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
  cy.Exist1("[data-cy=categoryBox").then((exist) => {
    if (exist) {
      cy.get("[data-cy=categoryBox", { timeout: 5000 });
      cy.log("✅✅ Category Box Founded");
    } else {
      cy.log("❌❌ Category Box Not Founded");
    }
  });
  cy.Exist1("[data-cy=brandBox").then((exist) => {
    if (exist) {
      cy.get("[data-cy=brandBox", { timeout: 5000 });
      cy.log("✅✅ brand Box Founded");
    } else {
      cy.log("❌❌ brand Box Not Founded");
    }
  });
  cy.Exist1("[data-cy=colorBox").then((exist) => {
    if (exist) {
      cy.get("[data-cy=colorBox", { timeout: 5000 });
      cy.log("✅✅ color Box Box Founded");
    } else {
      cy.log("❌❌ color Box Not Founded");
    }
  });
  cy.Exist1("[data-cy=priceBox").then((exist) => {
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
  cy.Exist1("[data-cy=productPhotoSlider]").then((exist) => {
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
  // cy.scrollTo("bottom");
  // cy.get('[data-cy="ReachEnd"]', { timeout: 15000 })
  //   .should("be.visible")
  //   .and("contain.text", "Reach End");
});
// ***********************************Orders******************************
Cypress.Commands.add("AddProductToCart", () => {
  let productName = "";
  cy.clickElementForce(".offer-widget:nth-child(6)");
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
  cy.clickElementScroll("[data-cy=AddToCartButton-data-cy]");
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
  cy.clickElementForce("[data-cy=back_icon_boutique_page]");
  cy.log("✅✅ Dual Back Icon Clicked & Returned To Main Page");
});
// ***********************************Orders******************************
Cypress.Commands.add("AddAdress", () => {
  cy.clickElementForce("[data-cy=Change-From-List]");
  cy.log("✅✅ Change Place From List Button Clicked");
  cy.get("[data-cy=Extended-Choose-Area]").should("exist");
  cy.log("✅✅ Extended Box To Choose Area Apperead");
  cy.clickElementForce("[data-cy=SearchProvince-District-Town-Street]");
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

  cy.clickElementForce("[data-cy=Detailed-Address-Note]");
  cy.log("✅✅ Click On Detailed Address & Note Field");
  cy.get("[data-cy=Detailed-Address-Note]").type(
    "This Is A Test Detailed Address & Note",
    {
      force: true,
      scrollBehavior: false,
    }
  );
  cy.log("✅✅ Detailed Address & Note Input Filled");

  cy.clickElementForce("[data-cy=Address-Title]");
  cy.log("✅✅ Click On Add Address Title Field");
  cy.get('[data-cy="Address-Title"]').type("This Is A Test Address Title", {
    force: true,
    scrollBehavior: false,
  });
  cy.log("✅✅ Address Title Input Filled");

  cy.clickElementForce("[data-cy=Recipient-Name]");
  cy.log("✅✅ Click On Recipient Name Field");
  cy.get('[data-cy="Recipient-Name"]').type("This Is A Test Recipient Name", {
    force: true,
    scrollBehavior: false,
  });
  cy.log("✅✅ Recipient Name Input Filled");

  cy.clickElementForce("[data-cy=Contact-Phone]");
  cy.log("✅✅ Click On Contact Phone Field");
  cy.get('[data-cy="Contact-Phone"]').type("0963937764641", {
    force: true,
    scrollBehavior: false,
  });
  cy.log("✅✅ Contact Phone Input Filled");

  cy.clickElementForce("[data-cy=AddSaveButton]");
  cy.log("✅✅ Add & Save Button Clicked");
});
// *********************************************
Cypress.Commands.add("AddProductToCartThenComplateOrder", () => {
  let productName = "";
  cy.clickElementForce(".offer-widget:nth-child(6)");
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
  cy.clickElementScroll("[data-cy=AddToCartButton-data-cy]");
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
  cy.clickElementForce("[data-cy=cartIcon_mainPage]");
});
