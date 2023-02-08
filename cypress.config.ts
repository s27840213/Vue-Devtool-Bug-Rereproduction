import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'dg4gqg',
  viewportWidth: 1400,
  viewportHeight: 900,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  scrollBehavior: false,
  // To prevent browser out of memory, only keep one task in memory, https://blog.hao.dev/fixing-cypress-errors-part-1-chromium-out-of-memory-crashes
  numTestsKeptInMemory: 1,
  e2e: {
    baseUrl: 'http://localhost:8080/',
    experimentalRunAllSpecs: true,
    experimentalWebKitSupport: true,
    setupNodeEvents(on /* config */) {
      require('cypress-terminal-report/src/installLogsPrinter')(on)
    },
  },
})
