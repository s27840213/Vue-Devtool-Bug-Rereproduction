declare module 'vite-plugin-transform' {
  import { Plugin } from 'vite'

  interface Options {
    alias?: Record<string, string>
    callbackArray?: ((str: string) => string)[]
    exclude?: sting[]
    replace?: Record<string, string>
    replaceFiles?: string[]
    tEnd?: string
    tStart?: string
  }

  declare const transformPlugin: (options?: Options) => Plugin
  export default transformPlugin
}
