const {
  cypressBrowserPermissionsPlugin,
} = require("cypress-browser-permissions");

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  config = cypressBrowserPermissionsPlugin(on, config);
  return config;
};
