<template lang="pug">
  div(class="nu-page"
      :class="`nu-page-${pageIndex}`"
      ref="page"
      @keydown.delete.exact.stop.prevent.self="ShortcutUtils.del()"
      @keydown.ctrl.67.exact.stop.prevent.self="ShortcutUtils.copy()"
      @keydown.meta.67.exact.stop.prevent.self="ShortcutUtils.copy()"
      @keydown.ctrl.88.exact.stop.prevent.self="ShortcutUtils.cut()"
      @keydown.meta.88.exact.stop.prevent.self="ShortcutUtils.cut()"
      @keydown.ctrl.86.exact.stop.prevent.self="ShortcutUtils.paste()"
      @keydown.meta.86.exact.stop.prevent.self="ShortcutUtils.paste()"
      @keydown.ctrl.71.exact.stop.prevent.self="ShortcutUtils.group()"
      @keydown.meta.71.exact.stop.prevent.self="ShortcutUtils.group()"
      @keydown.ctrl.65.exact.stop.prevent.self="ShortcutUtils.selectAll()"
      @keydown.meta.65.exact.stop.prevent.self="ShortcutUtils.selectAll()"
      @keydown.ctrl.shift.71.exact.stop.prevent.self="ShortcutUtils.ungroup()"
      @keydown.meta.shift.71.exact.stop.prevent.self="ShortcutUtils.ungroup()"
      @keydown.ctrl.90.exact.stop.prevent.self="ShortcutUtils.undo()"
      @keydown.meta.90.exact.stop.prevent.self="ShortcutUtils.undo()"
      @keydown.ctrl.shift.90.exact.stop.prevent.self="ShortcutUtils.redo()"
      @keydown.meta.shift.90.exact.stop.prevent.self="ShortcutUtils.redo()"
      tabindex="0")
    div(class="page-title text-left text-gray-3 mb-5" :style="{'width': `${config.width * (scaleRatio/100)}px`,}")
      span {{config.name}}
    div(class='pages-wrapper'
        :style="wrapperStyles()")
      //- div(class="coordinate" ref="coordinate")
      //-   div(class="coordinate__val coordinate__width")
      //-     span {{coordinateWidth* (100/scaleRatio)}}px
      //-   div(class="coordinate__val coordinate__height")
      //-     span {{coordinateHeight*(100/scaleRatio)}}px
      div(class="scale-container" :style="`transform: scale(${scaleRatio/100})`")
        div(class="snap-area")
          div(v-for="line in closestSnaplines.v"
            class="snap-area__line snap-area__line--vr"
            :style="snapLineStyles('v', line.pos)")
          div(v-for="line in closestSnaplines.h"
            class="snap-area__line snap-area__line--hr"
            :style="snapLineStyles('h', line.pos)")
        div(class="page-content"
            :style="styles('content')"
            ref="page-content"
            @drop="onDrop"
            @dragover.prevent,
            @dragenter.prevent
            @click.right.stop="onRightClick"
            @click.left.self="pageClickHandler()"
            @mouseover="togglePageHighlighter(true)"
            @mouseout="togglePageHighlighter(false)")
          nu-layer(v-for="(layer,index) in config.layers"
            :key="`layer-${index}`"
            :class="!layer.locked ? `nu-layer--p${pageIndex}` : ''"
            :data-index="`${index}`"
            :data-pindex="`${pageIndex}`"
            :layerIndex="index"
            :pageIndex="pageIndex"
            :config="layer")
        div(v-if="pageIsHover"
          class="page-highlighter"
          :style="styles()")
        div(class="page-control" :style="styles('control')")
          template(v-for="(layer, index) in config.layers")
            component(:is="layer.type === 'image' && layer.imgControl ? 'nu-img-controller' : 'nu-controller'"
              data-identifier="controller"
              :key="`controller-${index}`"
              :layerIndex="index"
              :pageIndex="pageIndex"
              :config="layer"
              :snapUtils="snapUtils"
              @setFocus="setFocus()"
              @getClosestSnaplines="getClosestSnaplines"
              @clearSnap="clearSnap")
        div(v-if="(typeof getCurrLayer) !== 'undefined' && getCurrLayer.imgControl"
            class="dim-background"
            :style="styles('control')"
            ref="page-content")
          nu-layer(:layerIndex="currSelectedIndex"
            :pageIndex="pageIndex"
            :config="getCurrLayer")
          div(class="page-control dim-background" :style="Object.assign(styles('control'), { 'pointer-events': 'none' })")
              nu-img-controller(:layerIndex="currSelectedIndex"
                                :pageIndex="pageIndex"
                                :config="getCurrLayer"
                                 @click.left.self="pageClickHandler()")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations, mapGetters } from 'vuex'
import { IShape, IText, IImage, IGroup, ILayer } from '@/interfaces/layer'
import MouseUtils from '@/utils/mouseUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import GroupUtils from '@/utils/groupUtils'
import SnapUtils from '@/utils/snapUtils'
import ControlUtils from '@/utils/controlUtils'
import { ISnapline } from '@/interfaces/snap'

