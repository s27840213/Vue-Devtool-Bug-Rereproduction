class SvgIconUtils {
  icons: Array<string>

  constructor() {
    this.icons = []
  }

  setIcons(icons: Array<string>) {
    this.icons = icons
  }

  pushIcon(icon: string) {
    this.icons.push(icon)
  }
}

const svgIconUtils = new SvgIconUtils()

export default svgIconUtils
