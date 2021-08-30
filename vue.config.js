const path = require('path')
const webpack = require('webpack')
const SentryWebpackPlugin = require('@sentry/webpack-plugin')

function resolve(dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  chainWebpack: (config) => {
    // 先刪除預設的svg配置，否則svg-sprite-loader會失效
    config.module.rules.delete('svg')
    // 新增 svg-sprite-loader 設定
    config.module
      .rule('svg-sprite-loader')
      .test(/\.svg$/)
      .include.add(resolve('src/assets/icon'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({ symbolId: '[name]' })
    /**
     * 由於上面的代碼會讓 'src/assets/icon' 資料夾以外的svg全都不能用，
     * 但並不是所有svg圖檔都要拿來當icon，故設定另外一個loader來處理其他svg
     */
    config.module
      .rule('file-loader')
      .test(/\.svg$/)
      .exclude.add(resolve('src/assets/icon'))
      .end()
      .use('file-loader')
      .loader('file-loader')

    if (process.env.CI && ['production', 'staging'].includes(process.env.NODE_ENV)) {
      config.plugin('sentry')
        .use(SentryWebpackPlugin, [{
          authToken: process.env.SENTRY_AUTH_TOKEN,
          release: process.env.VUE_APP_VERSION,
          org: 'nuphoto',
          project: 'vivipic',
          include: './dist',
          ignore: ['node_modules', 'vue.config.js'],
        }])
    }
  },
  css: {
    loaderOptions: {
      scss: {
        prependData: '@import "~@/assets/scss/main.scss";'
      }
    }
  }
}
