<template lang="pug">
  div(class="panel-page")
    btn(:hasIcon="true"
        :iconName="'new-page'"
        :iconWidth="'15px'"
        :type="'gray-sm'"
        class="rounded mt-30 mb-20 mx-25"
        style="padding: 5px 30px;"
        @click.native="addPage(lastSelectedPageIndex+1)") 新 增 頁 面
    div(class="panel-page-items pb-20 px-25")
      template(v-for="(page, idx) in getPages")
        panel-page-plus(:index="idx" last=false
          :class="{'pt-10': idx === 0}")
        page-preview-page-wrapper(:index="idx" :pagename="page.name" type="panel" :config="page")
        panel-page-plus(v-if="idx+1 === getPageCount"
                        :index="idx+1" last=false)
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import PagePreviewPageWrapper from '@/components/editor/pagePreview/PagePreviewPageWrapper.vue'
import PanelPagePlus from '@/components/editor/pagePreview/PanelPagePlus.vue'
import pageUtils from '@/utils/pageUtils'

export default Vue.extend({
  components: {
    PagePreviewPageWrapper,
    PanelPagePlus
  },
  computed: {
    ...mapGetters({
      getPages: 'getPages',
      lastSelectedPageIndex: 'getLastSelectedPageIndex'
    }),
    getPageCount(): number {
      return this.getPages.length
    }
  },
  methods: {
    ...mapMutations({
      _addPageToPos: 'ADD_pageToPos',
      _setLastSelectedPageIndex: 'SET_lastSelectedPageIndex'
    }),
    addPage(position: number) {
      this._addPageToPos({
        newPage: pageUtils.newPage({}),
        pos: position
      })
      this._setLastSelectedPageIndex(position)
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
    width: 100%;
    box-sizing: border-box;
    overflow-y: scroll;
    overflow-x: hidden;
    scrollbar-width: thin;
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
      background-color: unset;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 5px;
      visibility: hidden;
      background-color: #d9dbe1;
      border: 3px solid #2c2f43;
    }
    &:hover {
      &::-webkit-scrollbar-thumb {
        visibility: visible;
      }
    }
  }
}
</style>
