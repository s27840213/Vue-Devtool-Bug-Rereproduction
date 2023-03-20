<template lang="pug">
div(class="page-preview")
  template(v-for="(page, idx) in getPages" :key="page.id")
    page-preview-plus(:index="idx" :last="false")
    page-preview-page-wrapper(:index="idx"
      type="full"
      :config="wrappedPage(page)"
      :lazyLoadTarget="'.page-preview'")
    page-preview-plus(v-if="(idx+1) % getPagesPerRow === 0"
      :index="idx+1" :last="false")
  page-preview-plus(:index="getPages.length" :last="true")
  div(class="page-preview-page-last pointer"
    @click="addPage()")
    svg-icon(class="pb-5"
      :iconColor="'gray-2'"
      :iconName="'plus-origin'"
      :iconWidth="'25px'")
</template>

<script lang="ts">
import PagePreviewPageWrapper from '@/components/editor/pagePreview/PagePreviewPageWrapper.vue'
import PagePreviewPlus from '@/components/editor/pagePreview/PagePreviewPlus.vue'
import { IPage } from '@/interfaces/page'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import { floor } from 'lodash'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  emits: [],
  data() {
    return {
      screenWidth: 0,
      renderCount: 0
    }
  },
  components: {
    PagePreviewPageWrapper,
    PagePreviewPlus
  },
  computed: {
    ...mapGetters({
      getPages: 'getPages',
      getPagesPerRow: 'page/getPagesPerRow'
    })
  },
  mounted() {
    this.screenWidth = document.body.clientWidth - 130
    this._setPagesPerRow(floor(this.screenWidth / 180))
    window.addEventListener('resize', () => {
      this.screenWidth = document.body.clientWidth - 130
      this._setPagesPerRow(floor(this.screenWidth / 180))
    })
  },
  methods: {
    ...mapMutations({
      _setPagesPerRow: 'page/SET_PagesPerRow'
    }),
    addPage() {
      const lastPage = pageUtils.pageNum > 0 ? pageUtils.getPages[pageUtils.pageNum - 1] : undefined
      pageUtils.addPageToPos(pageUtils.newPage(lastPage ? {
        width: lastPage.width,
        height: lastPage.height,
        physicalWidth: lastPage.physicalWidth,
        physicalHeight: lastPage.physicalHeight,
        isEnableBleed: lastPage.isEnableBleed,
        bleeds: lastPage.bleeds,
        physicalBleeds: lastPage.physicalBleeds,
        unit: lastPage.unit
      } : {}), pageUtils.pageNum)
      stepsUtils.record()
    },
    wrappedPage(page: IPage) {
      return { ...page, isAutoResizeNeeded: false }
    }
  }
})
</script>
<style lang="scss" scoped>
.page-preview {
  display: grid;
  justify-content: center;
  align-items: center;
  width: calc(100% - 100px);
  grid-template-columns: repeat(auto-fill, 30px 150px) 30px;
  grid-row-gap: 60px;
  padding-top: 75px;
  margin-bottom: 50px;

  &-page-last {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 140px;
    background: setColor(gray-4);
    border-radius: 5px;
    border: 5px solid #ffffff00;
    transition: 0.25s ease-in-out;

    &:hover {
      background: setColor(gray-3);
    }
  }
}
</style>
