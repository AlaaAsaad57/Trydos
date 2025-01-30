// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

import { mount } from "cypress/react18";

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// <reference path="./component" />
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
      Visit(value: string): void;
      Exist(selector: string): Promise<boolean>;
      clearAllData(): Chainable<void>;
      clearAllDataWithoutCookies(): Chainable<void>;
      clearAllDataWithoutSessionStorage(): Chainable<void>;
      (): Chainable<void>;
      typePincode(pincode: string): Chainable<void>;
      enterPhoneNumber(phoneNumber: string): Chainable<void>;
      performLogin(): Chainable<void>;
      Performloginfailure(): Chainable<void>;
      performErrorLogin(): Chainable<void>;
      performExpireOtpLogin(): Chainable<void>;
      signupProcess(): Chainable<void>;
      failedSignupProcess(): Chainable<void>;
      alreadyRegisteredSignup(): Chainable<void>;
      interceptAndWait(
        routes: { method?: string; url: string; alias: string }[]
      ): Chainable<void>;
    }
  }
}

Cypress.Commands.add("mount", mount);

// Example use:
// cy.mount(<MyComponent />)
