<template lang="pug">
  div(v-if="imgControlPageIdx !== -1")
    div(class="dim-background"
      :style="styles")
    div
      nu-layer(:style="'opacity: 0.45'"
        :layerIndex="layerIndex"
        :pageIndex="pageIndex"
        :primaryLayer="primaryLayer"
        :imgControl="true"
        :forRender="true"
        :contentScaleRatio="contentScaleRatio"
        :config="image")
    div
      nu-layer(:layerIndex="layerIndex"
        :pageIndex="pageIndex"
        :primaryLayer="primaryLayer"
        :forRender="true"
        :contentScaleRatio="contentScaleRatio"
        :config="image")
    div(class="page-control" :style="styles")
      nu-img-controller(:layerIndex="layerIndex"
                        :pageIndex="pageIndex"
                        :contentScaleRatio="contentScaleRatio"
                        :primaryLayer="primaryLayer"
                        :config="image")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapState } from 'vuex'
import NuBackgroundController from '@/components/editor/global/NuBackgroundController.vue'
import { IPage } from '@/interfaces/page'

export default Vue.extend({
  components: {
    NuBackgroundController
  },
  data() {
    return {}
  },
  props: {
    config: Object,
    pageScaleRatio: Number,
    isAnyBackgroundImageControl: Boolean,
    contentScaleRatio: {
      default: 1,
      type: Number
    }
  },
  computed: {
    ...mapState('imgControl', ['image', 'layerInfo', 'primaryLayer']),
    ...mapGetters({
      imgControlPageIdx: 'imgControl/imgControlPageIdx'
    }),
    styles() {
      const config = this.config as IPage
      return {
        width: `${config.width * this.contentScaleRatio}px`,
        height: `${config.height * this.contentScaleRatio}px`
        // overflow: this.selectedLayerCount > 0 ? 'initial' : 'hidden'
      }
    },
    pageIndex(): number {
      return this.layerInfo.pageIndex
    },
    layerIndex(): number {
      return this.layerInfo.layerIndex
    }
  }
})
</script>

<style lang="scss" scoped>
.page-highlighter {
  position: absolute;
  top: 0px;
  left: 0px;
  border: 2px solid setColor(blue-2);
  box-sizing: border-box;
  z-index: setZindex("page-highlighter");
  pointer-events: none;
}
.page-control {
  position: absolute;
  top: 0px;
  left: 0px;
  transform-style: preserve-3d;
  // this css property will prevent the page-control div from blocking all the event of page-content
  pointer-events: none;
  :focus {
    outline: none;
  }
}

.layer-img {
  background: red;
  opacity: 0.5;
  pointer-events: none;
}

.dim-background {
  position: absolute;
  top: 0px;
  left: 0px;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
  transform-style: preserve-3d;
}
</style>
