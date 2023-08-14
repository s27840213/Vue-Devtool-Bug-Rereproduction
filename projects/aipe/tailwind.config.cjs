const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}', '../../packages/ui-component/src/**/*.vue'],
  theme: {
    extend: {},
    colors: {
      appBg: '#050505',
      appBtnPrimaryBg: '#fdd248',
      appBtnPrimaryPressed: '#e4bd41',
      appBtnPrimaryText: '#ffffff',
      appBtnSecondaryBg: '#fef1c6',
      appBtnSecondaryPressed: '#caa83a',
      appIconDark: '#323232',
      appIconLight: '#fffbed',
      appPlaceholder: '#909090',
      appSelection: '#ff7262',
      appSliderBg: '#a3a3a380',
      appTabActive: '#fdd248',
      appTabBg: '#252525',
      appTabDefault: '#fffbeb',
      appTabDisable: '#a3a3a3',
      appTextPrimary: '#323232',
      appTextSecondary: '#ffffff',
      appToastSuccess: '#fff8e480',
      neutralDarkActive: '#050505',
      neutralDarkHover: '#0d0d0d',
      neutralDark: '#121212',
      neutralLightActive: '#7a7a7a',
      neutralLightHover: '#909090',
      neutralNormalActive: '#252525',
      neutralNormalHover: '#2b2b2b',
      neutralNormal: '#323232',
      primaryDarkActive: '#725e20',
      primaryDarkHover: '#987e2b',
      primaryDark: '#be9e36',
      primaryDarker: '#594a19',
      primaryLightActive: '#fef1c6',
      primaryLightHover: '#fff8e4',
      primaryLight: '#fffbed',
      primaryLighter: '#a3a3a3',
      primaryNormalActive: '#caa83a',
      primaryNormalHover: '#e4bd41',
      primaryNormal: '#fdd248',
      primaryWhite: '#ffffff'
    }
  },
  plugins: [
    // why we should use this plugin? bcz if we add custom class using @layer, they won't be change in tailwind intellsense
    plugin(function ({ addUtilities }) {
      const textStyles = {
        '.typo-h1': {
          fontFamily: 'Lato',
          fontSize: '32px',
          fontWeight: 600,
          lineHeight: '40px'
        },
        '.typo-h2': {
          fontFamily: 'Lato',
          fontSize: '28px',
          fontWeight: 600,
          lineHeight: '36px'
        },
        '.typo-h3': {
          fontFamily: 'Lato',
          fontSize: '24px',
          fontWeight: 600,
          lineHeight: '32px'
        },
        '.typo-h4': {
          fontFamily: 'Lato',
          fontSize: '22px',
          fontWeight: 500,
          lineHeight: '28px'
        },
        '.typo-h5': {
          fontFamily: 'Lato',
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: '24px'
        },
        '.typo-h6': {
          fontFamily: 'Lato',
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: '20px'
        },
        '.typo-body-lg': {
          fontFamily: 'Lato',
          fontSize: '16px',
          fontWeight: 400,
          lineHeight: '24px'
        },
        '.typo-body-md': {
          fontFamily: 'Lato',
          fontSize: '14px',
          fontWeight: 400,
          lineHeight: '20px'
        },
        '.typo-body-sm': {
          fontFamily: 'Lato',
          fontSize: '12px',
          fontWeight: 400,
          lineHeight: '16px'
        },
        '.typo-btn-lg': {
          fontFamily: 'Lato',
          fontSize: '14px',
          fontWeight: 600,
          lineHeight: '20px'
        },
        '.typo-btn-md': {
          fontFamily: 'Lato',
          fontSize: '12px',
          fontWeight: 600,
          lineHeight: '16px'
        },
        '.typo-btn-sm': {
          fontFamily: 'Lato',
          fontSize: '11px',
          fontWeight: 600,
          lineHeight: '16px'
        }
      }
      addUtilities(textStyles, ['responsive', 'hover'])
    })
  ]
}
