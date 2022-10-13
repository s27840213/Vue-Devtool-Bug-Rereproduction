const fs = require('fs')
const args = process.argv

if (args.length < 6) {
  console.log('not enough args: propName, propType, propDefault')
  return
}

class VuexHelper {
  propName
  propType
  propDefault
  stateType
  constructor(propName, propType, propDefault, stateType) {
    this.propName = propName
    this.propType = propType
    this.propDefault = propDefault
    this.stateType = stateType
  }

  capitalize(str) {
    return str[0].toUpperCase() + str.substring(1)
  }

  outInterface() {
    return `${this.propName}: ${this.propType}`
  }

  outDefaultValue() {
    return `${this.propName}: ${this.propDefault}`
  }

  outGetter() {
    return `,
    get${this.capitalize(this.propName)}(state: ${this.stateType}): ${this.propType} {
      return state.${this.propName}
    }`
  }

  outSetter() {
    return `,
    SET_${this.propName}(state: ${this.stateType}, ${this.propName}: ${this.propType}) {
      state.${this.propName} = ${this.propName}
    }`
  }
}

const propName = args[2]
const propType = args[3]
const propDefault = args[4]
const stateType = args[5]

// console.log(propName, propType, propDefault)
const helper = new VuexHelper(propName, propType, propDefault, stateType)

let content = ''
content += helper.outInterface()
content += '\n'
content += helper.outDefaultValue()
content += '\n'
content += helper.outGetter()
content += '\n'
content += helper.outSetter()
content += '\n'

try {
  fs.writeFileSync(`./${propName}.txt`, content)
} catch (error) {
  console.error(error)
}
