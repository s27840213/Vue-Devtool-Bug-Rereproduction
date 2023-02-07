// Doc: https://docs.cypress.io/guides/tooling/typescript-support#Types-for-Custom-Commands

interface ISidebarData {
  icon: string;
  panelName: string;
  componentName: string;
  apiUrl: string;
  apiType: string;
  testCategory: string;
}

declare namespace Cypress {
  interface Chainable {
    login(): Chainable<void>
    deleteAllLayers(): Chainable<void>
    getAllCategoryName(panel: ISidebarData, categoryName?: string[], last?: boolean): Chainable<string[]>
    addAsset(panel: ISidebarData, categoryIndex: number, itemIndex: number): Chainable<void>
    // addAsset(panel: ISidebarData, categoryName: string, itemIndex: number): Chainable<void>
  }
}
