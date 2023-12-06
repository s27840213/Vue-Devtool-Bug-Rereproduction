import colors from '@/assets/json/colors.json'

type IColorKeys = keyof typeof colors
const colorKeys = Object.keys(colors) as IColorKeys[]

export { IColorKeys, colorKeys }
