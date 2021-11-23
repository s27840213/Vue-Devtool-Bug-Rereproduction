<template lang="pug">
  div(class="nu-shape" :style="styles()")
    svg(:view-box.camel="viewBoxFormatter" :style="styles()")
      defs(v-if="config.category === 'E'" v-html="svgFormatter")
      defs
        filter(v-if="config.category === 'C'" :id="className" v-html="filterFormatter")
        clipPath(v-if="config.category === 'E'" :id="clipPathId")
          use(:xlink:href="svgId")
      g(v-if="config.category === 'E'")
        use(:xlink:href="svgId" :clip-path="'url(#' + clipPathId + ')'" :class="className + 'S0'")
      g(v-else :filter="config.category === 'C' ? filterId : 'none'" v-html="svgFormatter")
</template>

<script lang="ts">
import Vue from 'vue'
import shapeUtils from '@/utils/shapeUtils'
import { IShape } from '@/interfaces/layer'

const FILTER_X = '$fx'
const FILTER_Y = '$fy'
const FILTER_X_EXT = '$fextx'
const FILTER_Y_EXT = '$fexty'
const CROP_X = '$fcx'
const CROP_Y = '$fcy'
const OFFSET_X = '$ofstx'
const OFFSET_Y = '$ofsty'
const FILTER_SIZE = '$fsize'
const FILTER_SIZE_EXT = '$fextsize'
const VIEWBOX_WIDTH = '$vbwd'
const VIEWBOX_HEIGHT = '$vbht'
const RGB_MAP = 'rgb_'
const RGBA_MEDIAN = 'rgba_'
const ALPHA_MAP = 'alpha_'
const ALPHA_MAP_MEDIAN = 'alpham_'
const TEMP_MEDIAN = 'm_'
const RGB_EXT = 8

const FILTER_X_REG = [new RegExp(`\\${FILTER_X}0`, 'g'), new RegExp(`\\${FILTER_X}1`, 'g')]
const FILTER_Y_REG = [new RegExp(`\\${FILTER_Y}0`, 'g'), new RegExp(`\\${FILTER_Y}1`, 'g')]
const FILTER_X_EXT_REG = [new RegExp(`\\${FILTER_X_EXT}0`, 'g'), new RegExp(`\\${FILTER_X_EXT}1`, 'g')]
const FILTER_Y_EXT_REG = [new RegExp(`\\${FILTER_Y_EXT}0`, 'g'), new RegExp(`\\${FILTER_Y_EXT}1`, 'g')]
const OFFSET_X_REG = [new RegExp(`\\${OFFSET_X}0`, 'g'), new RegExp(`\\${OFFSET_X}1`, 'g')]
const OFFSET_Y_REG = [new RegExp(`\\${OFFSET_Y}0`, 'g'), new RegExp(`\\${OFFSET_Y}1`, 'g')]
const FILTER_SIZE_REG = new RegExp(`\\${FILTER_SIZE}`, 'g')
const FILTER_SIZE_EXT_REG = new RegExp(`\\${FILTER_SIZE_EXT}`, 'g')
const VIEWBOX_WIDTH_REG = new RegExp(`\\${VIEWBOX_WIDTH}`, 'g')
const VIEWBOX_HEIGHT_REG = new RegExp(`\\${VIEWBOX_HEIGHT}`, 'g')
const CROP_X_REG = new RegExp(`\\${CROP_X}`, 'g')
const CROP_Y_REG = new RegExp(`\\${CROP_Y}`, 'g')

