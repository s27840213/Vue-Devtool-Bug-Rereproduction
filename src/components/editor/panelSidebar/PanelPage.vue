<template lang="pug">
  div(class="panel-page")
    btn(:hasIcon="true"
        :iconName="'new-page'"
        :iconWidth="'15px'"
        :type="'gray-sm'"
        class="rounded my-20 mx-25"
        style="padding: 5px 0;"
        @click.native="addPage(middlemostPageIndex+1)") {{$t('NN0139')}}
    div(class="panel-page-items")
      template(v-for="(page, idx) in getPages")
        div(class="panel-page__plus")
          panel-page-plus(:index="idx" last=false
            :class="{'pt-10': idx === 0}")
        page-preview-page-wrapper(:index="idx" :pagename="page.name" type="panel" :config="wrappedPage(page)" :lazyLoadTarget="'.panel-page'")
        div(v-if="idx+1 === getPageCount"
          class="panel-page__plus")
          panel-page-plus(:index="idx+1" last=false)
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import PagePreviewPageWrapper from '@/components/editor/pagePreview/PagePreviewPageWrapper.vue'
import PanelPagePlus from '@/components/editor/pagePreview/PanelPagePlus.vue'
import pageUtils from '@/utils/pageUtils'
import { IPage } from '@/interfaces/page'

export default Vue.extend({
  components: {
    PagePreviewPageWrapper,
    PanelPagePlus
  },
  computed: {
    ...mapGetters({
      getPages: 'getPages',
      middlemostPageIndex: 'getMiddlemostPageIndex'
    }),
    getPageCount(): number {
      return this.getPages.length
    }
  },
  methods: {
    ...mapMutations({
      _addPageToPos: 'ADD_pageToPos',
      _setmiddlemostPageIndex: 'SET_middlemostPageIndex'
    }),
    addPage(position: number) {
      this._addPageToPos({
        newPage: pageUtils.newPage({}),
        pos: position
      })
      this._setmiddlemostPageIndex(position)
    },
    wrappedPage(page: IPage) {
      return { ...page, isAutoResizeNeeded: false }
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

  > button:hover {
    background: setColor(gray-4);
  }

  &-items {
    @include hide-scrollbar($padding-right: 20px);
    margin-right: -10px;
    box-sizing: border-box;
    padding: 0 20px 20px 20px;
  }
  &__plus {
    z-index: 2;
    width: 140px;
    height: 30px;
  }
}
</style>
