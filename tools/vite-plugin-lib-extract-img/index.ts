import { createFilter } from 'vite'
import libAssetsPluginF from '@laynezh/vite-plugin-lib-assets'
import fs from 'fs'
import * as path from 'path'

const libAssetsPluginOptions = {
  include: 'src/assets/{img,json}/**/*',
  exclude: '**/*.{css,scss,vue}',
}
const libAssetsPlugin = libAssetsPluginF({
  include: libAssetsPluginOptions.include,
  exclude: libAssetsPluginOptions.exclude,
  // limit: 1024 * 1000,
  name: '[name].[ext]',
  outputPath: (url, resourcePath) => {
    const outputPath = resourcePath.replace(/\/[^/]+$/, '')
      .replace(__dirname, './')
    return outputPath
  }
})
const assetsContentMap = new Map()
const filter = createFilter(
  libAssetsPluginOptions.include,
  libAssetsPluginOptions.exclude
)
libAssetsPlugin.resolveId = function(source, importer = '') {
  const importerDir = importer.endsWith(path.sep) ? importer : path.dirname(importer);
  const id = path.resolve(importerDir, source);
  if (!filter(id) || id.includes('*')) return null
    
  // EmitFile to have it show up in the dist.
  if (!assetsContentMap.get(id)) {
    const pureId = id.split("?")[0]
    if (!fs.existsSync(pureId)) {
      console.warn(`[vite-plugin-lib-assets]: file not found ${id}`);
      return null
    } else {
      const filename = source.replace(/^.+assets/, 'src/assets')
      const fullname = source.replace(/^.+assets/, path.join(__dirname, 'src/assets'))
      const content = fs.readFileSync(pureId);
      assetsContentMap.set(id, content);
      this.emitFile({
        type: 'asset',
        fileName: filename,
        name: fullname,
        source: content,
      })
    }
  }

  // Return result
  const assetPath = path.relative(
    path.dirname(importer),
    id,
  )
  return {
    id: `./${assetPath}`,
    external: "relative",
  }
}

export default libAssetsPlugin
