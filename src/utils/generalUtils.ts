class GeneralUtils {
  deepCopy(el: unknown) {
    return JSON.parse(JSON.stringify(el))
  }
}

const generalUtils = new GeneralUtils()

export default generalUtils
