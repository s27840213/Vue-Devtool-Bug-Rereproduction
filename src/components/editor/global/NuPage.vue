<template lang="pug">
  div(class="nu-page"
      ref="page")
    div(class="page-title text-left mb-5" :style="{'width': `${config.width * (scaleRatio/100)}px`,}")
      input(class="text-gray-3"
        type="text"
        v-model="pageName"
        @focus="ShortcutUtils.deselect()")
      div(v-if="getLastSelectedPageIndex===pageIndex")
        svg-icon(class="pointer"
          :iconName="'plus'" :iconWidth="`${14}px`" :iconColor="'gray-3'"
          @click.native="addPage()")
        svg-icon(class="pointer"
          v-if="getPageCount > 1" :iconName="'trash'" :iconWidth="`${14}px`" :iconColor="'gray-3'"
          @click.native="deletePage()")
    div(class='pages-wrapper'
        :class="`nu-page-${pageIndex}`"
        :style="wrapperStyles()"
        @keydown.delete.exact.stop.prevent.self="ShortcutUtils.del()"
        @keydown.ctrl.67.exact.stop.prevent.self="ShortcutUtils.copy()"
        @keydown.meta.67.exact.stop.prevent.self="ShortcutUtils.copy()"
        @keydown.ctrl.68.exact.stop.prevent.self="ShortcutUtils.deselect()"
        @keydown.meta.68.exact.stop.prevent.self="ShortcutUtils.deselect()"
        @keydown.ctrl.88.exact.stop.prevent.self="ShortcutUtils.cut()"
        @keydown.meta.88.exact.stop.prevent.self="ShortcutUtils.cut()"
        @keydown.ctrl.86.exact.stop.prevent.self="ShortcutUtils.paste($event)"
        @keydown.meta.86.exact.stop.prevent.self="ShortcutUtils.paste($event)"
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
        @keydown.ctrl.187.exact.stop.prevent.self="ShortcutUtils.zoomIn()"
        @keydown.meta.187.exact.stop.prevent.self="ShortcutUtils.zoomIn()"
        @keydown.ctrl.189.exact.stop.prevent.self="ShortcutUtils.zoomOut()"
        @keydown.meta.189.exact.stop.prevent.self="ShortcutUtils.zoomOut()"
        @keydown.37.exact.stop.prevent.self="ShortcutUtils.left()"
        @keydown.38.exact.stop.prevent.self="ShortcutUtils.up()"
        @keydown.39.exact.stop.prevent.self="ShortcutUtils.right()"
        @keydown.40.exact.stop.prevent.self="ShortcutUtils.down()"
        @keydown.shift.37.exact.stop.prevent.self="ShortcutUtils.left(true)"
        @keydown.shift.38.exact.stop.prevent.self="ShortcutUtils.up(true)"
        @keydown.shift.39.exact.stop.prevent.self="ShortcutUtils.right(true)"
        @keydown.shift.40.exact.stop.prevent.self="ShortcutUtils.down(true)"
        tabindex="0")
      div(class="scale-container" :style="`transform: scale(${scaleRatio/100})`")
        div(class="overflow-container"
            :style="styles()")
          div(:style="Object.assign(styles(), {transformStyle: 'preserve-3d'})")
            div(class="snap-area")
              div(v-for="line in closestSnaplines.v"
                class="snap-area__line snap-area__line--vr"
                :style="snapLineStyles('v', line.pos)")
              div(v-for="line in closestSnaplines.h"
                class="snap-area__line snap-area__line--hr"
                :style="snapLineStyles('h', line.pos)")
            div(:class="['page-content', `.nu-page-${pageIndex}`]"
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
                :key="layer.id"
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
              :key="`controller-${layer.id}`"
              :layerIndex="index"
              :pageIndex="pageIndex"
              :config="layer"
              :snapUtils="snapUtils"
              @setFocus="setFocus()"
              @getClosestSnaplines="getClosestSnaplines"
              @clearSnap="clearSnap")
            //- nu-controller(v-if="!(layer.type === 'image' && layer.imgControl)"
            //-   data-identifier="controller"
            //-   :key="`controller-${index}`"
            //-   :layerIndex="index"
            //-   :pageIndex="pageIndex"
            //-   :config="layer"
            //-   :snapUtils="snapUtils"
            //-   @setFocus="setFocus()"
            //-   @getClosestSnaplines="getClosestSnaplines"
            //-   @clearSnap="clearSnap")
        div(v-if="ImageUtils.isImgControl"
            class="dim-background"
            :style="styles('control')"
            ref="page-content")
          template(v-if="getCurrLayer.type === 'group' || getCurrLayer.type === 'frame'")
            nu-layer(:layerIndex="currSubSelectedInfo.index"
              :pageIndex="pageIndex"
              :config="getCurrSubSelectedLayer")
            div(class="page-control" :style="Object.assign(styles('control'))")
                nu-img-controller(:layerIndex="currSubSelectedInfo.index"
                                  :pageIndex="pageIndex"
                                  :config="Object.assign(getCurrSubSelectedLayer, { pointerEvents: 'none' })")
          template(v-else)
            nu-layer(:layerIndex="currSelectedIndex"
              :pageIndex="pageIndex"
              :config="getCurrLayer")
            div(class="page-control" :style="Object.assign(styles('control'))")
                nu-img-controller(:layerIndex="currSelectedIndex"
                                  :pageIndex="pageIndex"
                                  :config="getCurrLayer")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations, mapGetters, mapState } from 'vuex'
