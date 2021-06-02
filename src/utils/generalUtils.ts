class GeneralUtils {
  deepCopy(el: unknown) {
    return JSON.parse(JSON.stringify(el))
  }

  exact(conditions: Array<boolean>): boolean {
    return conditions.filter((condition: boolean) => {
      return condition === true
    }).length === 1
  }
}

const generalUtils = new GeneralUtils()

export default generalUtils
