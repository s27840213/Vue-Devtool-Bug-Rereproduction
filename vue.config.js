/**
 * Chain-webpack 文件
 * 規則處理順序:
 *  - pre 優先處理
 *  - normal 正常處理 (default)
 *  - inline 其次處理
 *  - post 最後處理
 *         config.module
            .rule('lint') // 定義一個叫 lint 的規則
                .test(/\.js$/) // 設置 lint 規則的 RexExp 來匹配對應檔案
                .pre()  // 指定此規則的優先級
                .include // 設置當前規則作用的資料夾
                    .add('src')
                    .end()
                .use('eslint') // 指定一个名叫 eslint 的 loader 配置
                    .loader('eslint-loader') // 該配置使用 eslint-loader 作為 loader
                    .options({ // 該 eslint-loader 的配置
                        rules: {
                            semi: 'off'
                        }
                    })
                    .end()
                .use('zidingyi') // 指定一个名叫 zidingyi 的 loader 配置
                    .loader('zidingyi-loader') // 该配置使用 zidingyi-loader 作為處理 loader
                    .options({ // 該 zidingyi-loader 的配置
                        rules: {
                            semi: 'off'
                        }
                    })
 */

/* eslint-disable indent */

const path = require('path')
const webpack = require('webpack')
// const SentryWebpackPlugin = require('@sentry/webpack-plugin')
const PrerenderSPAPlugin = require('prerender-spa-plugin-next')
const Renderer = PrerenderSPAPlugin.PuppeteerRenderer
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const { argv } = require('yargs')
const { defineConfig } = require('@vue/cli-service')

function resolve (dir) {
    return path.join(__dirname, dir)
}

module.exports = defineConfig({
    transpileDependencies: true,
    chainWebpack: (config) => {
        // config.resolve.alias.set('vue', '@vue/compat')

        // config.module
        //     .rule('vue')
        //     .use('vue-loader')
        //     .tap(options => {
        //         return {
        //             ...options,
        //             compilerOptions: {
        //                 compatConfig: {
        //                     MODE: 2
        //                 }
        //             }
        //         }
        //     })

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

        // set worker-loader
        config.module
            .rule('worker')
            .test(/\.worker\.(j|t)s$/)
            .exclude.add(/node_modules/)
            .end()
            .use('worker-loader')
            .loader('worker-loader')
            .end()
        // config.module
        //     .rule('worker')
        //     .test(/\.worker\.ts$/)
        // .use('ts-loader')
        // .loader('ts-loader')
        // .end()

        // 解决：worker 热更新问题
        // config.module.rule('js').exclude.add(/\.worker\.js$/)
        config.module.rule('ts').exclude.add(/\.worker\.ts$/)

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
             * 以下 API 已被棄用
        */
        // config.module
        //     .rule('file-loader')
        //     .test(/\.svg$/)
        //     .exclude.add(resolve('src/assets/icon'))
        //     .end()
        //     .use('file-loader')
        //     .loader('file-loader')

        config.module
            .rule('image-assets')
            .test(/\.(png|jpg|gif|svg|mp4)$/)
            .exclude.add(resolve('src/assets/icon'))
            .end()
            .type('asset/resource')
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

        config.module
            .rule('vue')
            .use('vue-loader')
            .loader('vue-loader')
            .tap(options => {
                options.exposeFilename = true
                return options
            })

        // if (process.env.CI && ['production', 'staging'].includes(process.env.NODE_ENV)) {
        //     config.plugin('sentry')
        //         .use(SentryWebpackPlugin, [{
        //             authToken: process.env.SENTRY_AUTH_TOKEN,
        //             release: process.env.VUE_APP_VERSION,
        //             org: 'nuphoto',
        //             project: 'vivipic',
        //             include: './dist',
        //             ignore: ['node_modules', 'vue.config.js']
        //         }])
        // }
        if (process.env.BITBUCKET_BUILD_NUMBER) {
            config.plugin('define').tap(args => {
                const name = 'process.env'
                args[0][name].VUE_APP_BUILD_NUMBER = process.env.BITBUCKET_BUILD_NUMBER || ''
                return args
            })
        }
        // Write build number to ver.txt in production.
        if (process.env.NODE_ENV === 'production') {
            const fs = require('fs')
            const content = process.env.BITBUCKET_BUILD_NUMBER || ''
            if (!fs.existsSync('dist')) fs.mkdirSync('dist')
            fs.writeFile('dist/ver.txt', content, err => {
                if (err) console.error(err)
            })
        }

        if (argv.PRERENDER) {
            console.log('start prerender')
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
                    routes: ['/', '/tw', '/us', '/jp'],
                    minify: {
                        minifyCSS: true,
                        removeComments: true
                    },
                    renderer: require('@prerenderer/renderer-puppeteer'),
                    rendererOptions: {
                        injectProperty: '__PRERENDER_INJECTED',
                        // The values to have access to via `window.injectProperty` (the above property )
                        inject: { PRERENDER: 1 },
                        renderAfterDocumentEvent: 'render-event',
                        headless: true,
                        timeout: 20000
                    }
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
            ],
            minimize: false
        }
    },

    css: {
        loaderOptions: {
            scss: {
                // prependData: '@use "~@/assets/scss/utils" as *;'
                additionalData: '@use "@/assets/scss/utils" as *;'
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
            fullInstall: true
        }
    }
})
