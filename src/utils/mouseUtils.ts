/**
 */
import store from '@/store'
import { ILayer } from '@/interfaces/layer'
import GroupUtils from '@/utils/groupUtils'
import { SidebarPanelType } from '@/store/types'
import LayerFactary from '@/utils/layerFactary'
import ZindexUtils from '@/utils/zindexUtils'
class MouseUtils {
  getMouseAbsPoint(e: MouseEvent) {
    return { x: e.clientX, y: e.clientY }
  }

  getMouseRelPoint(e: MouseEvent, target: HTMLElement | { x: number, y: number }) {
    let x: number
    let y: number
    if (target instanceof HTMLElement) {
      const rect = target.getBoundingClientRect()
      x = e.clientX + target.scrollLeft - rect.left
      y = e.clientY + target.scrollTop - rect.top
    } else {
      x = e.clientX - target.x
      y = e.clientY - target.y
    }
    return { x, y }
  }

  onDrop(e: DragEvent, pageIndex: number, targetOffset: { x: number, y: number } = { x: 0, y: 0 }, clipPath = '') {
    if (e.dataTransfer === null) return

    const data = JSON.parse(e.dataTransfer.getData('data'))
    const target = e.target as HTMLElement
    const targetPos = {
      x: target.getBoundingClientRect().x,
      y: target.getBoundingClientRect().y
    }

    if (clipPath && data.type === 'image') {
      const imgHW = {
        width: data.styles.width,
        heihgt: data.styles.height
      }
      const clipperHW = {
        width: target.getBoundingClientRect().width,
        height: target.getBoundingClientRect().height
      }
      const ratio = {
        width: clipperHW.width / imgHW.width,
        height: clipperHW.height / imgHW.heihgt
      }
      let scaleRatio: number
      if (imgHW.width > imgHW.heihgt) {
        scaleRatio = ratio.height
      } else {
        scaleRatio = ratio.width
      }
      const clippedStyles = {
        initWidth: imgHW.width * scaleRatio,
        initHeight: imgHW.heihgt * scaleRatio,
        width: clipperHW.width,
        height: clipperHW.height
      }
      Object.assign(data.styles, clippedStyles)
    }

    const x = (e.clientX - targetPos.x + targetOffset.x - data.styles.x) * (100 / store.state.pageScaleRatio)
    const y = (e.clientY - targetPos.y + targetOffset.y - data.styles.y) * (100 / store.state.pageScaleRatio)
    if (store.getters.getCurrSidebarPanelType !== SidebarPanelType.bg) {
      const layerConfig: ILayer = {
        type: data.type,
        pageIndex: pageIndex,
        active: false,
        shown: false,
        styles: {
          x: x,
          y: y,
          initX: x,
          initY: y,
          scale: 1,
          scaleX: 0,
          scaleY: 0,
          rotate: 0,
          width: data.styles.width,
          height: data.styles.height,
          initWidth: data.styles.initWidth ? data.styles.initWidth : data.styles.width,
          initHeight: data.styles.initHeight ? data.styles.initHeight : data.styles.height,
          zindex: -1
        }
      }

      let layer
      if (data.type === 'image') {
        if (clipPath) {
          layerConfig.clipPath = `path('${clipPath}')`
        }
        layer = LayerFactary.newImage(pageIndex, Object.assign(layerConfig, { src: data.src }))
      } else if (data.type === 'text') {
        const tmpPos = { x: layerConfig.styles.x, y: layerConfig.styles.y }
        Object.assign(layerConfig.styles, data.styles)
        layerConfig.styles.x = tmpPos.x
        layerConfig.styles.y = tmpPos.y
        layer = LayerFactary.newText(pageIndex, Object.assign(layerConfig, { text: data.text }))
      } else if (data.type === 'shape') {
        const shapeConfig = {
          viewBox: data.viewBox,
          path: data.path,
          category: data.category,
          clipper: data.clipper
        }
        const tmpPos = { x: layerConfig.styles.x, y: layerConfig.styles.y }
        Object.assign(layerConfig.styles, data.styles)
        layerConfig.styles.x = tmpPos.x
        layerConfig.styles.y = tmpPos.y
        layer = LayerFactary.newShape(pageIndex, Object.assign(layerConfig, shapeConfig))
      }
      // used to test for cross-site-scripting

      // const obj = document.createElement('object')
      // obj.data = require('@/assets/img/svg/circle.svg')
      // obj.type = 'image/svg+xml'

      // // let svgDoc: any
      // // obj.addEventListener('load', function() {
      // //   svgDoc = obj.contentDocument
      // //   const str = new XMLSerializer().serializeToString(svgDoc)
      // //   console.log(str)

      // //   const svg = document.createElement('div')
      // //   svg.innerHTML = `<?xml version="1.0" encoding="utf-8"?><!-- Generator: Adobe Illustrator 25.2.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  --><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="圖層_1" x="0px" y="0px" viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve"><link xmlns="" type="text/css" id="dark-mode" rel="stylesheet" href=""/><style xmlns="" type="text/css" id="dark-mode-custom-style"/>
      // //   <script>alert('xxx')</script>
      // //   <style type="text/css">
      // //     .st0{fill:#008BDB;}
      // //   </style>
      // //   <circle class="st0" cx="400" cy="400" r="265"/>
      // //   </svg>`
      // //   document.body.appendChild(svg)
      // // }, false)

      // // document.body.appendChild(obj)
      // const svg = document.createElement('div')
      // svg.innerHTML = `<?xml version="1.0" encoding="utf-8"?><!-- Generator: Adobe Illustrator 25.2.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  --><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="圖層_1" x="0px" y="0px" viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve"><link xmlns="" type="text/css" id="dark-mode" rel="stylesheet" href=""/><style xmlns="" type="text/css" id="dark-mode-custom-style"/>
      // <script>alert(this)</script>
      // <style type="text/css">
      //   .st0{fill:#008BDB;}
      // </style>
      // <circle class="st0" cx="400" cy="400" r="265"/>
      // </svg>`
      // document.body.appendChild(svg)
      store.commit('ADD_newLayers', {
        pageIndex: pageIndex,
        layers: [layer]
      })
      ZindexUtils.reassignZindex(pageIndex)
      GroupUtils.deselect()
      store.commit('SET_lastSelectedPageIndex', pageIndex)

      /**
       * @param {HTMLElement} targetPage - when we drop something to page, we lose focus of the page, so we can't use any shortcut unless we click the page again
       * Thus, we need to get the target page to make it focused
       */
      const targetPage = document.querySelector(`.nu-page-${pageIndex}`) as HTMLElement
      targetPage.focus()
      GroupUtils.select([store.getters.getLayers(pageIndex).length - 1])
    } else {
      store.commit('SET_backgroundImageSrc', {
        pageIndex: pageIndex,
        imageSrc: data.src
      })
    }
  }
}

const mouseUtils = new MouseUtils()
export default mouseUtils
