// import webpack from '@cypress/webpack-preprocessor'
import { defineConfig } from 'cypress'

/**
 * How to run Cypress test in local computer:
 *
 * 1. Install Chromium
 * Current Chromium version: 109.0.5414.74
 * Download from:
 * Mac(arm) v109.0.5414.0: https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html?prefix=Mac_Arm/1070135/
 * Mac(x64): https://chromium.cypress.io/mac/beta/109.0.5414.74
 * Win(x64): https://chromium.cypress.io/win64/beta/109.0.5414.74
 *
 * If you are Mac user, you need to trun off some security setting and put app in Application folder:
 * https://blog.ntmy.com.tw/fix-app-damaged-cant-be-opened-trash-error-mac/
 *
 * 2. Prevent unnecessary test
 * Often, during the debugging process, you may only need to test a specific part of the entire test.
 * To achieve this, you can:
 *   (1) Add ".only" after "it".
 *   (2) Uncomment isMobile or !isMobile coutinue.
 *   (3) Comment some test command.
 *
 * For example:
 *  for (const isMobile of [true, false]) {
 *    if (isMobile) continue // (2) All mobile test will be ignore
 *    // if (!isMobile) continue
 *    ...
 *      // (1) I only want to test "Unsplash image" test, so I replace it with it.only to prevent other test it.
 *      it.only(`Unsplash image${suffix}`, function () {
 *      ...
 *          // .imageAdjust()
 *          // .layerFlip()
 *          // .imageCrop('button', isMobile)
 *          // .imageCrop('dblclick', isMobile)
 *          .imageShadow() // (3) I only want to test image shadow, so I comment other test command.
 *          // .layerAlign()
 *          // .imageSetAsBg()
 * These three steps are optional, use them only if necessary.
 *
 * 3. Running test command
 * To obtain the correct snapshot test result, use:
 *   yarn cyrun -s cypress/e2e/Editor/Image.cy.ts
 * If you wish to observe how Cypress performs the test or inspect HTML elements, use:
 *   yarn cyopen
 * The cyopen command will open Chrome (not Chromium!), and you can select the desired test to execute.
 * However, please note that the snapshot result in cyopen is not correct,
 * so all snapshot tests will always pass (their difference threshold is 100%).
 */

export default defineConfig({
  projectId: 'dg4gqg',
  viewportWidth: 1400,
  viewportHeight: 900,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  // To prevent browser out of memory, only keep one task in memory, https://blog.hao.dev/fixing-cypress-errors-part-1-chromium-out-of-memory-crashes
  numTestsKeptInMemory: 1,
  experimentalWebKitSupport: true,
  env: {
    // For cypress-image-diff-js to not delete snapshot in /cy/snapshot folder
    // preserveOriginalScreenshot: true,
  },
  e2e: {
    baseUrl: 'http://localhost:8080/',
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      require('cypress-terminal-report/src/installLogsPrinter')(on, { compactLogs: 20 })
      require('cypress-image-diff-js/dist/plugin')(on, config)

      // Because set on event will overwrite plugin event.
      // So I copy it from 'cypress-image-diff-js/dist/plugin' and add something.
      // Detail plz see: https://github.com/cypress-io/cypress/issues/5240
      on('before:browser:launch', function (browser, launchOptions) {
        // Launch API DOC: https://docs.cypress.io/api/plugins/browser-launch-api
        const width = String(config.viewportWidth) || '1280'
        const height = String(config.viewportHeight) || '720'

        if (['chrome', 'chromium'].includes(browser.name)) {
          launchOptions.args.push('--window-size='.concat(width, ',').concat(height))
          launchOptions.args.push('--force-device-scale-factor=1')
          launchOptions.args.push('--force-color-profile=srgb')
        }

        if (browser.name === 'electron') {
          // eslint-disable-next-line no-param-reassign
          launchOptions.preferences.width = Number.parseInt(width, 10)
          // eslint-disable-next-line no-param-reassign
          launchOptions.preferences.height = Number.parseInt(height, 10)
        }

        if (browser.name === 'firefox') {
          launchOptions.args.push('--width='.concat(width))
          launchOptions.args.push('--height='.concat(height))
        }

        // console.log('launchOptions', launchOptions)
        return launchOptions
      })

      // For import utils, unfinished.
      // https://github.com/cypress-io/cypress/tree/develop/npm/webpack-preprocessor
      // on('file:preprocessor', webpack({
      //   webpackOptions: require('cypress/vue-webpack-config.js'),
      //   watchOptions: {},
      // }))
    },
  },
})
