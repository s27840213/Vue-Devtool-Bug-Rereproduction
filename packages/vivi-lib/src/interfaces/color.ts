import colorTable from '@nu/tailwind-lib/colors.json'

type IColorKeys = keyof typeof colorTable
const colorKeys = Object.keys(colorTable) as IColorKeys[]

export { IColorKeys, colorKeys, colorTable }
