<template lang="pug">
div(class="all-pages")
    page-preview-page-wrapper(v-for="(page, idx) in pages"
      :key="page.id"
      class="border-box"
      :index="idx"
      type="full"
      :config="page"
      :showMoreBtn="false"
      :lazyLoadTarget="'.mobile-editor__content'"
      :itemSize="itemSize")
    div(class="all-pages--last pointer border-box"
      :style="btnStyle"
      @click="addPage()")
      div
        svg-icon(class="pb-5"
          :iconColor="'gray-2'"
          :iconName="'plus-origin'"
          :iconWidth="'25px'")
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import PagePreviewPlus from '@/components/editor/pagePreview/PagePreviewPlus.vue'
import pageUtils from '@/utils/pageUtils'
import { floor } from 'lodash'
import stepsUtils from '@/utils/stepsUtils'
import { IPage } from '@/interfaces/page'
import editorUtils from '@/utils/editorUtils'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import PagePreviewPageWrapper from '@/components/editor/pagePreview/PagePreviewPageWrapper.vue'
import { globalQueue } from '@/utils/queueUtils'

export default defineComponent({
  emits: [],
  data() {
    return {
      screenWidth: 0,
      itemSize: 0
    }
  },
  components: {
    PagePreviewPageWrapper,
    ObserverSentinel,
    PagePreviewPlus
  },
  computed: {
    ...mapGetters({
      getPages: 'getPages',
      getPagesPerRow: 'page/getPagesPerRow',
      allPageMode: 'mobileEditor/getMobileAllPageMode'
    }),
    pages(): IPage[] {
      const pages = this.getPages
      pageUtils.setAutoResizeNeededForPages(pages, false)
      return pages
    },
    btnStyle(): { [index: string]: string } {
      return {
        width: `${this.itemSize}px`,
        height: `${this.itemSize}px`
      }
    }
  },
  mounted() {
    this.screenWidth = document.body.clientWidth - 130
    // 40 -> column gap, 64 -> padding
    this.itemSize = (document.body.clientWidth - 32 - 64) / 2 - 10
    this._setPagesPerRow(floor(this.screenWidth / 180))
    window.addEventListener('resize', () => {
      this.screenWidth = document.body.clientWidth - 130
      this._setPagesPerRow(floor(this.screenWidth / 180))
    })

    globalQueue.batchNum = 10
  },
  methods: {
    ...mapMutations({
      _addPage: 'ADD_page',
      _setPagesPerRow: 'page/SET_PagesPerRow',
      _setCurrActivePageIndex: 'SET_currActivePageIndex'
    }),
    addPage() {
      const { width, height } = pageUtils.getPageSize(pageUtils.pageNum - 1)
      pageUtils.addPage(pageUtils.newPage({ width, height }))

      this._setCurrActivePageIndex(pageUtils.pageNum - 1)
      editorUtils.setCurrCardIndex(pageUtils.pageNum - 1)
      stepsUtils.record()
    }
  }
})
</script>
<style lang="scss" scoped>
// #recycle {
//   // For overwrite vue-recycle setting
//   overflow-y: overlay;
// }

.all-pages {
  display: grid;
  justify-items: center;
  align-items: center;
  width: 100%;
  max-height: 100%;
  overflow: scroll;
  grid-template-rows: auto;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-row-gap: 40px;
  grid-column-gap: 32px;
  padding: 32px;
  box-sizing: border-box;
  @include no-scrollbar;
  // &__row {
  //   width: 100%;
  //   display: grid;
  //   grid-template-rows: 1fr;
  //   grid-template-columns: 1fr 1fr;
  //   grid-row-gap: 40px;
  //   padding: 32px;
  //   box-sizing: border-box;
  //   grid-column-gap: 40px;
  //   align-items: center;
  //   justify-content: center;
  // }
  &--last {
    // aspect-ratio: 1/1;
    @include size(100%);
    position: relative;
    background: setColor(gray-4);
    border-radius: 5px;
    transition: 0.25s ease-in-out;
    box-sizing: border-box;
    > div {
      @include size(100%);
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: 0px;
      left: 0px;
    }
  }
}
</style>
