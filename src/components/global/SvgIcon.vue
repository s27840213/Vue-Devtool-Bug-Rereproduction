<template lang="pug">
svg(v-if="iconName === 'loading'"
    class="svg-icon"
    :class="`text-${iconColor} svg-${iconName}`"
    viewBox="0 0 120 30"
    :style="iconStyles()"
    v-html="loadingSvg")
svg(v-else class="svg-icon" :class="`text-${iconColor} svg-${iconName}`"
    :style="iconStyles()")
  use(:xlink:href="`#${iconName}`")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

/**
 * 這個 Components 我把它註冊在全域，使用時可以用不Import
 * 另外，在@/assets/icon 資料夾的 icon 我有另外進行輸出處理
 * 只要對他的 css property: color 進行處理就能達到顏色切換的效果
 * 這 Components 主要原理是利用svg的symbol元素，將icon包括在symbol中，透過use元素使用该symbol
 * 因為是原生svg tag 瀏覽器支援度高！
 * 要注意目前無法直接透過 img(src="icon") 來獲取icon資料夾的svg哦，因為我有在 Webpack做些設定
 * icon資料夾的圖檔都是單色可切換顏色的圖片，若是普通的 svg icon 就把它放在img/svg資料夾內，以此來做區分
 *
 * 2021.9.24 更新: 如果說圖片是 svg 格式，但沒有顏色切換需求，其實也可以用這個元件，就只是改顏色不會影響到他而已
 */

export default defineComponent({
  emits: [],
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
    },
    iconHeight: {
      type: String
    }
  },
  data() {
    return {
      loadingSvg: `
        <circle cx="15" cy="15" r="15">
            <animate attributeName="r" from="15" to="15"
                    begin="0s" dur="0.8s"
                    values="15;9;15" calcMode="linear"
                    repeatCount="indefinite" />
            <animate attributeName="fill-opacity" from="1" to="1"
                    begin="0s" dur="0.8s"
                    values="1;.5;1" calcMode="linear"
                    repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="15" r="9" fill-opacity="0.3">
            <animate attributeName="r" from="9" to="9"
                    begin="0s" dur="0.8s"
                    values="9;15;9" calcMode="linear"
                    repeatCount="indefinite" />
            <animate attributeName="fill-opacity" from="0.5" to="0.5"
                    begin="0s" dur="0.8s"
                    values=".5;1;.5" calcMode="linear"
                    repeatCount="indefinite" />
        </circle>
        <circle cx="105" cy="15" r="15">
            <animate attributeName="r" from="15" to="15"
                    begin="0s" dur="0.8s"
                    values="15;9;15" calcMode="linear"
                    repeatCount="indefinite" />
            <animate attributeName="fill-opacity" from="1" to="1"
                    begin="0s" dur="0.8s"
                    values="1;.5;1" calcMode="linear"
                    repeatCount="indefinite" />
        </circle>
      `
    }
  },
  methods: {
    iconStyles() {
      return {
        width: this.iconWidth,
        height: this.iconHeight ?? this.iconWidth
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.svg-icon {
  width: 100%;
  transition: background-color 0.2s, color 0.2s;
  fill: currentColor;
  &:focus {
    outline: none;
  }
}
</style>
