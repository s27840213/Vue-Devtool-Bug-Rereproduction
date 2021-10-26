<template lang="pug">
  div(class="panel-page-plus"
  @mouseover="pageMoveTo($event, 'mouse')"
  @mouseout="pageMoveBack($event)"
  @dragover="pageMoveTo($event, 'drag')"
  @dragleave="pageMoveBack($event)"
  @drop="handlePageDrop()")
    div(v-if="actionType === 'mouse'"
      class="panel-page-plus-wrapper pointer"
      @click="addPage(index)")
        svg-icon(class="pb-5"
            :iconColor="'white'"
            :iconName="'plus-origin'"
            :iconWidth="'18px'")
        span(class="text-white") 新增頁面
    div(v-if="actionType === 'drag'")
      div(class="panel-page-plus-drag")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import pageUtils from '@/utils/pageUtils'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'

export default Vue.extend({
  props: {
    index: Number,
    last: Boolean
  },
  data() {
    return {
      actionType: ''
    }
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      getPage: 'getPage',
      getPagesPerRow: 'page/getPagesPerRow'
    })
  },
  methods: {
    ...mapMutations({
      _addPageToPos: 'ADD_pageToPos',
      _deletePage: 'DELETE_page',
      _setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      _setCurrActivePageIndex: 'SET_currActivePageIndex'
    }),
    pageMoveTo($event: any, type: string) {
      const target = $event.currentTarget as HTMLElement
      const prev = target.previousElementSibling as HTMLElement
      if (prev) {
        prev.style.transform = 'translate(0, -20px)'
      }
      const next = target.nextElementSibling as HTMLElement
      if (next) {
        next.style.transform = 'translate(0, 20px)'
      }

      target.style.opacity = '1'
      this.actionType = type
    },
    pageMoveBack($event: any) {
      const target = $event.currentTarget as HTMLElement
      const prev = target.previousElementSibling as HTMLElement
      if (prev) {
        prev.style.transform = ''
      }
      const next = target.nextElementSibling as HTMLElement
      if (next) {
        next.style.transform = ''
      }

      target.style.opacity = '0'
    },
    handlePageDrop() {
      // move selected to index: copy and delete origin one
      const indexFrom = this.lastSelectedPageIndex
      const indexTo = this.index
      if (indexFrom === indexTo || indexFrom + 1 === indexTo) {
        return
      }
      const moveFront = indexFrom < indexTo
      const newPos = moveFront ? indexTo - 1 : indexTo
      const page = GeneralUtils.deepCopy(this.getPage(indexFrom))
      page.name += ' (copy)'
      page.designId = ''
      this._deletePage(indexFrom)
      this._addPageToPos({
        newPage: page,
        pos: newPos
      })
      GroupUtils.deselect()
      this._setLastSelectedPageIndex(indexTo)
      this._setCurrActivePageIndex(indexTo)
    },
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
.panel-page-plus {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 150px;
    height: 30px;
    transition: 0.1s;

    &-wrapper {
      position: absolute;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      width: 80px;
      height: 50px;
      font-size: 10px;
      background: setColor(nav);
    }

    &-last {
      opacity: 0;
    }

    &-drag {
      width: 160px;
      border-top: 5px solid setColor(blue-1);
    }
}
</style>
