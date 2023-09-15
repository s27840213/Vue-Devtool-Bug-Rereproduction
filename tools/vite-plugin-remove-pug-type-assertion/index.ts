import fs from "fs"
import type { Plugin } from "vite"

const vitePluginPugBuild = (): Plugin => {
  return {
    name: "vite-plugin-remove-pug-type-assertion",
    enforce: "pre",
    apply: "build",
    load(id: string) {
      if (!id.endsWith(".vue")) return
      
      let content = fs.readFileSync(id, "utf-8")
      // Remove type assertion in pug block for vue files.
      content = content.replace(/(?<==".+)( as [\w<>|', ]+)/g, '')
      return content
    },
  }
}

export default function() {
  return vitePluginPugBuild()
}
