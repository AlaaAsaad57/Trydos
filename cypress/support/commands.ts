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
  cy.visit(url, {
    onBeforeLoad(win) {
      // @ts-ignore
      cy.stub(win.Notification, "permission", "granted");
      cy.stub(win, "Notification").as("Notification");
    },
  });
  cy.wait(5000);
  cy.Exist("#country").then((exists) => {
    if (exists) {
      cy.get("#country").select("TR");
    } else {
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
  cy.clearAllCookies();
  cy.clearAllLocalStorage();
  cy.clearAllSessionStorage();
});
Cypress.Commands.add("clearAllDataWithoutCookies", () => {
  cy.clearAllLocalStorage();
  cy.clearAllSessionStorage();
});
Cypress.Commands.add("clearAllDataWithoutSessionStorage", () => {
  cy.clearAllLocalStorage();
  cy.clearAllCookies();
});
Cypress.Commands.add("typePincode", (pincode: string) => {
  const digits = pincode.split(""); // Split the pincode into individual digits
  digits.forEach((digit, index) => {
    cy.get(`.pincode-input-text:nth-child(${index + 1})`).type(digit, {
      scrollBehavior: false,
    });
  });
});
Cypress.Commands.add("enterPhoneNumber", (phoneNumber: string) => {
  cy.wait(10000);
  cy.get("#phoneInput").click({ scrollBehavior: false });
  cy.get("#phoneInput").type(`${phoneNumber}{enter}`, {
    scrollBehavior: false,
  });
  cy.get(".phone-arrow").click({ scrollBehavior: false });
  cy.get(".message-recieve-option:nth-child(1)").click({
    scrollBehavior: false,
  });
});
Cypress.Commands.add("performLogin", () => {
  cy.clearAllData;
  cy.viewport(783, 824);
  cy.wait(5000);
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.wait(3000);
  cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false }); //have account
  cy.Exist("[data-cy=login-methods-container]").then((exist) => {
    if (exist) {
      cy.get("[data-cy=login-method-phone]").click({ scrollBehavior: false });
    }
  });
  cy.enterPhoneNumber("963937288307");
  cy.wait(5000);
  cy.typePincode("999999");
});
Cypress.Commands.add("Performloginfailure", () => {
  cy.wait(60000);
  cy.reload();
  cy.wait(5000);
  cy.clearAllData();
  cy.viewport(783, 824);
  cy.reload();
  cy.wait(3000);
  cy.wait(10000);
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.wait(8000);
  cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false });
  cy.enterPhoneNumber("963937288307");
  cy.wait(6000);
  cy.typePincode("999999");
  cy.wait("@verifyOtpSignin", { timeout: 20000 }).then((s) => {
    console.log(s);
  });
  cy.wait(6000);
  cy.wait(5000).then(() => {
    cy.get(".not-registered").should("be.visible");
  });
});
Cypress.Commands.add("performErrorLogin", () => {
  cy.viewport(783, 824);
  cy.wait(5000);
  cy.Exist(".en-regular:nth-child(2)").then((exists) => {
    if (exists) {
      cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    } else {
      cy.clearAllDataWithoutSessionStorage();
      cy.reload();
      cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    }
  });
  cy.wait(8000);
  cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false });
  cy.enterPhoneNumber("963937288307");
  cy.wait(5000);
  cy.typePincode("499999");
  cy.get(".input-failed", { timeout: 10000 }).should("be.visible");
});
Cypress.Commands.add("performExpireOtpLogin", () => {
  cy.clearAllCookies();
  cy.viewport(783, 824);
  cy.wait(60000);
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
  cy.wait(8000);
  cy.get(".login-button:nth-child(1)").click({ scrollBehavior: false });
  cy.enterPhoneNumber("963937288307");
  cy.wait(130000);
  cy.Exist(".resend-code-button").then((s) => {
    if (s) {
      cy.get(".resend-code-button").click({ scrollBehavior: false });
      cy.wait(5000);
      cy.typePincode("999999");
    } else {
      expect(1).to.equal(2);
    }
  });
});
// **************************Sign up*************************** *//
Cypress.Commands.add("signupProcess", () => {
  cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
    req.continue((res) => {
      res.body.data.already_exists = false;
    });
  }).as("verifyOtpSignin");
  cy.clearAllData();
  cy.viewport(783, 824);
  cy.wait(6000);
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.wait(3000);
  cy.get(".login-button:nth-child(2)").click({ scrollBehavior: false });
  cy.get(".agree-terms").click({ scrollBehavior: false });
  cy.enterPhoneNumber("963937288307");
  cy.wait(5000);
  cy.typePincode("999999");
});
Cypress.Commands.add("failedSignupProcess", () => {
  cy.viewport(783, 824);
  cy.wait(5000);
  cy.Exist(".en-regular:nth-child(2)").then((exists) => {
    if (exists) {
      cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    } else {
      cy.clearAllDataWithoutSessionStorage();
      cy.reload();
      cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
    }
  });
  cy.wait(8000);
  cy.get(".login-button:nth-child(2)").click({ scrollBehavior: false });
  cy.get(".agree-terms").click({ scrollBehavior: false });
  cy.enterPhoneNumber("963937288307");
  cy.wait(5000);
  cy.typePincode("499999");
  cy.get(".input-failed", { timeout: 10000 }).should("be.visible");
});
Cypress.Commands.add("alreadyRegisteredSignup", () => {
  cy.clearAllData();
  cy.viewport(783, 824);
  cy.wait(10000);
  cy.intercept("GET", "/api/new_v1/phone/verify_otp_singin?*", (req) => {
    req.continue((res) => {
      res.body.data.already_exists = true;
    });
  }).as("verifyOtpSignin");
  cy.get(".en-regular:nth-child(2)").click({ scrollBehavior: false });
  cy.wait(8000);
  cy.get(".login-button:nth-child(2)").click({ scrollBehavior: false });
  cy.get("[data-cy=agree-terms]").click({ scrollBehavior: false });
  cy.enterPhoneNumber("963937288307");
  cy.wait(5000);
  cy.typePincode("999999");
  cy.wait("@verifyOtpSignin", { timeout: 20000 }).then((s) => {
    console.log(s);
  });
  cy.wait(6000);
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
