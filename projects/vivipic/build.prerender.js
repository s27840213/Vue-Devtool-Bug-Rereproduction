const path = require('path')

module.exports = (api, options) => {
  api.registerCommand('build:test', async (args) => {
    console.log('Start build prerender process')
    await api.service.run('build', args)
  })
}

module.exports.defaultModes = {
  'build:prerender': 'production'
}
