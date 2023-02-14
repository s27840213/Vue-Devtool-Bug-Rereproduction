import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'dg4gqg',
  viewportWidth: 1400,
  viewportHeight: 900,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  // scrollBehavior: false,
  // To prevent browser out of memory, only keep one task in memory, https://blog.hao.dev/fixing-cypress-errors-part-1-chromium-out-of-memory-crashes
  numTestsKeptInMemory: 1,
  env: {
    // For cypress-image-diff-js to not delete snapshot in /cy/snapshot folder
    preserveOriginalScreenshot: true,
  },
  e2e: {
    baseUrl: 'http://localhost:8080/',
    experimentalRunAllSpecs: true,
    experimentalWebKitSupport: true,
    setupNodeEvents(on, config) {
      require('cypress-terminal-report/src/installLogsPrinter')(on)
      require('cypress-image-diff-js/dist/plugin')(on, config)

      // Because set on event will overwrite plugin event.
      // So I copy it from 'cypress-image-diff-js/dist/plugin' and add something.
      // Detail plz see: https://github.com/cypress-io/cypress/issues/5240
      on('before:browser:launch', function (browser, launchOptions) {
        const width = String(config.viewportWidth) || '1280'
        const height = String(config.viewportHeight) || '720'

        if (browser.name === 'chrome') {
          launchOptions.args.push('--window-size='.concat(width, ',').concat(height))
          launchOptions.args.push('--force-device-scale-factor=1')
          launchOptions.args.push('--force-color-profile=srgb')
        }

        if (browser.name === 'electron') {
          // eslint-disable-next-line no-param-reassign
          launchOptions.preferences.width = Number.parseInt(width, 10) // eslint-disable-next-line no-param-reassign

          launchOptions.preferences.height = Number.parseInt(height, 10)
        }

        if (browser.name === 'firefox') {
          launchOptions.args.push('--width='.concat(width))
          launchOptions.args.push('--height='.concat(height))
        }

        console.log('launchOptions', launchOptions)
        return launchOptions
      })
    },
  },
})
