<template lang="pug">
  div(v-if="last" class="page-preview-plus-last")
  div(v-else class="page-preview-plus"
  @mouseover="pageMoveTo($event, 'mouse')"
  @mouseout="pageMoveBack($event)"
  @dragover="pageMoveTo($event, 'drag')"
  @dragleave="pageMoveBack($event)"
  @drop="handlePageDrop($event)")
    div(v-if="actionType === 'mouse'"
      class="page-preview-plus-wrapper pointer"
      @click="addPage(index)")
        svg-icon(class="py-10"
            :iconColor="'blue-1'"
            :iconName="'plus-origin'"
            :iconWidth="'18px'")
        span 新增頁面
    div(v-if="actionType === 'drag'"
      class="page-preview-plus-drag")
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
        prev.style.transform = 'translate(-15px)'
      }
      const next = target.nextElementSibling as HTMLElement
      if (next) {
        next.style.transform = 'translate(15px)'
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
    handlePageDrop($event: any) {
      this.actionType = ''
      this.pageMoveBack($event)

      // move selected to index: copy and delete origin one
      const indexFrom = this.lastSelectedPageIndex
      const indexTo = this.index
      if (indexFrom === indexTo || indexFrom + 1 === indexTo) {
        return
      }
      const moveFront = indexFrom < indexTo
      const newPos = moveFront ? indexTo - 1 : indexTo
      const page = GeneralUtils.deepCopy(this.getPage(indexFrom))
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
.page-preview-plus {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 30px;
    transition: 0.25s ease-in-out;

    &-wrapper {
      position: absolute;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      width: 40px;
      height: 60px;
      font-size: 12px;
      background: setColor(gray-5);

      > span {
        white-space: nowrap;
        transform: scale(0.7);
      }
    }

    &-last {
      opacity: 0;
    }

    &-drag {
      height: 100%;
      border-right: 3px solid setColor(blue-1);
    }
}
</style>
