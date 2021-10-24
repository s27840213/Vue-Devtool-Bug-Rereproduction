<template lang="pug">
  div(class="panel-page")
    btn(:hasIcon="true"
        :iconName="'new-page'"
        :iconWidth="'15px'"
        :type="'gray-sm'"
        class="rounded m-25"
        style="padding: 5px 30px;"
        @click.native="addPage(focusPageIndex+1)") 新 增 頁 面
    div(class="panel-page-items pb-20 px-25")
      template(v-for="(page, idx) in getPages")
        page-preview-page(:index="idx" :pagename="page.name" type="panel")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState, mapGetters, mapMutations } from 'vuex'
import PagePreviewPage from '@/components/editor/pagePreview/pagePreviewPage.vue'
import pageUtils from '@/utils/pageUtils'

export default Vue.extend({
  components: {
    PagePreviewPage
  },
  computed: {
    ...mapState('page', [
      'focusPageIndex'
    ]),
    ...mapGetters({
      getPages: 'getPages'
    })
  },
  methods: {
    ...mapMutations({
      _addPageToPos: 'ADD_pageToPos',
      _setFocusPage: 'page/SET_focusPage'
    }),
    addPage(position: number) {
      this._addPageToPos({
        newPage: pageUtils.newPage({}),
        pos: position
      })
      this._setFocusPage(position)
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
    display: grid;
    row-gap: 20px;
    box-sizing: border-box;
    overflow-y: scroll;
  }
}

</style>
