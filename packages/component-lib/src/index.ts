const utils: Record<string, any> = import.meta.glob('./utils/*.ts')
// Extract named exports from the imported modules
const namedExports: { [index: string]: any } = {}

Object.keys(utils).forEach((key) => {
  const moduleName = key.match(/\.\/utils\/(.*).ts$/)?.[1] // Extract module name
  if (moduleName) {
    namedExports[moduleName] = utils[key].default // Assuming there's a default export
  }
})
export default utils

export { namedExports }
