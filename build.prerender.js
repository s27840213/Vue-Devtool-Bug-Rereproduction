const path = require('path')

module.exports = (api, options) => {
  api.registerCommand('build:prerender', async (args) => {
    const PrerenderSPAPlugin = require('prerender-spa-plugin')
    const Renderer = PrerenderSPAPlugin.PuppeteerRenderer

    api.chainWebpack(config => {
      config.plugin('prerender').use(PrerenderSPAPlugin, [{
        staticDir: path.join(__dirname, 'dist'),
        routes: ['/', '/tw', '/us', '/1234567', '/templates', '/signup'],
        renderer: new Renderer({
          renderAfterDocumentEvent: 'render-event',
          headless: true
        })
      }])
    })

    await api.service.run('build', args)
  })
}

module.exports.defaultModes = {
  'build:prerender': 'production'
}
