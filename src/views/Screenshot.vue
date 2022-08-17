<template lang="pug">
  div(class="screenshot")
    nu-layer(v-if="config !== undefined"
              ref="target"
              :config="config"
              :pageIndex="0"
              :layerIndex="0"
              @load="onload")
</template>

<script lang="ts">
import layerFactary from '@/utils/layerFactary'
import vivistickerUtils from '@/utils/vivistickerUtils'
import Vue from 'vue'

export default Vue.extend({
  name: 'ScreenShot',
  data() {
    return {
      config: undefined as any
    }
  },
  async mounted() {
    const urlParams = new URLSearchParams(window.location.search)
    const type = urlParams.get('type')
    const id = urlParams.get('id')
    const ver = urlParams.get('ver')
    if (type === 'svg') {
      const json = await (await fetch(`https://template.vivipic.com/${type}/${id}/config.json?ver=${ver}`)).json()
      const vSize = json.vSize as number[]
      const pageAspectRatio = window.innerWidth / window.innerHeight
      const svgAspectRatio = vSize[0] / vSize[1]
      const svgWidth = svgAspectRatio > pageAspectRatio ? window.innerWidth : window.innerHeight * svgAspectRatio
      const svgHeight = svgAspectRatio > pageAspectRatio ? window.innerWidth / svgAspectRatio : window.innerHeight
      json.ratio = 1
      this.config = layerFactary.newShape({
        ...json,
        styles: {
          width: svgWidth,
          height: svgHeight,
          initWidth: vSize[0],
          initHeight: vSize[1],
          scale: svgWidth / vSize[0],
          color: json.color,
          vSize: json.vSize
        }
      })
    }
  },
  methods: {
    onload() {
      console.log('loaded')
      const target = (this.$refs.target as Vue).$el
      const { width, height } = target.getBoundingClientRect()
      vivistickerUtils.sendDoneLoading(width, height)
    }
  }
})
</script>

<style lang="scss" scoped>
.screenshot {
  @include size(100%, 100%);
}
</style>
