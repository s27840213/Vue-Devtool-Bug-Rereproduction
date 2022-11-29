<template lang="pug">
div(class="snap-area"
  :style="wrapperStyles()")
  div(v-for="line in closestSnaplines.v"
    class="snap-area__line snap-area__line--vr"
    :style="snapLineStyles('v', line)")
  div(v-for="line in closestSnaplines.h"
    class="snap-area__line snap-area__line--hr"
    :style="snapLineStyles('h', line)")
  template(v-if="isShowGuideline && !isDetailPage")
    div(v-for="(line,index) in guidelines.v"
      class="snap-area__line snap-area__line--vr"
      :style="snapLineStyles('v', line,true)"
      @mouseover="lockGuideline ? null : showGuideline(line,'v',index)")
    div(v-for="(line,index) in guidelines.h"
      class="snap-area__line snap-area__line--hr"
      :style="snapLineStyles('h', line,true)"
      @mouseover="lockGuideline ? null : showGuideline(line,'h',index)")
</template>

<script lang="ts">

import { IPage } from '@/interfaces/page'
import { ISnapline } from '@/interfaces/snap'
import pageUtils from '@/utils/pageUtils'
import rulerUtils from '@/utils/rulerUtils'
import SnapUtils from '@/utils/snapUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<IPage>,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    pageScaleRatio: {
      type: Number
    },
    snapUtils: {
      type: SnapUtils,
      required: true
    }
  },
  data() {
    return {
      closestSnaplines: {
        v: [] as Array<number>,
        h: [] as Array<number>
      }
    }
  },
  mounted() {
    this.snapUtils.on(`getClosestSnaplines-${this.snapUtils.id}`, this.getClosestSnaplines)
    this.snapUtils.on('clearSnapLines', this.clearSnap)
  },
  beforeUnmount() {
    this.snapUtils.off(`getClosestSnaplines-${this.snapUtils.id}`, this.getClosestSnaplines)
    this.snapUtils.off('clearSnapLines', this.clearSnap)
  },
  computed: {
    ...mapState(['isMoving']),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      groupType: 'getGroupType',
      lockGuideline: 'getLockGuideline'
    }),
    isShowGuideline(): boolean {
      return rulerUtils.showGuideline
    },
    isDetailPage(): boolean {
      return this.groupType === 1
    },
    guidelines(): { [index: string]: Array<number> } {
      return (this.config as IPage).guidelines
    }
  },
  watch: {
    guidelines: {
      handler() {
        this.getClosestSnaplines()
      },
      deep: true
    }
  },
  methods: {
    wrapperStyles() {
      return {
        width: `${this.config.width * (this.scaleRatio / 100)}px`,
        height: `${this.config.height * (this.scaleRatio / 100)}px`,
        transformStyle: pageUtils._3dEnabledPageIndex === this.pageIndex ? 'preserve-3d' : 'initial'
      }
    },
    snapLineStyles(dir: string, pos: number, isGuideline?: string) {
      pos = pos * (this.scaleRatio / 100)
      return dir === 'v' ? {
        height: '100%',
        width: '1px',
        transform: `translate(${pos}px,0)`,
        'pointer-events': isGuideline && !this.isMoving ? 'auto' : 'none'
      }
        : {
          width: '100%',
          height: '1px',
          transform: `translate(0,${pos}px)`,
          'pointer-events': isGuideline && !this.isMoving ? 'auto' : 'none'
        }
    },
    getClosestSnaplines() {
      this.closestSnaplines.v = [...this.snapUtils.closestSnaplines.v.map((snapline: ISnapline) => snapline.pos)]
      this.closestSnaplines.h = [...this.snapUtils.closestSnaplines.h.map((snapline: ISnapline) => snapline.pos)]
    },
    clearSnap(): void {
      this.snapUtils.clear()
      this.closestSnaplines.v = []
      this.closestSnaplines.h = []
    },
    showGuideline(pos: number, type: string, index: number) {
      if (!rulerUtils.isDragging) {
        rulerUtils.deleteGuideline(
          index,
          type,
          this.pageIndex)
        rulerUtils.event.emit('showGuideline', pos, rulerUtils.mapSnaplineToGuidelineArea(pos, type, this.pageIndex), type, this.pageIndex)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.snap-area {
  @include size(100%, 100%);
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  &__line {
    position: absolute;
    top: 0;
    left: 0;
    background-color: setColor("blue-1");
    &::before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      width: 5px;
      height: 100%;
    }
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 5px;
      height: 100%;
    }
  }
}
</style>
