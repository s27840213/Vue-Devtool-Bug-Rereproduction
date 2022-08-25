<template lang="pug">
div(class="all-pages")
    page-preview-page-wrapper(v-for="(page, idx) in pages"
      :key="page.id"
      class="m-10 border-box"
      :index="idx" type="full"
      :config="page"
      :showMoreBtn="false")
    div(class="all-pages--last pointer border-box"
      @click="addPage()")
      div
        svg-icon(class="pb-5"
          :iconColor="'gray-2'"
          :iconName="'plus-origin'"
          :iconWidth="'25px'")

//- recycle-scroller(class="all-pages" id="recycle" :items="pagesRows" :itemSize="itemSize")
//-     template(v-slot="{ item, index:rowIndex }")
//-       div(class="all-pages__row")
//-         page-preview-page-wrapper(v-for="(page, index) in item.pages"
//-           :key="page.id"
//-           class="m-10 border-box"
//-           :index="rowIndex*2 + index" type="full"
//-           :config="page"
//-           :showMoreBtn="false")
//-         div(v-if="oddNumGroup && rowIndex === pagesRows.length -1" class="all-pages--last pointer border-box"
//-           @click="addPage()")
//-           div
//-             svg-icon(class="pb-5"
//-               :iconColor="'gray-2'"
//-               :iconName="'plus-origin'"
//-               :iconWidth="'25px'")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import PagePreviewPlus from '@/components/editor/pagePreview/PagePreviewPlus.vue'
import pageUtils from '@/utils/pageUtils'
import { floor } from 'lodash'
import stepsUtils from '@/utils/stepsUtils'
import { IPage } from '@/interfaces/page'
import editorUtils from '@/utils/editorUtils'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import PagePreviewPageWrapper from '@/components/editor/pagePreview/PagePreviewPageWrapper.vue'
import generalUtils from '@/utils/generalUtils'

export default Vue.extend({
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
    pagesRows(): Array<any> {
      const pages = this.getPages
      pageUtils.setAutoResizeNeededForPages(pages, false)
      return generalUtils.createGroups(pages, 2).map((pageRow, idx) => {
        return {
          id: `row_${idx}`,
          pages: pageRow
        }
      })
    },
    pages(): IPage[] {
      const pages = this.getPages
      pageUtils.setAutoResizeNeededForPages(pages, false)
      return pages
    },
    oddNumGroup(): boolean {
      return pageUtils.getPages.length % 2 !== 0
    }
  },
  mounted() {
    this.screenWidth = document.body.clientWidth - 130
    // 40 -> column gap, 64 -> padding
    this.itemSize = (document.body.clientWidth - 40 - 64) / 2 + 30
    this._setPagesPerRow(floor(this.screenWidth / 180))
    window.addEventListener('resize', () => {
      this.screenWidth = document.body.clientWidth - 130
      this._setPagesPerRow(floor(this.screenWidth / 180))
    })
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
  justify-content: center;
  align-items: center;
  width: 100%;
  max-height: 100%;
  overflow: scroll;
  grid-template-rows: auto;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-row-gap: 40px;
  grid-column-gap: 40px;
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
    position: relative;
    padding-bottom: calc(100% - 20px);
    background: setColor(gray-4);
    border-radius: 5px;
    transition: 0.25s ease-in-out;
    margin: 10px;
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
