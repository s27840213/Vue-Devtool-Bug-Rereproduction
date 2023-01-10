import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'dg4gqg',
  viewportHeight: 1400,
  viewportWidth: 1680,
  e2e: {
    setupNodeEvents(on, config) {},
    supportFile: 'cypress/support/commands.js',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
