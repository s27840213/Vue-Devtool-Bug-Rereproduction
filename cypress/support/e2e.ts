// ***********************************************************
// This example support/e2e.ts is processed and
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
import 'cypress-real-events'
import './commands'
import './imageEdit'
import './layerEdit'
require('cypress-terminal-report/src/installLogsCollector')()
require('cypress-image-diff-js/dist/command')()

// Get browser permission, https://stackoverflow.com/a/71242548
Cypress.automation('remote:debugger:protocol', {
  command: 'Browser.grantPermissions',
  params: {
    // All permissions type: https://chromedevtools.github.io/devtools-protocol/tot/Browser/#type-PermissionType
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
    // make the permission tighter by allowing the current origin only
    // like "http://localhost:56978"
    origin: window.location.origin,
  },
})

after(() => {
  // Generate cypress-image-diff report after testing
  cy.task('generateReport')
})

// Alternatively you can use CommonJS syntax:
// require('./commands')
