// Implement require() for vite. YOU CANNOT USE require BEFORE ASSIGN TO WINDOW.
// Usage1: require('@img/...'), get img from lib.
// Usage2: require('...'), get img from cm.
window.require = ((src: string) => {
  if (src.startsWith('@img/')) {
    src = src.replace('@img/', '')
    return new URL(`../../../packages/vivi-lib/src/assets/img/${src}`, import.meta.url).href
  }
  if (src.startsWith('@json/')) {
    src = src.replace('@json/', '')
    return new URL(`../../../packages/vivi-lib/src/assets/json/${src}`, import.meta.url).href
  }
  return new URL(`./assets/img/${src}`, import.meta.url).href
}) as unknown as NodeRequire
