/* eslint-disable indent */
const path = require('path')
const webpack = require('webpack')
const SentryWebpackPlugin = require('@sentry/webpack-plugin')
const PrerenderSPAPlugin = require('prerender-spa-plugin')
const Renderer = PrerenderSPAPlugin.PuppeteerRenderer
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const { argv } = require('yargs')

function resolve (dir) {
    return path.join(__dirname, dir)
}

module.exports = {
    chainWebpack: (config) => {
        // To prevent safari use cached app.js, https://github.com/vuejs/vue-cli/issues/1132#issuecomment-409916879
        if (process.env.NODE_ENV === 'development') {
            config
                .output
                .filename('[name].[hash].js')
                .end()
        }
        config.module
            .rule('mjs')
            .test(/\.mjs$/)
            .type('javascript/auto')
            .include.add(/node_modules/)
            .end()

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

        // config.module
        //     .rule('babel-loader')
        //     .test(/\.js$/)
        //     .exclude.add(/(node_modules)/)
        //     .include.add(/(js)/)
        //     .end()
        //     .use('babel-loader')
        //     .loader('babel-loader')
        //     .options({
        //         cacheDirectory: true,
        //         presets: [
        //             [
        //                 'es2015',
        //                 {
        //                     loose: true
        //                 }
        //             ]
        //         ]
        //     })

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
        if (process.env.BITBUCKET_BUILD_NUMBER) {
            config.plugin('define').tap(args => {
                const name = 'process.env'
                args[0][name].VUE_APP_BUILD_NUMBER = process.env.BITBUCKET_BUILD_NUMBER || ''
                return args
            })
        }

        if (argv.PRERENDER) {
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
                    routes: ['/', '/tw', '/us', '/jp', '/templates', '/tw/templates', '/us/templates', '/jp/templates', '/editor', '/pricing', '/brandkit'],
                    renderer: new Renderer({
                        // The name of the property
                        injectProperty: '__PRERENDER_INJECTED',
                        // The values to have access to via `window.injectProperty` (the above property )
                        inject: { PRERENDER: 1 },
                        renderAfterDocumentEvent: 'render-event',
                        headless: true
                    })
                }])
        }

        // if (process.env.NODE_ENV === 'production') {
        if (process.env.npm_config_report) {
            config
                .plugin('webpack-bundle-analyzer')
                .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin)
                .end()
            config.plugins.delete('prefetch')
        }
        // }

        config
            .plugin('speed-measure-webpack-plugin')
            .use(SpeedMeasurePlugin)
            .end()
        // .use(SpeedMeasurePlugin, [{
        //     outputFormat: 'humanVerbose',
        //     loaderTopFiles: 5
        // }])
    },

    configureWebpack: {
        // 优化
        optimization: {
            minimizer: [
                new UglifyJsPlugin({
                    uglifyOptions: {
                        output: { // 删除注释
                            comments: false
                        },
                        // 生产环境自动删除console
                        compress: {
                            // drop_debugger: true, // 清除 debugger 语句
                            // drop_console: true, // 清除console语句
                            // pure_funcs: ['console.log']
                        }
                    },
                    sourceMap: false,
                    parallel: true
                })
            ]
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
                prependData: '@use "~@/assets/scss/utils" as *;'
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
            enableBridge: true,
            enableLegacy: true,
            runtimeOnly: false,
            compositionOnly: true,
            fullInstall: true
        }
    }
}