export default Vue.extend({
  data() {
    return {
      pageIsHover: false,
      ShortcutUtils,
      // for test used
      coordinate: null as unknown as HTMLElement,
      coordinateWidth: 0,
      coordinateHeight: 0,
      snapUtils: new SnapUtils(this.pageIndex),
      closestSnaplines: {
        v: [] as Array<ISnapline>,
        h: [] as Array<ISnapline>
      }
    }
  },
  props: {
    config: Object,
    pageIndex: Number,
    isSelecting: Boolean,
    pageScaleRatio: Number
  },
  mounted() {
    this.coordinate = this.$refs.coordinate as HTMLElement
    const pageContent = this.$refs['page-content'] as HTMLElement
    /**
     * Prevent the context menu from showing up when right click or Ctrl + left click on controller
     */
    pageContent.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault()
    }, false)
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      pages: 'getPages',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    }),
    getCurrLayer(): ILayer {
      return this.getLayer(this.pageIndex, this.currSelectedIndex)
    }
  },
  methods: {
    ...mapMutations({
      ADD_newLayers: 'ADD_newLayers',
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setIsPageDropdownsOpened: 'SET_isPageDropdownsOpened'
    }),
    styles(type: string) {
      return type === 'content' ? {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`,
        backgroundColor: this.config.backgroundColor,
        backgroundImage: `url(${this.config.backgroundImage.src})`,
        backgroundPosition: this.config.backgroundImage.posX === -1 ? 'center center'
          : `${this.config.backgroundImage.posX}% ${this.config.backgroundImage.posY}%`
      } : {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`
      }
    },
    wrapperStyles() {
      return {
        width: `${this.config.width * (this.scaleRatio / 100)}px`,
        height: `${this.config.height * (this.scaleRatio / 100)}px`
      }
    },
    snapLineStyles(dir: string, pos: number) {
      return dir === 'v' ? { height: `${this.config.height}px`, transform: `translate3d(${pos}px,0,3000px)` }
        : { width: `${this.config.width}px`, transform: `translate3d(0,${pos}px,3000px)` }
    },
    onDrop(e: DragEvent) {
      MouseUtils.onDrop(e, this.pageIndex)
    },
    addNewLayer(pageIndex: number, layer: IShape | IText | IImage | IGroup): void {
      this.ADD_newLayers({
        pageIndex: pageIndex,
        layers: [layer]
      })
    },
    togglePageHighlighter(isHover: boolean): void {
      this.pageIsHover = isHover
    },
    pageClickHandler(): void {
      this.setLastSelectedPageIndex(this.pageIndex)
      const sel = window.getSelection()
      if (sel) {
        sel.empty()
        sel.removeAllRanges()
      }
      for (let i = 0; i < this.pages[this.pageIndex].layers.length; i++) {
        if (this.getLayer(this.pageIndex, i).type === 'image') {
          ControlUtils.updateImgControl(this.pageIndex, i, false)
        }
      }
      GroupUtils.deselect()
    },
    setFocus(): void {
      this.$nextTick(() => {
        const currPage = this.$refs.page as HTMLElement
        currPage.focus()
      })
    },
    coordinateHandler(e: MouseEvent) {
      var rect = this.coordinate.getBoundingClientRect()
      this.coordinateWidth = e.clientX - rect.left
      this.coordinateHeight = e.clientY - rect.top
      this.coordinate.style.width = `${this.coordinateWidth}px`
      this.coordinate.style.height = `${this.coordinateHeight}px`
    },
    getClosestSnaplines() {
      this.closestSnaplines.v = [...this.snapUtils.closestSnaplines.v]
      this.closestSnaplines.h = [...this.snapUtils.closestSnaplines.h]
    },
    clearSnap(): void {
      this.snapUtils.clear()
      this.closestSnaplines.v = []
      this.closestSnaplines.h = []
    },
    onRightClick(event: MouseEvent) {
      this.setIsPageDropdownsOpened(true)
      this.$nextTick(() => {
        const el = document.querySelector('.dropdowns--page') as HTMLElement
        const mousePos = MouseUtils.getMouseAbsPoint(event)
        el.style.transform = `translate3d(${mousePos.x}px, ${mousePos.y}px,0)`
        el.focus()
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-page {
  position: relative;
  margin: 15px auto;
  transform-style: preserve-3d;
  &:focus {
    outline: none;
  }
}

.page-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pages-wrapper {
  position: relative;
  box-sizing: content-box;
}
.scale-container {
  width: 0px;
  height: 0px;
  position: relative;
  // border: 1px solid blue;
  box-sizing: border-box;
  transform-origin: 0 0;
  transform-style: preserve-3d;
}
.page-content {
  overflow: hidden;
  position: absolute;
  // border: 5px solid green;
  box-sizing: border-box;
  background-size: cover;
  background-repeat: no-repeat;
  transform-style: preserve-3d;
}
.page-highlighter {
  position: absolute;
  outline: 2px solid setColor(blue-2, 0.5);
  box-sizing: border-box;
  z-index: 5;
  pointer-events: none;
}
.page-control {
  position: absolute;
  top: 0px;
  left: 0px;
  // this css property will prevent the page-control div from blocking all the event of page-content
  pointer-events: none;
}

.snap-area {
  @include size(100%, 100%);
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  transform-style: preserve-3d;
  &__line {
    position: absolute;
    top: 0;
    left: 0;
    z-index: setZindex(coordinate);
    background-color: blue;
    &--vr {
      width: 1px;
    }
    &--hr {
      height: 1px;
    }
  }
}
.coordinate {
  border-right: 1px solid blue;
  border-bottom: 1px solid blue;
  opacity: 0.5;
  box-sizing: border-box;
  z-index: setZindex("coordinate");
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  font-size: 12px;
  &__val {
    position: absolute;
    color: white;
    font-weight: bold;
    text-shadow: 1px 1px 5px blue;
  }

  &__width {
    bottom: 5px;
    left: 50%;
    transform: translate(0, -50%);
  }
  &__height {
    top: 50%;
    right: 5px;
    transform: translate(-50%, 0);
  }
}

.layer-img {
  background: red;
  opacity: 0.5;
  pointer-events: none;
}

.dim-background {
  display: flex;
  position: fixed;
  min-width: 100%;
  min-height: 100%;
  background: rgba(0, 0, 0, 0.2);
  // background: rgba(53, 71, 90, 0.25);
  pointer-events: none;
}
</style>
