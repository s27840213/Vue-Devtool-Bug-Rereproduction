const path = require('path')

module.exports = {
  plugins: {
    tailwindcss: {
      // Specify custom config path: https://github.com/tailwindlabs/tailwindcss/issues/6393#issuecomment-1080723375
      config: path.join(__dirname, 'tailwind.config.cjs')
    },
    autoprefixer: {},
  },
}