import { IShape, IText, IImage, IGroup, ILayer, ITmp, IFrame } from '@/interfaces/layer'
import MouseUtils from '@/utils/mouseUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import GroupUtils from '@/utils/groupUtils'
import SnapUtils from '@/utils/snapUtils'
import ControlUtils from '@/utils/controlUtils'
import GeneralUtils from '@/utils/generalUtils'
import { ISnapline } from '@/interfaces/snap'
import ImageUtils from '@/utils/imageUtils'
import popupUtils from '@/utils/popupUtils'

export default Vue.extend({
  data() {
    return {
      pageIsHover: false,
      ImageUtils,
      ShortcutUtils,
      // for test used
      coordinate: null as unknown as HTMLElement,
      coordinateWidth: 0,
      coordinateHeight: 0,
      snapUtils: new SnapUtils(this.pageIndex),
      closestSnaplines: {
        v: [] as Array<ISnapline>,
        h: [] as Array<ISnapline>
      },
      GeneralUtils
    }
  },
  props: {
    config: Object,
    pageIndex: Number,
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
      getLastSelectedPageIndex: 'getLastSelectedPageIndex',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      getCurrActivePageIndex: 'getCurrActivePageIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      pages: 'getPages',
      getLayer: 'getLayer'
    }),
    ...mapState('user', ['downloadUrl', 'checkedAssets']),
    getCurrLayer(): ILayer {
      return this.getLayer(this.pageIndex, this.currSelectedIndex)
    },
    getCurrSubSelectedLayer(): ILayer | undefined {
      const layer = this.getCurrLayer
      if (layer.type === 'group') {
        return GroupUtils.mapLayersToPage(
          [(this.getCurrLayer as IGroup).layers[this.currSubSelectedInfo.index]], this.getCurrLayer as ITmp)[0]
      } else if (layer.type === 'frame') {
        return GroupUtils.mapLayersToPage(
          [(this.getCurrLayer as IFrame).clips[this.currSubSelectedInfo.index]], this.getCurrLayer as ITmp)[0]
      }
      return undefined
    },
    getPageCount(): number {
      return this.pages.length
    },
    pageName: {
      get(): string {
        return this.config.name
      },
      set(value: string): void {
        this.$store.commit('UPDATE_pageProps', {
          pageIndex: this.pageIndex,
          props: {
            name: value
          }
        })
      }
    }
  },
  methods: {
    ...mapMutations({
      ADD_newLayers: 'ADD_newLayers',
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setDropdown: 'popup/SET_STATE',
      _addPage: 'ADD_page',
      _deletePage: 'DELETE_page'
    }),
    styles(type: string) {
      return type === 'content' ? {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`,
        backgroundColor: this.config.backgroundColor,
        backgroundImage: `url(${this.config.backgroundImage.config.srcObj ? ImageUtils.getSrc(this.config.backgroundImage.config) : this.config.backgroundImage.src})`,
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
      GroupUtils.deselect()
      this.setLastSelectedPageIndex(this.pageIndex)
      this.setCurrActivePageIndex(this.pageIndex)
      const sel = window.getSelection()
      if (sel) {
        sel.empty()
        sel.removeAllRanges()
      }
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
      popupUtils.openPopup('page', { event })
    },
    addPage() {
      this._addPage({
        width: 1080,
        height: 1080,
        backgroundColor: '#ffffff',
        backgroundImage: {
          config: {
            type: 'image',
            src: 'none',
            clipPath: '',
            active: false,
            shown: false,
            locked: false,
            moved: false,
            imgControl: false,
            isClipper: false,
            dragging: false,
            designId: '',
            styles: {
              x: 0,
              y: 0,
              scale: 1,
              scaleX: 0,
              scaleY: 0,
              rotate: 0,
              width: 0,
              height: 0,
              initWidth: 0,
              initHeight: 0,
              imgX: 0,
              imgY: 0,
              imgWidth: 0,
              imgHeight: 0,
              zindex: -1,
              opacity: 100
            }
          },
          posX: -1,
          posY: -1
        },
        name: 'Default Page',
        layers: [
        ],
        documentColor: [],
        designId: ''
      })
    },
    deletePage() {
      this._deletePage(this.pageIndex)
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-page {
  position: relative;
  margin: 15px auto;
  transform-style: preserve-3d;
  user-select: none;
}

.page-title {
  display: flex;
  justify-content: space-between;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transform: translate3d(0, 0, 10000px);
  > input {
    background-color: transparent;
  }
  > div {
    height: 18px;
  }
}
.pages-wrapper {
  position: relative;
  box-sizing: content-box;
  &:focus {
    outline: 1px solid setColor(blue-2);
  }
}
.scale-container {
  width: 0px;
  height: 0px;
  position: relative;
  box-sizing: border-box;
  transform-origin: 0 0;
}

/*
    because overflow: hidden will disable the translateZ props in page-content(layers' order will be incorrect)
    That's why we need this additional container
 */
.overflow-container {
  position: relative;
  overflow: hidden;
}

.page-content {
  position: absolute;
  box-sizing: border-box;
  background-size: cover;
  background-repeat: no-repeat;
  transform-style: preserve-3d;
}
.page-highlighter {
  position: absolute;
  top: 0px;
  left: 0px;
  outline: 2px solid setColor(blue-2, 0.5);
  box-sizing: border-box;
  z-index: setZindex("page-highlighter");
  pointer-events: none;
}
.page-control {
  position: absolute;
  top: 0px;
  left: 0px;
  // this css property will prevent the page-control div from blocking all the event of page-content
  transform-style: preserve-3d;
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

.layer-img {
  background: red;
  opacity: 0.5;
  pointer-events: none;
}

.dim-background {
  position: absolute;
  transform: translateZ(1000px);
  top: 0px;
  left: 0px;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
  transform-style: preserve-3d;
}
</style>
