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
      cy.stub(win.Notification, "requestPermission").resolves("granted");
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
  cy.get("[data-cy=avatar-options]").click({ scrollBehavior: false });
  cy.Exist("[data-cy=logout]").then((exists) => {
    if (exists) {
      cy.get("[data-cy=logout]").click({ scrollBehavior: false });
      cy.log("✅✅ You have successfully logged out");
    } else {
      cy.get("[data-cy=avatar-options]").click({ scrollBehavior: false });
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
Cypress.Commands.add("enterPhoneNumber1", (phoneNumber: string) => {
  cy.get("#phoneInput").type(`${phoneNumber}{enter}`, {
    scrollBehavior: false,
  });
});
Cypress.Commands.add("enterPhoneNumber", (phoneNumber: string) => {
  cy.intercept("GET", "**/api/new_v1/phone/send_otp?**").as("sendOtpApi");
  cy.get("#phoneInput").click({ scrollBehavior: false });
  cy.get("#phoneInput").type(`${phoneNumber}{enter}`, {
    scrollBehavior: false,
  });
  cy.get(".message-recieve-option:nth-child(1)").click({
    scrollBehavior: false,
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
  cy.get("[data-cy=login-widget-container]", { timeout: 15000 });
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
  cy.get("@login", { timeout: 10000 }).then((alias) => {
    if (alias) {
      cy.wait("@login").then((interception) => {
        cy.log("✅ login request arrived");
        console.log("login request arrived");
      });
    } else {
      cy.log("❌❌ login request did not arrive");
      console.warn("login request did not arrive");
    }
  });
  cy.wait(5000).then(() => {
    cy.log(`Count is: ${count}`);
    console.log("Count is" + count);
    // expect(count).to.be.greaterThan(0);
  });
});
Cypress.Commands.add("performErrorLogin", () => {
  let count = 0;
  cy.intercept("POST", "**/login1", () => {
    count += 1;
  }).as("login1");
  cy.viewport(783, 824);
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.get("[data-cy=login-widget-container]", { timeout: 15000 });
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
  cy.get("[data-cy=login-widget-container]", { timeout: 15000 });
  cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false }); //have account
  cy.Exist("[data-cy=login-method-phone]").then((exist) => {
    if (exist) {
      cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
    }
  });
  cy.wait(1000);
  cy.enterPhoneNumber("963753159877");
  cy.wait(130000);
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
  cy.get("[data-cy=login-widget-container]", { timeout: 15000 });
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
  cy.get("[data-cy=login-widget-container]", { timeout: 15000 });
  cy.get(".login-button:nth-child(2)").click({ force: true });
  cy.get(".agree-terms").click({ force: true });
  cy.enterPhoneNumber("963937288307");
  cy.typePincode("999999");
  cy.clickElementForce("[data-cy=inputToWriteName]");
  cy.get("[data-cy=InputFiledForName]")
    .type("Alaa Asaad", { force: true })
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
  cy.get("[data-cy=login-widget-container]", { timeout: 15000 });
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
  cy.wait(aliases, { timeout: 20000 }); // Adjust timeout as needed
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
  cy.Exist("[data-cy=productPhotoSlider]").then((exist) => {
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
  cy.get('[data-cy="ReachEnd"]')
    .should("be.visible")
    .and("contain.text", "Reach End");
});
