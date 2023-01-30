// Doc: https://docs.cypress.io/guides/tooling/typescript-support#Types-for-Custom-Commands

declare namespace Cypress {
  interface Chainable {
    login(): Chainable<void>
  }
}
