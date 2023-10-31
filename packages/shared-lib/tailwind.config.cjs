const colors = require('./src/assets/json/colors.json')
const plugin = require('tailwindcss/plugin')
const joinedColor = Object.keys(colors).join('|')
const bgPattern = new RegExp(`bg-(${joinedColor})`)
const textPattern = new RegExp(`text-(${joinedColor})`)
const borderPattern = new RegExp(`border-(${joinedColor})`)
const strokePattern = new RegExp(`stroke-(${joinedColor})`)

const spacingMap = {}
for (let i = 0; i <= 360; i++) {
  switch (true) {
    case i <= 40:
    case i <= 120 && i % 4 === 0:
    case i % 8 === 0:
      spacingMap[i] = `${i}px`
      break
    default:
      break
  }
}

console.log('tailwind setup')
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/components/**/*.{vue,js,ts,jsx,tsx}'],
  // purge: ['./src/**/*.html', './src/**/*.vue', './src/**/*.ts'],
  theme: {
    extend: {},

    colors: { transparent: 'transparent', ...colors },
    // this project only for mobile, no need to add to much spacing
    spacing: spacingMap,
  },
  safelist: [
    {
      pattern: bgPattern,
      variants: ['active'],
    },
    {
      pattern: textPattern,
      variants: ['active'],
    },
    {
      pattern: borderPattern,
      variants: ['active'],
    },
    {
      pattern: strokePattern,
    },
  ],
  plugins: [
    require('tailwind-scrollbar-hide'),
    // why we should use this plugin? bcz if we add custom class using @layer, they won't be change in tailwind intellsense
    plugin(function ({ addUtilities }) {
      const textStyles = {
        '.typo-h1': {
          fontFamily: 'Lato',
          fontSize: '32px',
          fontWeight: 600,
          lineHeight: '40px',
        },
        '.typo-h2': {
          fontFamily: 'Lato',
          fontSize: '28px',
          fontWeight: 600,
          lineHeight: '36px',
        },
        '.typo-h3': {
          fontFamily: 'Lato',
          fontSize: '24px',
          fontWeight: 600,
          lineHeight: '32px',
        },
        '.typo-h4': {
          fontFamily: 'Lato',
          fontSize: '22px',
          fontWeight: 500,
          lineHeight: '28px',
        },
        '.typo-h5': {
          fontFamily: 'Lato',
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: '24px',
        },
        '.typo-h6': {
          fontFamily: 'Lato',
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: '20px',
        },
        '.typo-body-lg': {
          fontFamily: 'Lato',
          fontSize: '16px',
          fontWeight: 400,
          lineHeight: '24px',
        },
        '.typo-body-md': {
          fontFamily: 'Lato',
          fontSize: '14px',
          fontWeight: 400,
          lineHeight: '20px',
        },
        '.typo-body-sm': {
          fontFamily: 'Lato',
          fontSize: '12px',
          fontWeight: 400,
          lineHeight: '16px',
        },
        '.typo-btn-lg': {
          fontFamily: 'Lato',
          fontSize: '14px',
          fontWeight: 600,
          lineHeight: '20px',
        },
        '.typo-btn-md': {
          fontFamily: 'Lato',
          fontSize: '12px',
          fontWeight: 600,
          lineHeight: '16px',
        },
        '.typo-btn-sm': {
          fontFamily: 'Lato',
          fontSize: '11px',
          fontWeight: 600,
          lineHeight: '16px',
        },
      }
      addUtilities(textStyles, ['responsive'])
    }),
  ],
}
