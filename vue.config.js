/* eslint-disable indent */
const path = require('path')
const webpack = require('webpack')
const SentryWebpackPlugin = require('@sentry/webpack-plugin')
const PrerenderSPAPlugin = require('prerender-spa-plugin')
const Renderer = PrerenderSPAPlugin.PuppeteerRenderer
const { argv } = require('yargs')

function resolve (dir) {
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
                    ignore: ['node_modules', 'vue.config.js']
                }])
        }
        console.log(argv)
        if (process.env.BITBUCKET_BUILD_NUMBER) {
            config.plugin('define').tap(args => {
                let name = 'process.env'
                args[0][name]['VUE_APP_BUILD_NUMBER'] = process.env.BITBUCKET_BUILD_NUMBER || ''
                return args
            })
        }
        if (argv.PRERENDER) {
            config.plugin('define').tap(args => {
                let name = 'process.env'
                args[0][name]['VUE_APP_PRERENDER'] = argv.PRERENDER || ''
                return args
            })
            // Tell Vue (CLI 3) to provide this file to Pre-SPA:
            config.plugin('html')
                .tap(args => {
                    args[0].template = path.join(__dirname, 'public', 'index.html')
                    args[0].filename = 'app.html'
                    return args
                })
            config.plugin('prerender')
                .use(PrerenderSPAPlugin, [{
                    // Tell the Pre-SPA plugin not to use index.html as its template file.
                    indexPath: path.join(__dirname, 'dist', 'app.html'),
                    staticDir: path.join(__dirname, 'dist'),
                    routes: ['/', '/tw', '/us', '/jp', '/templates'],
                    renderer: new Renderer({
                        renderAfterDocumentEvent: 'render-event',
                        headless: true
                    })
                }])
        }
    },

    // configureWebpack: {
    //     plugins: [
    //         new PrerenderSPAPlugin({
    //             staticDir: path.join(__dirname, 'dist'),
    //             routes: ['/', '/tw', '/us', '/jp', '/templates'],
    //             renderer: new Renderer({
    //                 renderAfterDocumentEvent: 'render-event',
    //                 headless: true
    //             }),
    //             injectProperty: '__PRERENDER_INJECTED',
    //             // Optional - Any values you'd like your app to have access to via `window.injectProperty`.
    //             inject: {
    //                 isPrerender: true
    //             }
    //         })
    //     ]
    // },
    // indexPath: 'app.html',
    css: {
        loaderOptions: {
            scss: {
                prependData: '@import "~@/assets/scss/main.scss";'
            }
        }
    },

    pluginOptions: {
        i18n: {
            locale: 'us',
            fallbackLocale: 'us',
            localeDir: 'locales',
            enableInSFC: true,
            includeLocales: false,
            enableBridge: true
        }
    }
}
