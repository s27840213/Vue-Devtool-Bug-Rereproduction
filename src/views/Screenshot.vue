<template lang="pug">
  div(class="screenshot")
    nu-shape(v-if="config !== undefined"
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
    const json = await (await fetch(`https://template.vivipic.com/${type}/${id}/config.json?ver=${ver}`)).json()
    this.config = layerFactary.newShape({
      ...json,
      styles: {
        width: json.vSize[0],
        height: json.vSize[1],
        initWidth: json.vSize[0],
        initHeight: json.vSize[1],
        color: json.color,
        vSize: json.vSize
      }
    })
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