export default Vue.extend({
  data() {
    return {
      styleNode: null as any,
      transNode: null as any,
      filterTemplate: '',
      paramsReady: false
    }
  },
  async created() {
    switch (this.config.category) {
      case 'C': {
        // should be deleted after the new json format stablize
        if (!this.config.svg && this.config.designId) {
          const shape = await shapeUtils.fetchSvg(this.config)
          shape.color = this.config.color
          shape.className = shapeUtils.classGenerator()
          this.config.styles.initWidth = shape.vSize[0]
          this.config.styles.initHeight = shape.vSize[1]
          Object.assign(this.config, shape)
        }
        const transText = shapeUtils.transFormatter(this.className, this.config.transArray, {
          cSize: this.config.cSize,
          pSize: this.config.pSize,
          pDiff: this.config.pDiff
        })
        this.transNode = shapeUtils.addStyleTag(transText)
        this.filterTemplate = this.getFilterTemplate()
        break
      }
      case 'D': {
        if (!this.config.markerWidth) {
          await shapeUtils.addComputableInfo(this.config)
        }
        const transText = shapeUtils.markerTransFormatter(this.className, this.config.markerTransArray, this.config.size, this.config.point, this.config.markerWidth)
        this.transNode = shapeUtils.addStyleTag(transText)
        break
      }
      case 'E': {
        if (!this.config.svg) {
          shapeUtils.addComputableInfo(this.config)
        }
        break
      }
      default: {
        if (!this.config.svg && this.config.designId) {
          const shape = await shapeUtils.fetchSvg(this.config) as IShape
          shape.color = this.config.color
          shape.className = shapeUtils.classGenerator()
          Object.assign(this.config, shape)
          this.config.styles.initWidth = shape.vSize[0]
          this.config.styles.initHeight = shape.vSize[1]
        }
      }
    }
    // console.log(this.config.styleArray)
    const styleText = shapeUtils.styleFormatter(this.className, this.config.styleArray, this.config.color, this.config.size, this.config.dasharray, this.config.linecap, this.config.filled)
    this.styleNode = shapeUtils.addStyleTag(styleText)
    this.paramsReady = true
  },
  watch: {
    'config.color': {
      handler: function (newVal) {
        const styleText = shapeUtils.styleFormatter(this.className, this.config.styleArray, newVal, this.config.size, this.config.dasharray, this.config.linecap, this.config.filled)
        this.styleNode.textContent = styleText
      },
      deep: true
    },
    'config.pDiff': {
      handler: function (newVal) {
        if (this.config.category === 'C') {
          const styleText = shapeUtils.transFormatter(this.className, this.config.transArray ?? [], {
            cSize: this.config.cSize,
            pSize: this.config.pSize,
            pDiff: newVal
          })
          this.transNode.textContent = styleText
        }
      },
      deep: true
    },
    'config.point': {
      handler: function (newVal) {
        if (this.config.category === 'D') {
          const styleText = shapeUtils.markerTransFormatter(this.className, this.config.markerTransArray ?? [], this.config.size, newVal, this.config.markerWidth)
          this.transNode.textContent = styleText

          Object.assign(this.config.styles, shapeUtils.updatedDimensions(this.config.point, this.config.size[0], this.config.styles))
        }
      },
      deep: true
    },
    'config.size': {
      handler: function (newVal) {
        if (this.config.category === 'D') {
          const transText = shapeUtils.markerTransFormatter(this.className, this.config.markerTransArray ?? [], newVal, this.config.point, this.config.markerWidth)
          this.transNode.textContent = transText

          Object.assign(this.config.styles, shapeUtils.updatedDimensions(this.config.point, newVal[0], this.config.styles))
        }

        const styleText = shapeUtils.styleFormatter(this.className, this.config.styleArray, this.config.color, newVal, this.config.dasharray, this.config.linecap, this.config.filled)
        this.styleNode.textContent = styleText
      },
      deep: true
    },
    'config.dasharray': {
      handler: function (newVal) {
        const styleText = shapeUtils.styleFormatter(this.className, this.config.styleArray, this.config.color, this.config.size, newVal, this.config.linecap, this.config.filled)
        this.styleNode.textContent = styleText
      },
      deep: true
    },
    'config.linecap': {
      handler: function (newVal) {
        const styleText = shapeUtils.styleFormatter(this.className, this.config.styleArray, this.config.color, this.config.size, this.config.dasharray, newVal, this.config.filled)
        this.styleNode.textContent = styleText
      }
    },
    'config.filled': {
      handler: function (newVal) {
        const styleText = shapeUtils.styleFormatter(this.className, this.config.styleArray, this.config.color, this.config.size, this.config.dasharray, this.config.linecap, newVal)
        this.styleNode.textContent = styleText
      }
    },
    'config.markerId': {
      handler: function (newVal) {
        if (this.config.category === 'D') {
          const styleText = shapeUtils.markerTransFormatter(this.className, this.config.markerTransArray ?? [], this.config.size, this.config.point, this.config.markerWidth)
          this.transNode.textContent = styleText
        }

        const styleText = shapeUtils.styleFormatter(this.className, this.config.styleArray, this.config.color, this.config.size, this.config.dasharray, this.config.linecap, this.config.filled)
        this.styleNode.textContent = styleText
      },
      deep: true
    },
    'config.vSize': {
      handler: function (newVal) {
        if (this.config.category === 'E') {
          Object.assign(this.config.styles, { width: newVal[0], height: newVal[1], initWidth: newVal[0], initHeight: newVal[1] })
        }
      },
      deep: true
    }
  },
  computed: {
    className(): string {
      return this.config.className + this.pageIndex.toString()
    },
    filterId(): string {
      if (this.config.category === 'C') {
        return `url(#${this.className})`
      }
      return 'none'
    },
    svgId(): string {
      return `#${this.className}SVG`
    },
    clipPathId(): string {
      return `${this.className}C`
    },
    viewBoxFormatter(): string {
      if (this.paramsReady) {
        if (this.config.category === 'D') {
          return shapeUtils.lineViewBoxFormatter(this.config.point, this.config.size[0])
        }
        // console.log(this.layerIndex)
        // console.log(`0 0 ${this.config.vSize[0] + this.config.pDiff[0]} ${this.config.vSize[1] + this.config.pDiff[1]}`)
        return `0 0 ${this.config.vSize[0] + this.config.pDiff[0]} ${this.config.vSize[1] + this.config.pDiff[1]}`
      } else {
        return '0 0 0 0'
      }
    },
    svgFormatter(): string {
      if (this.paramsReady) {
        const point = (this.config.category === 'D') ? shapeUtils.pointPreprocess(this.config.point, this.config.markerWidth, this.config.trimWidth, this.config.size[0], this.config.linecap, this.config.trimOffset) : this.config.point
        const svgParameters = (this.config.category === 'E') ? shapeUtils.svgParameters(this.config.shapeType, this.config.vSize, this.config.size) : []
        return shapeUtils.svgFormatter(this.config.svg, this.className, this.config.styleArray.length, this.config.transArray?.length ?? 0, this.config.markerTransArray?.length ?? 0, point, svgParameters, this.config.pDiff)
      } else {
        return ''
      }
    },
    filterFormatter(): string {
      let estFilterRad = Math.ceil((4 * 100 * this.config.ratio / (this.$store.getters.getPageScaleRatio * this.config.styles.scale) - 1) / 2)
      if (estFilterRad < 1) {
        estFilterRad = 1
      } else if (estFilterRad > 20) {
        estFilterRad = 20
      }
      if (this.config.category === 'C') {
        const cropX = Math.floor(this.config.cSize[0] + (this.config.pSize[0] + this.config.pDiff[0]) / 2) - estFilterRad - RGB_EXT
        const cropY = Math.floor(this.config.cSize[1] + (this.config.pSize[1] + this.config.pDiff[1]) / 2) - estFilterRad - RGB_EXT
        const filterSizeNum = estFilterRad * 2 + 1
        const filterSize = filterSizeNum.toString()
        const filterExtSize = (filterSizeNum + RGB_EXT * 2).toString()
        const boundH = [Math.floor(this.config.cSize[0]) - estFilterRad, Math.floor(this.config.cSize[0] + this.config.pSize[0] + this.config.pDiff[0]) - estFilterRad]
        const boundV = [Math.floor(this.config.cSize[1]) - estFilterRad, Math.floor(this.config.cSize[1] + this.config.pSize[1] + this.config.pDiff[1]) - estFilterRad]
        const boundExtH = [boundH[0] - RGB_EXT, boundH[1] - RGB_EXT]
        const boundExtV = [boundV[0] - RGB_EXT, boundV[1] - RGB_EXT]
        let filterString = this.filterTemplate
        switch (this.config.scaleType) {
          case 1:
            filterString = filterString.replace(FILTER_X_REG[0], boundH[0].toString())
            filterString = filterString.replace(FILTER_X_REG[1], boundH[1].toString())
            filterString = filterString.replace(FILTER_Y_REG[0], boundV[0].toString())
            filterString = filterString.replace(FILTER_Y_REG[1], boundV[1].toString())
            filterString = filterString.replace(VIEWBOX_WIDTH_REG, (this.config.vSize[0] + this.config.pDiff[0]).toString())
            filterString = filterString.replace(VIEWBOX_HEIGHT_REG, (this.config.vSize[1] + this.config.pDiff[1]).toString())
            filterString = filterString.replace(FILTER_SIZE_REG, filterSize)

            filterString = filterString.replace(FILTER_SIZE_EXT_REG, filterExtSize)
            filterString = filterString.replace(CROP_X_REG, cropX.toString())
            filterString = filterString.replace(CROP_Y_REG, cropY.toString())
            filterString = filterString.replace(FILTER_X_EXT_REG[0], boundExtH[0].toString())
            filterString = filterString.replace(FILTER_X_EXT_REG[1], boundExtH[1].toString())
            filterString = filterString.replace(FILTER_Y_EXT_REG[0], boundExtV[0].toString())
            filterString = filterString.replace(FILTER_Y_EXT_REG[1], boundExtV[1].toString())
            filterString = filterString.replace(OFFSET_X_REG[0], (boundExtH[0] - cropX).toString())
            filterString = filterString.replace(OFFSET_X_REG[1], (boundExtH[1] - cropX).toString())
            filterString = filterString.replace(OFFSET_Y_REG[0], (boundExtV[0] - cropY).toString())
            filterString = filterString.replace(OFFSET_Y_REG[1], (boundExtV[1] - cropY).toString())
            return filterString
          case 2:
            filterString = filterString.replace(FILTER_X_REG[0], boundH[0].toString())
            filterString = filterString.replace(FILTER_X_REG[1], boundH[1].toString())
            filterString = filterString.replace(VIEWBOX_HEIGHT_REG, this.config.vSize[1])
            filterString = filterString.replace(FILTER_SIZE_REG, filterSize)

            filterString = filterString.replace(FILTER_SIZE_EXT_REG, filterExtSize)
            filterString = filterString.replace(CROP_X_REG, cropX.toString())
            filterString = filterString.replace(FILTER_X_EXT_REG[0], boundExtH[0].toString())
            filterString = filterString.replace(FILTER_X_EXT_REG[1], boundExtH[1].toString())
            filterString = filterString.replace(OFFSET_X_REG[0], (boundExtH[0] - cropX).toString())
            filterString = filterString.replace(OFFSET_X_REG[1], (boundExtH[1] - cropX).toString())
            return filterString
          case 3:
            filterString = filterString.replace(FILTER_Y_REG[0], boundV[0].toString())
            filterString = filterString.replace(FILTER_Y_REG[1], boundV[1].toString())
            filterString = filterString.replace(VIEWBOX_WIDTH_REG, this.config.vSize[0])
            filterString = filterString.replace(FILTER_SIZE_REG, filterSize)

            filterString = filterString.replace(FILTER_SIZE_EXT_REG, filterExtSize)
            filterString = filterString.replace(CROP_Y_REG, cropY.toString())
            filterString = filterString.replace(FILTER_Y_EXT_REG[0], boundExtV[0].toString())
            filterString = filterString.replace(FILTER_Y_EXT_REG[1], boundExtV[1].toString())
            filterString = filterString.replace(OFFSET_Y_REG[0], (boundExtV[0] - cropY).toString())
            filterString = filterString.replace(OFFSET_Y_REG[1], (boundExtV[1] - cropY).toString())
            return filterString
        }
      }
      return ''
    }
  },
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
  },
  methods: {
    styles() {
      if (this.paramsReady) {
        return {
          width: `${(this.config.category === 'D') ? this.config.styles.initWidth : (this.config.vSize[0] + this.config.pDiff[0])}px`,
          height: `${(this.config.category === 'D') ? this.config.styles.initHeight : (this.config.vSize[1] + this.config.pDiff[1])}px`
        }
      } else {
        return {
          width: '0px',
          height: '0px'
        }
      }
    },
    getFilterTemplate(): string {
      if (this.config.category === 'C') {
        return this.getMergeTemplate()
      }
      return ''
    },
    getRGBTemplate(type: number): string {
      let templateX = ''
      let templateY = ''
      let templateWidth = ''
      let templateHeight = ''
      if (type === 1) {
        templateX = '0'
        templateY = CROP_Y
        templateWidth = VIEWBOX_WIDTH
        templateHeight = FILTER_SIZE_EXT
      } else {
        templateX = CROP_X
        templateY = '0'
        templateWidth = FILTER_SIZE_EXT
        templateHeight = VIEWBOX_HEIGHT
      }
      return `
      <feColorMatrix x="${templateX}" y="${templateY}" width="${templateWidth}" height="${templateHeight}" in="SourceGraphic"
        type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0 1" result="${RGB_MAP}${type}"/>`
    },
    getAlphaTemplate(type: number, ind: number): string {
      let templateX = ''
      let templateY = ''
      let templateWidth = ''
      let templateHeight = ''
      let templateXExt = ''
      let templateYExt = ''
      let templateWidthExt = ''
      let templateHeightExt = ''
      let dx = ''
      let dy = ''
      if (type === 1) {
        templateX = '0'
        templateY = `${FILTER_Y}${ind}`
        templateWidth = VIEWBOX_WIDTH
        templateHeight = FILTER_SIZE
        templateXExt = '0'
        templateYExt = `${FILTER_Y_EXT}${ind}`
        templateWidthExt = VIEWBOX_WIDTH
        templateHeightExt = FILTER_SIZE_EXT
        dx = '0'
        dy = `${OFFSET_Y}${ind}`
      } else {
        templateX = `${FILTER_X}${ind}`
        templateY = '0'
        templateWidth = FILTER_SIZE
        templateHeight = VIEWBOX_HEIGHT
        templateXExt = `${FILTER_X_EXT}${ind}`
        templateYExt = '0'
        templateWidthExt = FILTER_SIZE_EXT
        templateHeightExt = VIEWBOX_HEIGHT
        dx = `${OFFSET_X}${ind}`
        dy = '0'
      }

      return `
      <feOffset in="${RGB_MAP}${type}" x="${templateXExt}" y="${templateYExt}" width="${templateWidthExt}" height="${templateHeightExt}" dx="${dx}" dy="${dy}" result="${RGB_MAP}${TEMP_MEDIAN}${type}${ind}"/>
      <feColorMatrix x="${templateX}" y="${templateY}" width="${templateWidth}" height="${templateHeight}" in="SourceGraphic"
        type="matrix"
        values="0 0 0 1 0
                0 0 0 1 0
                0 0 0 1 0
                0 0 0 0 1" result="${ALPHA_MAP}${type}${ind}"/>`
    },
    getMedianFilterTemplate(type: number, ind: number): string {
      const mapName = ALPHA_MAP
      let kernel = []
      if (type === 1) {
        kernel = ['0 1 0 0 0 0 0 0 0', '0 0 0 0 1 0 0 0 0', '0 0 0 0 0 0 0 1 0']
      } else {
        kernel = ['0 0 0 1 0 0 0 0 0', '0 0 0 0 1 0 0 0 0', '0 0 0 0 0 1 0 0 0']
      }
      return `
      <feConvolveMatrix in="${mapName}${type}${ind}"
          kernelMatrix="${kernel[0]}" preserveAlpha="true" result="${mapName}p1${type}${ind}"/>
      <feConvolveMatrix in="${mapName}${type}${ind}"
          kernelMatrix="${kernel[1]}" preserveAlpha="true" result="${mapName}p2${type}${ind}"/>
      <feConvolveMatrix in="${mapName}${type}${ind}"
          kernelMatrix="${kernel[2]}" preserveAlpha="true" result="${mapName}p3${type}${ind}"/>
      <feBlend in="${mapName}p1${type}${ind}" in2="${mapName}p2${type}${ind}" mode="lighten" result="${mapName}a1${type}${ind}"/>
      <feBlend in="${mapName}p1${type}${ind}" in2="${mapName}p2${type}${ind}" mode="darken" result="${mapName}a2${type}${ind}"/>
      <feBlend in="${mapName}a2${type}${ind}" in2="${mapName}p3${type}${ind}" mode="lighten" result="${mapName}a3${type}${ind}"/>
      <feBlend in="${mapName}a3${type}${ind}" in2="${mapName}a1${type}${ind}" mode="darken" result="${mapName}${TEMP_MEDIAN}${type}${ind}"/>`
    },
    getIntermediateTemplate(type: number, ind: number): string {
      return `
      ${this.getAlphaTemplate(type, ind)}${this.getMedianFilterTemplate(type, ind)}${this.getCompositeTemplate(type, ind)}`
    },
    getCompositeTemplate(type: number, ind: number): string {
      return `
      <feColorMatrix
        in="${ALPHA_MAP}${TEMP_MEDIAN}${type}${ind}"
        type="matrix"
        values="0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                1 0 0 0 0" result="${ALPHA_MAP_MEDIAN}${type}${ind}"/>
      <feComposite in2="${ALPHA_MAP_MEDIAN}${type}${ind}" in="${RGB_MAP}${TEMP_MEDIAN}${type}${ind}" operator="atop" result="${RGBA_MEDIAN}${type}${ind}"/>`
    },
    getMergeTemplate(): string {
      let intermediateTemplate = ''
      let mergeNode = ''
      let mergeNodeF = ''
      switch (this.config.scaleType) {
        case 1:
          intermediateTemplate = `
          ${this.getRGBTemplate(0)}
          ${this.getIntermediateTemplate(0, 0)}
          ${this.getIntermediateTemplate(0, 1)}
          ${this.getRGBTemplate(1)}
          ${this.getIntermediateTemplate(1, 0)}
          ${this.getIntermediateTemplate(1, 1)}`
          mergeNode = `
          <feMergeNode in="${ALPHA_MAP}${TEMP_MEDIAN}00"/>
          <feMergeNode in="${ALPHA_MAP}${TEMP_MEDIAN}01"/>
          <feMergeNode in="${ALPHA_MAP}${TEMP_MEDIAN}10"/>
          <feMergeNode in="${ALPHA_MAP}${TEMP_MEDIAN}11"/>`
          mergeNodeF = `
          <feMergeNode in="${RGBA_MEDIAN}00"/>
          <feMergeNode in="${RGBA_MEDIAN}01"/>
          <feMergeNode in="${RGBA_MEDIAN}10"/>
          <feMergeNode in="${RGBA_MEDIAN}11"/>`
          break
        case 2:
          intermediateTemplate = `
          ${this.getRGBTemplate(0)}
          ${this.getIntermediateTemplate(0, 0)}
          ${this.getIntermediateTemplate(0, 1)}`
          mergeNode = `
          <feMergeNode in="${ALPHA_MAP}${TEMP_MEDIAN}00"/>
          <feMergeNode in="${ALPHA_MAP}${TEMP_MEDIAN}01"/>`
          mergeNodeF = `
          <feMergeNode in="${RGBA_MEDIAN}00"/>
          <feMergeNode in="${RGBA_MEDIAN}01"/>`
          break
        case 3:
          intermediateTemplate = `
          ${this.getRGBTemplate(1)}
          ${this.getIntermediateTemplate(1, 0)}
          ${this.getIntermediateTemplate(1, 1)}`
          mergeNode = `
          <feMergeNode in="${ALPHA_MAP}${TEMP_MEDIAN}10"/>
          <feMergeNode in="${ALPHA_MAP}${TEMP_MEDIAN}11"/>`
          mergeNodeF = `
          <feMergeNode in="${RGBA_MEDIAN}10"/>
          <feMergeNode in="${RGBA_MEDIAN}11"/>`
          break
      }
      return `
      ${intermediateTemplate}
      <feMerge result="m">${mergeNode}
      </feMerge>
      <feComposite in="SourceGraphic" in2="m" operator="out" result="rgbf"/>
      <feMerge>
        <feMergeNode in="rgbf"/>${mergeNodeF}
      </feMerge>`
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-shape {
  display: relative;
  svg {
    display: block;
  }
}
</style>
