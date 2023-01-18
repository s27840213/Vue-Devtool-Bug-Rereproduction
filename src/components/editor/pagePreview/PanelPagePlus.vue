<template lang="pug">
  div(class="panel-page-plus"
    :style="styles()"
    @mouseover="pageMoveTo($event, 'mouse')"
    @mouseout="pageMoveBack($event)"
    @dragover="pageMoveTo($event, 'drag')"
    @dragleave="pageMoveBack($event)"
    @drop="handlePageDrop($event)")
    div(v-if="actionType === 'mouse'"
      class="panel-page-plus-wrapper pointer"
      @click="addPage(index)")
        svg-icon(class="py-5"
            :iconColor="'white'"
            :iconName="'plus-origin'"
            :iconWidth="'15px'")
        span(class="text-white") {{$t('NN0139')}}
    div(v-if="actionType === 'drag'")
      div(class="panel-page-plus-drag")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import pageUtils from '@/utils/pageUtils'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'
import StepsUtils from '@/utils/stepsUtils'

export default Vue.extend({
  props: {
    index: Number,
    last: Boolean
  },
  data() {
    return {
      actionType: '',
      isDragOver: false
    }
  },
  computed: {
    ...mapGetters({
      middlemostPageIndex: 'getMiddlemostPageIndex',
      getPage: 'getPage',
      getPagesPerRow: 'page/getPagesPerRow',
      isDragged: 'page/getIsDragged'
    })
  },
  methods: {
    ...mapMutations({
      _setmiddlemostPageIndex: 'SET_middlemostPageIndex',
      _setCurrActivePageIndex: 'SET_currActivePageIndex'
    }),
    styles() {
      if (this.isDragged) {
        return {
          'z-index': '2',
          height: '150px',
          transform: 'translateY(-60px)'
        }
      } else {
        return {
          'z-index': 'unset',
          height: '30px',
          transform: ''
        }
      }
    },
    pageMoveTo($event: any, type: string) {
      if (type === 'drag') {
        if (!this.isDragOver) {
          this.isDragOver = true
        } else {
          return
        }
      }

      // prevent from mouse hover event when dragging
      if (type === 'mouse' && this.isDragged) {
        return
      }
      const target = $event.currentTarget.parentElement as HTMLElement
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
      this.isDragOver = false
      const target = $event.currentTarget.parentElement as HTMLElement
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
      const indexFrom = pageUtils.currFocusPageIndex
      const indexTo = this.index
      if (indexFrom === indexTo || indexFrom + 1 === indexTo) {
        return
      }
      const moveFront = indexFrom < indexTo
      const newPos = moveFront ? indexTo - 1 : indexTo
      const page = GeneralUtils.deepCopy(this.getPage(indexFrom))
      const refPage = pageUtils.getPage(newPos)
      pageUtils.deletePage(indexFrom)
      pageUtils.addPageToPos(pageUtils.isDetailPage ? { ...page, bleeds: refPage.bleeds, physicalBleeds: refPage.physicalBleeds } : page, newPos)
      GroupUtils.deselect()
      this._setmiddlemostPageIndex(newPos)
      this._setCurrActivePageIndex(newPos)
      StepsUtils.record()
    },
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
          isEnableBleed: refPage.isEnableBleed,
          bleeds: refPage.bleeds,
          physicalBleeds: refPage.physicalBleeds,
          unit: refPage.unit
        } : {}),
        position
      )
      this._setmiddlemostPageIndex(position)
      StepsUtils.record()
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
  width: 100%;
  height: 30px;
  transition: 0.1s;

  &-wrapper {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 50px;
    height: 50px;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.15);

    > span {
      white-space: nowrap;
      transform: scale(0.7);
    }
  }

  &-last {
    opacity: 0;
  }

  &-drag {
    width: 160px;
    border-top: 3px solid setColor(blue-1);
  }
}
</style>
