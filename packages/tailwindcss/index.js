const plugin = require('tailwindcss/plugin')
const colors = require('tailwindcss/colors')

const spacing = {}
const marginSpacing = {}
for (let i = 1; i <= 720; i++) {
  const index = i * 0.5
  spacing[index] = i * 0.125 + 'rem'
  marginSpacing[index] = i * 0.125 + 'rem'
  marginSpacing[`-${index}`] = -(i * 0.125) + 'rem'
}

const lineHeight = {}
for (let i = 0; i < 10; i++) {
  const value = 1 + i / 10
  lineHeight[value] = value
}

const zIndex = {}
for (let i = 0; i <= 100; i++) {
  zIndex[i] = i
}

const strokeWidth = {}
for (let i = 0; i <= 20; i++) {
  strokeWidth[i] = i + 'px'
}

module.exports = plugin(function () {}, {
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      pink: colors.pink,
      blue: colors.blue,
      purple: colors.purple,
      cyan: {
        900: '#001C49',
        800: '#08295F',
        700: '#0C3A75',
        600: '#125290',
        500: '#1C6DAC',
        400: '#268CC8',
        300: '#57B4DF',
        200: '#7AD1ED',
        100: '#A8EAFA',
        0: '#D4F7FD',
      },
      yellow: {
        900: '#423201',
        800: '#74500E',
        700: '#866729',
        600: '#A8863A',
        500: '#C9A74C',
        400: '#F2C94C',
        300: '#F3DB86',
        200: '#F7E69D',
        100: '#FBF0BE',
        0: '#FEF9DB',
      },
      red: {
        900: '#460118',
        800: '#6B0E2D',
        700: '#821733',
        600: '#A0253A',
        500: '#C03643',
        400: '#E04A4B',
        300: '#F0938A',
        200: '#F5A491',
        100: '#FAC9B8',
        0: '#FDE7DA',
      },
    },
    extend: {
      colors: {
        grey: {
          900: '#262626',
          800: '#3C3C3C',
          700: '#515151',
          600: '#676767',
          500: '#7D7D7D',
          400: '#939393',
          300: '#A8A8A8',
          250: '#BEBEBE',
          200: '#D4D4D4',
          150: '#E9E9E9',
          100: '#F4F4F4',
          50: '#F9F9F9',
          0: '#FFFFFF',
        },
        primary: {
          900: '#03393E',
          800: '#074E54',
          700: '#0A6665',
          600: '#0F7F73',
          500: '#20A17A',
          400: '#21B185',
          300: '#3EC39B',
          200: '#71DABB',
          100: '#CFF6EB',
          0: '#E9F8F3',
        },
        brown: {
          800: '#402816',
          500: '#A16438',
          400: '#B48360',
          300: '#C7A288',
          100: '#ECE0D7',
          50: '#F6F0EB',
        },
        forestgreen: {
          800: '#1D401D',
          500: '#48A148',
          400: '#6DB46D',
          300: '#91C791',
          100: '#DAECDA',
          50: '#EDF6ED',
        },
        peacock: {
          800: '#0E3D41',
          500: '#2498A3',
          400: '#4DACB5',
          300: '#77C0C7',
          100: '#CAE7EA',
          50: '#DEF1F3',
        },
      },
      fontSize: {
        h1: ['48px', '1'],
        h2: ['40px', '1'],
        h3: ['32px', '1'],
        h4: ['24px', '1'],
        h5: ['20px', '1'],
        h6: ['18px', '1'],
        body1: ['16px', '1'],
        body2: ['14px', '1'],
        caption: ['12px', '1'], // 因為牽扯到的程式碼範圍太廣，暫時為了避免衝突所以不將 caption 改名為 caption1，等日後再調整
        caption2: ['10px', '1'],
      },
      zIndex: {
        sidebar: 100,
        header: 100,
        modal: 200,
        'modal-confirm': 200,
        'flash-msg': 201,
        footer: 200,
        popper: 999,
        tooltip: 1000,
        ...zIndex,
      },
      spacing: spacing,
      maxWidth: spacing,
      minWidth: spacing,
      maxHeight: spacing,
      minHeight: spacing,
      lineHeight: lineHeight,
      screens: {
        '2xl': '1440px',
      },
      gridTemplateColumns: {
        lobby: 'repeat(auto-fill, 232px)',
      },
      strokeWidth: strokeWidth,
      margin: marginSpacing,
      lineClamp: {
        7: '7',
        8: '8',
        9: '9',
        10: '10',
      },
      dropShadow: {
        2: [
          '0px 0.15px 0.45px rgba(103, 103, 103, 0.11)',
          '0px 0.8px 1.8px rgba(103, 103, 103, 0.13)',
        ],
        4: [
          '0px 0.6px 1px rgba(103, 103, 103, 0.1)',
          '0px 2px 4px rgba(103, 103, 103, 0.11)',
        ],
        8: [
          '0px 0.6px 2px rgba(103, 103, 103, 0.11)',
          '0px 3px 7px rgba(103, 103, 103, 0.13)',
        ],
        16: [
          '0px 1.5px 3.6px rgba(103, 103, 103, 0.24)',
          '0px 6px 14.4px rgba(103, 103, 103, 0.13)',
        ],
      },
    },
  },
})
