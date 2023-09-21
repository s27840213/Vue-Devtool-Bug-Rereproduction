// Doc: https://docs.cypress.io/guides/tooling/typescript-support#Types-for-Custom-Commands

interface ISidebarData {
  icon: string
  panelName: string
  componentName: string
  apiUrl: string
  apiType: string
  testCategory: string
}

declare namespace Cypress {
  interface Chainable<Subject> {
    // commands.ts
    isMobile(callback: () => void): Chainable<void>
    notMobile(callback: () => void): Chainable<void>
    waitTransition(): Chainable<Subject>
    login(): Chainable<void>
    deleteAllLayers(): Chainable<void>
    deselectAllLayers(): Chainable<void>
    importDesign(designName: string): Chainable<void>
    togglePanel(buttonText: string): Chainable<void>
    getAllCategoryName(panel: ISidebarData, categoryName?: string[], last?: boolean): Chainable<string[]>
    addAsset(panel: ISidebarData, categoryIndex: number, itemIndex: number): Chainable<void>
    // addAsset(panel: ISidebarData, categoryName: string, itemIndex: number): Chainable<void>

    // layerEdit.ts
    layerFlip(): Chainable<JQuery<HTMLElement>>
    layerAlign(): Chainable<JQuery<HTMLElement>>
    layerOrder(subjectBack: JQuery<HTMLElement>): Chainable<JQuery<HTMLElement>>
    layerCopy(): Chainable<JQuery<HTMLElement>>
    layerLock(): Chainable<JQuery<HTMLElement>>
    layerDelete(): Chainable<JQuery<HTMLElement>>
    layerCopyFormat(subjectBack: JQuery<HTMLElement>,
      before: (subject: JQuery<HTMLElement>) => void,
      after: (subject: JQuery<HTMLElement>) => void): Chainable<JQuery<HTMLElement>>
    layerRotate(): Chainable<JQuery<HTMLElement>>
    layerScale(): Chainable<JQuery<HTMLElement>>
    layerRotateAndResize(isMobile: boolean): Chainable<JQuery<HTMLElement>>
    layerMultipleCopyAndMove(method: 'functionalPanel' | 'shortcut' | 'rightclick', isMobile: boolean): Chainable<JQuery<HTMLElement>>
    layerMoveToPage2(isMobile: boolean): Chainable<JQuery<HTMLElement>>

    // imageEdit.ts
    imageAdjust(): Chainable<JQuery<HTMLElement>>
    imageCrop(enterCrop: 'button' | 'dblclick', isMobile: boolean): Chainable<JQuery<HTMLElement>>
    imageShadow(): Chainable<JQuery<HTMLElement>>
    imageSetAsBg(): Chainable<JQuery<HTMLElement>>
    imageAutoBgRemove(): Chainable<JQuery<HTMLElement>>
    imageManuallyBgRemove(): Chainable<JQuery<HTMLElement>>

    // npm package type define
    compareSnapshot(
      name: string,
      testThreshold?: number,
      retryOptions?: Record<string, unknown>
    ): Chainable<Element>

    // snapshotCommands.ts
    // Modified CompareSnapshot command in cypress-image-diff-js
    disableTransition(): Chainable<void>
    myCompareSnapshot(
      name: string,
      logName: string,
      testThreshold?: number,
      retryOptions?: Record<string, unknown>
    ): Chainable<Element>
    snapshotTest(testName: string,
      { toggleMobilePanel, pageIndex }?: {
        toggleMobilePanel?: string
        pageIndex?: number
      }): Chainable<Subject>
  }
}
