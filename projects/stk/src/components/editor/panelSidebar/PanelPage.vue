<template lang="pug">
div(class="panel-page")
  nubtn(class="mt-10" theme="icon_text"
      size="sm-full" icon="new-page"
      @click="addPage(currFocusPageIndex+1)") {{$t('NN0139')}}
  div(class="panel-page-items")
    template(v-for="(page, idx) in getPages" :key="idx")
      div(class="panel-page__plus")
        panel-page-plus(:index="idx" :last="false"
          :class="{'pt-10': idx === 0}")
      page-preview-page-wrapper(:index="idx" :pagename="page.name" type="panel" :config="page" :lazyLoadTarget="'.panel-page'")
      div(v-if="idx+1 === getPageCount"
        class="panel-page__plus")
        panel-page-plus(:index="idx+1" :last="false")
</template>

<script lang="ts">
import PagePreviewPageWrapper from '@/components/editor/pagePreview/PagePreviewPageWrapper.vue'
import PanelPagePlus from '@/components/editor/pagePreview/PanelPagePlus.vue'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    PagePreviewPageWrapper,
    PanelPagePlus
  },
  computed: {
    ...mapGetters({
      getPages: 'getPages',
      currFocusPageIndex: 'getCurrFocusPageIndex'
    }),
    getPageCount(): number {
      return this.getPages.length
    }
  },
  methods: {
    ...mapMutations({
      _addPageToPos: 'ADD_pageToPos'
    }),
    addPage(position: number) {
      const refPage = pageUtils.pageNum === 0 ? undefined // add new page if no pages
        : pageUtils.pageNum === 1 ? pageUtils.getPage(0) // apply size of the last page if there is only one
          : pageUtils.getPage(position + (position === 0 ? 1 : -1)) // apply size of the previous page, or next page if dosen't exist
      pageUtils.addPageToPos(
        pageUtils.newPage(refPage ? {
          width: refPage.width,
          height: refPage.height,
          physicalWidth: refPage.physicalWidth,
          physicalHeight: refPage.physicalHeight,
          backgroundColor: refPage.backgroundColor,
          isEnableBleed: refPage.isEnableBleed,
          bleeds: refPage.bleeds,
          physicalBleeds: refPage.physicalBleeds,
          unit: refPage.unit
        } : {}),
        position
      )
      stepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-page {
  @include size(100%, 100%);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-columns: 1fr;

  &-items {
    @include hover-scrollbar(dark);
    @include push-scrollbar10;
    padding: 0 15px 20px 15px;
  }
  &__plus {
    z-index: 2;
    width: 140px;
    height: 30px;
  }
}
</style>
