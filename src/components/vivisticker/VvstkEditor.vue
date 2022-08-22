<template lang="pug">
  div(class="vvstk-editor")
    page-content(:config="config" :pageIndex="pageIndex")
    //- div(class="page-control" :style="styles('control')")
    //-   template(v-for="(layer, index) in config.layers")
    //-     component(:is="layer.type === 'image' && layer.imgControl ? 'nu-img-controller' : 'nu-controller'"
    //-       data-identifier="controller"
    //-       :key="`controller-${(layer.id === undefined) ? index : layer.id}`"
    //-       :layerIndex="index"
    //-       :pageIndex="pageIndex"
    //-       :config="layer"
    //-       :snapUtils="snapUtils"
    //-       @setFocus="setFocus()"
    //-       @getClosestSnaplines="getClosestSnaplines"
    //-       @clearSnap="clearSnap")
    //- div(v-if="ImageUtils.isImgControl(pageIndex)"
    //-     class="dim-background"
    //-     :style="styles('control')")
    //-   template(v-if="getCurrLayer.type === 'group' || getCurrLayer.type === 'frame'")
    //-     nu-layer(style="opacity: 0.45"
    //-       :layerIndex="currSubSelectedInfo.index"
    //-       :pageIndex="pageIndex"
    //-       :imgControl="true"
    //-       :config="getCurrSubSelectedLayerShown")
    //-     nu-layer(:layerIndex="currSubSelectedInfo.index"
    //-       :pageIndex="pageIndex"
    //-       :config="getCurrSubSelectedLayerShown")
    //-     div(class="page-control" :style="Object.assign(styles('control'))")
    //-         nu-img-controller(:layerIndex="currSubSelectedInfo.index"
    //-                           :pageIndex="pageIndex"
    //-                           :primaryLayerIndex="currSelectedInfo.index"
    //-                           :primaryLayer="getCurrLayer"
    //-                           :forRender="true"
    //-                           :config="getCurrSubSelectedLayerShown")
    //-   template(v-else-if="getCurrLayer.type === 'image'")
    //-     nu-layer(:style="'opacity: 0.45'"
    //-       :layerIndex="currSelectedIndex"
    //-       :pageIndex="pageIndex"
    //-       :imgControl="true"
    //-       :config="Object.assign(getCurrLayer, { forRender: true })")
    //-     nu-layer(:layerIndex="currSelectedIndex"
    //-       :pageIndex="pageIndex"
    //-       :config="Object.assign(getCurrLayer, { forRender: true })")
    //-     div(class="page-control" :style="Object.assign(styles('control'))")
    //-         nu-img-controller(:layerIndex="currSelectedIndex"
    //-                           :pageIndex="pageIndex"
    //-                           :forRender="true"
    //-                           :config="getCurrLayer")
</template>

<script lang="ts">
import Vue from 'vue'
import PageContent from '@/components/editor/page/PageContent.vue'
import pageUtils from '@/utils/pageUtils'
import { IPage } from '@/interfaces/page'
import { mapGetters } from 'vuex'

export default Vue.extend({
  data() {
    return {
      pageIndex: 0
    }
  },
  computed: {
    ...mapGetters({
      pages: 'getPages'
    }),
    config(): IPage {
      return this.pages[this.pageIndex]
    }
  },
  components: {
    PageContent
  }
})
</script>

<style lang="scss" scoped>
.vvstk-editor {
  @include size(100%);
  background: setColor(nav-active);
}
</style>
