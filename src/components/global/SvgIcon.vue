<template lang="pug">
  div(@click="onClick")
    svg(class="svg-icon" :class="`text-${iconColor}`"
        ref="icon"
        :style="iconStyles()")
      use(:xlink:href="`#${iconName}`")
</template>
<script lang="ts">
import Vue from 'vue'
import { ILayer } from '@/interfaces/layer'
import { mapGetters, mapMutations } from 'vuex'
import ControlUtils from '@/utils/controlUtils'

/**
 * 這個 Components 我把它註冊在全域，使用時可以用不Import
 * 另外，在@/assets/icon 資料夾的 icon 我有另外進行輸出處理
 * 只要對他的 css property: color 進行處理就能達到顏色切換的效果
 * 這 Components 主要原理是利用svg的symbol元素，將icon包括在symbol中，透過use元素使用该symbol
 * 因為是原生svg tag 瀏覽器支援度高！
 * 要注意目前無法直接透過 img(src="icon") 來獲取icon資料夾的svg哦，因為我有在 Webpack做些設定
 * icon資料夾的圖檔都是單色可切換顏色的圖片，若是普通的 svg icon 就把它放在img/svg資料夾內，以此來做區分
 */

export default Vue.extend({
  name: 'SvgIcon',
  props: {
    iconName: {
      type: String,
      default: 'menu'
    },
    iconWidth: {
      type: String,
      default: '40px'
    },
    iconColor: {
      type: String,
      default: 'blue-1'
    }
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      _getLayer: 'getLayer'
    }),
    pageIndex(): number {
      return this.lastSelectedPageIndex
    },
    layerIndex(): number {
      return this.lastSelectedLayerIndex
    }
  },
  methods: {
    ...mapMutations({
      updateLayerStyles: 'UPDATE_layerStyles'
    }),
    iconStyles() {
      return {
        width: this.iconWidth,
        height: this.iconWidth
      }
    },
    onClick(e: MouseEvent) {
      if (this.iconName.substring(0, 10) === 'text-align') {
        this.textAlign()
      } else if (this.iconName === 'bold') {
        this.textBold()
      } else if (this.iconName === 'underline') {
        this.textUnderline()
      } else if (this.iconName === 'italic') {
        this.textItalic()
      } else if (this.iconName === 'font-vertical') {
        this.textVertical()
      }
    },
    textAlign() {
      console.log('hi')
      const alignStyle = this.iconName.substring(11, this.iconName.length)
      this.updateTextStyles(this.pageIndex, this.layerIndex, { align: alignStyle })
    },
    textBold() {
      let weight = 'normal'
      if (this.getLayer().styles.weight === 'normal') {
        weight = 'bold'
      }
      this.updateTextStyles(this.pageIndex, this.layerIndex, { weight: weight })
    },
    textUnderline() {
      let decoration = 'none'
      if (this.getLayer().styles.decoration === 'none') {
        decoration = 'underline'
      }
      this.updateTextStyles(this.pageIndex, this.layerIndex, { decoration: decoration })
    },
    textItalic() {
      let style = 'normal'
      if (this.getLayer().styles.style === 'normal') {
        style = 'italic'
      }
      this.updateTextStyles(this.pageIndex, this.layerIndex, { style: style })
    },
    textVertical() {
      let writingMode = 'initial'
      const layer = this.getLayer()
      if (layer.styles.writingMode === 'initial') {
        writingMode = 'vertical-lr'
      }

      const textSize = {
        width: layer.styles.height,
        height: layer.styles.width
      }
      ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, layer.styles.size as number)
      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, 1)
      this.updateTextStyles(this.lastSelectedPageIndex, this.lastSelectedLayerIndex, { writingMode: writingMode })
    },
    updateTextStyles(pageIndex: number, layerIndex: number, styles: { [key: string]: string }) {
      this.updateLayerStyles({
        pageIndex,
        layerIndex,
        styles
      })
    },
    getLayer(): ILayer {
      return this._getLayer(this.lastSelectedPageIndex, this.lastSelectedLayerIndex)
    }
  }
})
</script>

<style lang="scss" scoped>
.svg-icon {
  width: 100%;
  transition: background-color 0.2s;
}
</style>
