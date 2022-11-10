<template lang="pug">
div(class="page-preview")
    template(v-for="(page, idx) in getPages")
        page-preview-plus(:index="idx" :last="false"  :key="`${page.id}-top`")
        page-preview-page-wrapper(:index="idx"
          type="full"
          :config="wrappedPage(page)"
          :lazyLoadTarget="'.page-preview'"
          :key="page.id"
          @loaded="handleLoaded")
        page-preview-plus(v-if="(idx+1) % getPagesPerRow === 0"
          :index="idx+1" :last="false"  :key="`${page.id}-bottom`")
    page-preview-plus(:index="getPages.length" last=true)
    div(class="page-preview-page-last pointer"
      @click="addPage()")
      svg-icon(class="pb-5"
        :iconColor="'gray-2'"
        :iconName="'plus-origin'"
        :iconWidth="'25px'")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import PagePreviewPageWrapper from '@/components/editor/pagePreview/PagePreviewPageWrapper.vue'
import PagePreviewPlus from '@/components/editor/pagePreview/PagePreviewPlus.vue'
import pageUtils from '@/utils/pageUtils'
import { floor } from 'lodash'
import stepsUtils from '@/utils/stepsUtils'
import { IPage } from '@/interfaces/page'
import testUtils from '@/utils/testUtils'

export default Vue.extend({
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
    testUtils.start('previewTest')
    this.screenWidth = document.body.clientWidth - 130
    this._setPagesPerRow(floor(this.screenWidth / 180))
    window.addEventListener('resize', () => {
      this.screenWidth = document.body.clientWidth - 130
      this._setPagesPerRow(floor(this.screenWidth / 180))
    })
  },
  methods: {
    ...mapMutations({
      _addPage: 'ADD_page',
      _setPagesPerRow: 'page/SET_PagesPerRow'
    }),
    addPage() {
      this._addPage(pageUtils.newPage({}))
      stepsUtils.record()
    },
    wrappedPage(page: IPage) {
      return { ...page, isAutoResizeNeeded: false }
    },
    handleLoaded() {
      if (this.renderCount === 0) {
        testUtils.start('previewTest')
      }

      if (this.renderCount === this.getPages.length - 1) {
        testUtils.log('previewTest', 'Preview Test')
      }
      this.renderCount++
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
