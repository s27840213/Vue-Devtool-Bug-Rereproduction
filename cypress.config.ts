import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'dg4gqg',
  e2e: {
    baseUrl: 'http://localhost:8080/',
    experimentalRunAllSpecs: true,
    experimentalWebKitSupport: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})
