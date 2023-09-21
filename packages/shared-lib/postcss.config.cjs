const { join } = require('path')

module.exports = {
  plugins: {
    // this does the trick that make tailwind could work with storybook
    // Why? I should ask you why, I work for this issue for almost two days...
    // After find the solution I still don't know why it works... :)
    tailwindcss: {
      config: join(__dirname, 'tailwind.config.cjs'),
    },
    autoprefixer: {},
  },
}
