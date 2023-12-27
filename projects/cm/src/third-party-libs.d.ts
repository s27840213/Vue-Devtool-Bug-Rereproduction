declare module 'vite-plugin-transform' {
  import { Plugin } from 'vite'

  interface Options {
    alias?: Record<string, string>
    callbackArray?: ((str: string) => string)[]
    exclude?: (string | RegExp)[]
    replace?: Record<string, string>
    replaceFiles?: string[]
    tEnd?: string
    tStart?: string
  }

  declare const transformPlugin: (options?: Options) => Plugin
  export default transformPlugin
}

declare module 'node-sass-json-importer' {
  declare const importer: (opts?: {
    convertCase?: boolean
    resolver?: (dir: string, url: string) => string
  }) => void
  export default importer
}
