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
    onBeforeLoad(win) {
      // @ts-ignore
      cy.stub(win.Notification, "permission", "granted");
      cy.stub(win, "Notification").as("Notification");
      console.log(win.location.href);
    },
  });
  cy.url().then((ur) => {
    // @ts-ignore
    if (ur.includes("no-country")) {
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

Cypress.Commands.add("clearAllData", () => {
  // cy.clearAllCookies();
  // cy.clearAllLocalStorage();
  // cy.clearAllSessionStorage();
  cy.logout();
});
Cypress.Commands.add("logout", () => {
  cy.get("[data-cy=avatar-options]").click({ scrollBehavior: false });
  cy.Exist("[data-cy=logout]").then((exists) => {
    if (exists) {
      cy.get("[data-cy=logout]").click({ scrollBehavior: false });
      cy.wait(3000);
    } else {
      cy.get("[data-cy=avatar-options]").click({ scrollBehavior: false });
    }
  });
});
Cypress.Commands.add("clearAllDataWithoutCookies", () => {
  // cy.clearAllLocalStorage();
  // cy.clearAllSessionStorage();
});
Cypress.Commands.add("clearAllDataWithoutSessionStorage", () => {
  // cy.clearAllLocalStorage();
  // cy.clearAllCookies();
});
Cypress.Commands.add("typePincode", (pincode: string) => {
  const digits = pincode.split(""); // Split the pincode into individual digits
  cy.wait(5000);
  digits.forEach((digit, index) => {
    cy.get(`.pincode-input-text:nth-child(${index + 1})`).type(digit, {
      scrollBehavior: false,
    });
  });
});
Cypress.Commands.add("enterPhoneNumber", (phoneNumber: string) => {
  cy.get("#phoneInput").click({ scrollBehavior: false });
  cy.get("#phoneInput").type(`${phoneNumber}{enter}`, {
    scrollBehavior: false,
  });
  cy.Exist(".phone-arrow").then((exist) => {
    if (exist) {
      cy.get(".phone-arrow").click({ scrollBehavior: false });
    }
  });
  cy.get(".message-recieve-option:nth-child(1)").click({
    scrollBehavior: false,
  });
  cy.wait(5000);
});
Cypress.Commands.add("performLogin", () => {
  cy.viewport(783, 824);

  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.wait(10000);
  cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false }); //have account
  cy.wait(5000);
  cy.Exist("[data-cy=login-method-phone]").then((exist) => {
    if (exist) {
      cy.wait(5000);
      cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
    }
  });
  cy.enterPhoneNumber("963937288307");
  cy.typePincode("999999");
  cy.wait(5000);
  cy.Exist("[data-testid=login-close-icon]").then((exist) => {
    if (exist) {
      cy.get("[data-testid=login-close-icon]").click({
        scrollBehavior: false,
      });
    }
  });
});
Cypress.Commands.add("Performloginfailure", () => {
  cy.clearAllData();
  cy.viewport(783, 824);
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false });
  cy.enterPhoneNumber("963937288307");
  cy.typePincode("999999");
  cy.wait("@verifyOtpSignin", { timeout: 20000 }).then((s) => {
    console.log(s);
  });
  cy.wait(5000).then(() => {
    cy.Exist(".not-registered").then((exist) => {
      if (exist) {
        cy.get(".not-registered").should("be.visible");
      }
    });
  });
  cy.wait(5000);
  cy.Exist("[data-testid=login-close-icon]").then((exist) => {
    if (exist) {
      cy.get("[data-testid=login-close-icon]").click({
        scrollBehavior: false,
      });
    }
  });
});
Cypress.Commands.add("performErrorLogin", () => {
  cy.wait(5000);
  cy.viewport(783, 824);
  cy.Exist(".en-regular:nth-child(2)").then((exists) => {
    if (exists) {
      cy.get(".en-regular:nth-child(2)").click({ force: true });
    } else {
      cy.clearAllDataWithoutSessionStorage();
      cy.reload();
      cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    }
  });
  cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false });
  cy.enterPhoneNumber("963937288307");
  cy.typePincode("499999");
  cy.wait(5000);
  cy.Exist(".input-failed").then((exist) => {
    if (exist) {
      cy.get(".input-failed", { timeout: 10000 }).should("be.visible");
    }
  });
  cy.wait(5000);
  // cy.Exist("[data-testid=login-close-icon]").then((exist) => {
  //   if (exist) {
  //     cy.get("[data-testid=login-close-icon]").click({
  //       scrollBehavior: false,
  //     });
  //   }
  // });
});
Cypress.Commands.add("performExpireOtpLogin", () => {
  cy.clearAllCookies();
  cy.viewport(783, 824);
  cy.wait(6000); ////here
  cy.Exist(".en-regular:nth-child(2)").then((exists) => {
    if (exists) {
      cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    } else {
      cy.clearAllLocalStorage();
      cy.clearAllCookies();
      cy.reload();
      cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    }
  });
  cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false });
  cy.enterPhoneNumber("963937288307");
  cy.wait(130000);
  cy.Exist(".resend-code-button").then((s) => {
    if (s) {
      cy.get(".resend-code-button").click({ scrollBehavior: false });
      cy.typePincode("999999");
    } else {
      expect(1).to.equal(2);
    }
  });
  cy.wait(5000);
  cy.Exist("[data-testid=login-close-icon]").then((exist) => {
    if (exist) {
      cy.get("[data-testid=login-close-icon]").click({
        scrollBehavior: false,
      });
    }
  });
});
// **************************Sign up*************************** *//
Cypress.Commands.add("signupProcess", () => {
  cy.wait(20000);
  cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
    req.continue((res) => {
      res.body.data.already_exists = false;
    });
  }).as("verifyOtpSignin");
  cy.clearAllData();
  cy.viewport(783, 824);
  cy.wait(5000);
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.get(".login-button:nth-child(2)").click({ scrollBehavior: false });
  cy.get(".agree-terms").click({ scrollBehavior: false });
  cy.enterPhoneNumber("963937288307");
  cy.typePincode("999999");
  cy.wait(5000);
  // cy.Exist("[data-testid=login-close-icon]").then((exist) => {
  //   if (exist) {
  //     cy.get("[data-testid=login-close-icon]").click({
  //       scrollBehavior: false,
  //     });
  //   }
  // });
  cy.Exist("[data-cy=inputToWriteName]").then((exist) => {
    if (exist) {
      cy.clickElementForce("[data-cy=inputToWriteName]");
      console.log("input To Write Name  found");
      cy.log("✅✅ input To Write Name  found");
      cy.wait(5000);
      cy.Exist("[data-cy=InputFiledForName]").then((exist) => {
        if (exist) {
          cy.get("[data-cy=InputFiledForName]")
            .type("Alaa Asaad", { force: true })
            .should("have.value", "Alaa Asaad"); // Ensure text was typed
          console.log("Input Filed For write Name found");
          cy.log("✅✅ Input Filed For write Name found");
        } else {
          console.log("Input Filed For write Name not found");
          cy.log("❌❌ Input Filed For write Name not found");
        }
      });
      cy.wait(5000);
      cy.get(".phone-arrow").click({ scrollBehavior: false });
      cy.wait(5000);
      cy.Exist("[data-cy=skipForNow]").then((exist) => {
        if (exist) {
          cy.clickElementForce("[data-cy=skipForNow]");
          console.log("skip For Now clicked");
          cy.log("✅✅ skip For Now clicked");
        } else {
          console.log("skip For Now not clicked");
          cy.log("❌❌ skip For Now not clicked");
        }
      });
    } else {
      console.log("input To Write Name not found");
      cy.log("❌❌ input To Write Name not found");
    }
  });
});
Cypress.Commands.add("failedSignupProcess", () => {
  cy.viewport(783, 824);
  cy.Exist(".en-regular:nth-child(2)").then((exists) => {
    if (exists) {
      cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    } else {
      cy.clearAllDataWithoutSessionStorage();
      cy.reload();
      cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    }
  });
  cy.get(".login-button:nth-child(2)").click({ scrollBehavior: false });
  cy.get(".agree-terms").click({ scrollBehavior: false });
  cy.enterPhoneNumber("963937288307");
  cy.typePincode("499999");
  cy.Exist(".input-failed").then((exist) => {
    if (exist) {
      cy.get(".input-failed", { timeout: 10000 }).should("be.visible");
    }
  });
});
Cypress.Commands.add("alreadyRegisteredSignup", () => {
  cy.clearAllData();
  cy.viewport(783, 824);
  cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
    req.continue((res) => {
      res.body.data.already_exists = true;
    });
  }).as("verifyOtpSignin");
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.get(".login-button:nth-child(2)").click({ scrollBehavior: false });
  cy.get("[data-cy=agree-terms]").click({ scrollBehavior: false });
  cy.wait(6000);
  cy.enterPhoneNumber("963937288307");
  cy.typePincode("999999");
  cy.wait(30000);
  cy.wait("@verifyOtpSignin", { timeout: 20000 }).then((s) => {
    console.log(s);
  });
  cy.wait(5000);
});

// ************************ Open Cart **************************************
Cypress.Commands.add("interceptAndWait", (routes) => {
  // Iterate through the provided routes and set up intercepts
  routes.forEach((route) => {
    cy.intercept(route.method || "GET", route.url).as(route.alias);
  });

  // Wait for any of the provided aliases, not necessarily all
  const aliases = routes.map((route) => `@${route.alias}`);
  cy.wait(aliases, { timeout: 30000 }); // Adjust timeout as needed
});
Cypress.Commands.add("clickElementScroll", (selector: string) => {
  cy.wait(5000);
  cy.get(selector).click({ scrollBehavior: false });
});
Cypress.Commands.add("clickElementForce", (selector: string) => {
  cy.wait(5000);
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
        console.log("Product Name:", productName);
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
// ************************ Search **************************************
// Cypress.Commands.add("failedSignupProcess", () => { })
