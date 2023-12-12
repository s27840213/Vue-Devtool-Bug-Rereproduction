const colors = require('./colors.json')
const zIndex = require('./zIndex.json')
const plugin = require('tailwindcss/plugin')
const joinedColor = Object.keys(colors).join('|')
const bgPattern = new RegExp(`bg-(${joinedColor})`)
const textPattern = new RegExp(`text-(${joinedColor})`)
const borderPattern = new RegExp(`border-(${joinedColor})`)
const strokePattern = new RegExp(`stroke-(${joinedColor})`)

const spacingMap = {}
for (let i = 0; i <= 500; i++) {
  spacingMap[i] = `${i}px`
}
const spacingMapPxOnly = { ...spacingMap }
spacingMap.full = '100%'
spacingMap.half = '50%'
const spacingMapWithPoint = {}
for (let i = 0; i <= 10; i += 0.5) {
  spacingMapWithPoint[i] = `${i}px`
}
spacingMapWithPoint['.5'] = '0.5px'

/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false,
  },
  content: ['./src/**/*.{vue,js,ts}', '../../packages/vivi-lib/src/**/*.{vue,js,ts}'],
  // purge: ['./src/**/*.html', './src/**/*.vue', './src/**/*.ts'],
  theme: {
    extend: {
      minWidth: {
        screen: '100vw',
        ...spacingMap,
      },
      minHeight: spacingMap,
    },

    colors,
    zIndex: zIndex.reduce(
      (prevVal, currVal, idx) => ({ ...prevVal, [currVal]: (idx + 1).toString() }),
      {},
    ),
    // this project only for mobile, no need to add to much spacing
    spacing: spacingMap,
    borderRadius: {
      ...spacingMapPxOnly,
      full: '9999px',
    },
    borderWidth: spacingMapWithPoint,
    outlineWidth: spacingMapWithPoint,
    outlineOffset: spacingMapWithPoint,
    maxWidth: {
      min: 'min-content',
      max: 'max-content',
      fit: 'fit-content',
      none: 'none',
      screen: '100vw',
      ...spacingMap,
    },
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
    // Add classes here, and Tailwind Intellisense will do auto complete for them.
    plugin(function ({ addUtilities }) {
      // TODO: typo for pic/stk
      const textStyles = {
        '.typo-h1': {
          fontFamily: 'Lato',
          fontSize: '32px',
          fontWeight: 900,
          lineHeight: '40px',
        },
        '.typo-h2': {
          fontFamily: 'Lato',
          fontSize: '28px',
          fontWeight: 900,
          lineHeight: '36px',
        },
        '.typo-h3': {
          fontFamily: 'Lato',
          fontSize: '24px',
          fontWeight: 900,
          lineHeight: '32px',
        },
        '.typo-h4': {
          fontFamily: 'Lato',
          fontSize: '22px',
          fontWeight: 600,
          lineHeight: '28px',
        },
        '.typo-h5': {
          fontFamily: 'Lato',
          fontSize: '16px',
          fontWeight: 600,
          lineHeight: '24px',
        },
        '.typo-h6': {
          fontFamily: 'Lato',
          fontSize: '14px',
          fontWeight: 600,
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
        '.typo-btn-xs': {
          fontFamily: 'Lato',
          fontSize: '12px',
          fontWeight: 600,
          lineHeight: '16px',
          transform: 'scale(0.9)',
        },
      }
      addUtilities(textStyles, ['responsive'])

      const justifyContent = [
        ['center', 'center'],
        ['start', 'flex-start'],
        ['end', 'flex-end'],
        ['between', 'space-between'],
        ['around', 'space-around'],
        ['evenly', 'space-evenly'],
        ['ini', 'initial'],
      ]
      const alignItems = [
        ['center', 'center'],
        ['start', 'flex-start'],
        ['end', 'flex-end'],
        ['ini', 'initial'],
      ]
      const flex = {}
      for (const [juKey, juVal] of justifyContent) {
        for (const [alKey, alVal] of alignItems) {
          const key = juKey === alKey ? juKey : `${juKey}-${alKey}`
          flex[`.flex-${key}`] = {
            display: 'flex',
            justifyContent: juVal,
            alignItems: alVal,
          }
        }
      }
      addUtilities(flex)
    }),
  ],
}
