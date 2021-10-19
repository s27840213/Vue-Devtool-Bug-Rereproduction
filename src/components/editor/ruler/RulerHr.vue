<template lang="pug">
div(class="ruler-hr")
  div(class="ruler-hr__body"
    :style="rulerBodyStyles")
</template>

<script lang="ts">
import { IPage } from '@/interfaces/page'
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  data() {
    return {
      RULER_SIZE: 20
    }
  },
  computed: {
    ...mapGetters({
      getPage: 'getPage',
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currActivePageIndex: 'getCurrActivePageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      getLayer: 'getLayer',
      pageSize: 'getPageSize',
      pageScaleRatio: 'getPageScaleRatio'
    }),
    currFocusPage(): IPage {
      const targetIndex = this.currActivePageIndex > 0 ? this.currActivePageIndex : this.lastSelectedPageIndex
      return this.getPage(targetIndex)
    },
    rulerBodyStyles(): { [index: string]: number | string } {
      console.log(this.currFocusPage)
      return {
        width: `${this.currFocusPage.width * (this.pageScaleRatio / 100)}px`,
        height: `${this.RULER_SIZE}px`,
        backgroundColor: 'red'
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.ruler-hr {
  display: flex;
  position: sticky;
  grid-area: hr-rulers;
  top: 0px;
  left: 0px;
  background-color: setColor(gray-3);
  overflow: hidden;
}
</style>
