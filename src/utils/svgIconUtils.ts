class SvgIconUtils {
  icons: Array<string>

  constructor() {
    this.icons = []
  }

  setIcons(icons: Array<string>) {
    this.icons = icons
  }
}

const svgIconUtils = new SvgIconUtils()

export default svgIconUtils
