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
      ChexkExistElement(selector: string): Promise<boolean>;
      logout(): Chainable<void>;
      SkipForNow(): Chainable<void>;
      WaitUntilLoadWebsiteAndlogoutAndViewport(): Chainable<void>;
      HaveAccount(): Chainable<void>;
      OpenBoutiqueAndAddProductToCartFromBoutiquePage(): Chainable<any>;
      OpenBoutiqueAndAddProductToCartFromBoutiqueDatailPage(): Chainable<void>;
      RequestForThreeServers(): Chainable<void>;
      CreateNewAccount(): Chainable<void>;
      AgreeTerms(): Chainable<void>;
      CheckIfTrySendOtp(): Chainable<void>;
      EndLoginOperation(): Chainable<void>;
      InputFieldNameVisible(): Chainable<void>;
      TypeName(): Chainable<void>;
      MakeOtpExpired(): Chainable<void>;
      ChooseWayToRecieveOtpAndWaitOtpRequest(): Chainable<void>;
      ComplateLoginByMobilePhone(): Chainable<void>;
      OpenLoginInterface(): Chainable<void>;
      ColoredFieldRed(): Chainable<void>;
      typePincode(pincode: string): Chainable<void>;
      enterPhoneNumber(phoneNumber: string): Chainable<void>;
      reEnterPhoneNumber(phoneNumber: string): Chainable<void>;
      performLogin(s?: string): Chainable<void>;
      interceptAndWait(
        routes: { method?: string; url: string; alias: string }[]
      ): Chainable<void>;
      clickElement(selector: string): Chainable<Element>;
      getProductNameFirstly(selector?: string): Chainable<string>;
      verifyProductInCart(productName: string): Chainable<void>;
      verifyBoxsInBoutiquePage(): Chainable<void>;
      verifyComponentsInProductCard(): Chainable<void>;
      ClickAddToCartAndWaitRequest(): Chainable<void>;
      ConfirmAndComplateOrderButton(): Chainable<void>;
      AddAdress(): Chainable<void>;
      openWebsite(): Chainable<void>;
      ChooseBoutiqueAndVerifyComponentsAndBoxsInBoutiquePage(): Chainable<void>;
      ComplateAddProductOperationAndGoCartPage(): Chainable<void>;
    }
    interface Window {
      isKeyboardOpen?: boolean;
    }
  }
}

Cypress.Commands.add("mount", mount);
// Example use:
// cy.mount(<MyComponent />)

// cy.wait(["@addToCart", "@updateCart"], { timeout: 30000 }).then(
//   ([addToCart, updateCart]) => {
//     if (addToCart.response?.statusCode === 200) {
//       console.log("cart/add was called");
//       expect(addToCart.response!.statusCode).to.eq(200);
//     } else if (updateCart.response?.statusCode === 200) {
//       console.log("cart/update was called");
//       expect(updateCart.response!.statusCode).to.eq(200);
//     } else {
//       throw new Error("Neither cart/add nor cart/update was called");
//     }
//   }
// );
