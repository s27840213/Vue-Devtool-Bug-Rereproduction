<template lang="pug">
  div(class="nu-page"
      ref="page")
    div(class="page-title text-left mb-5" :style="{'width': `${config.width * (scaleRatio/100)}px`,}")
      input(class="text-gray-3"
        type="text"
        v-model="pageName"
        @focus="ShortcutUtils.deselect()")
      div(class="nu-page__icons" v-if="(getLastSelectedPageIndex === pageIndex) && !isBackgroundImageControl")
        svg-icon(class="pointer btn-line-template mr-15"
          :iconName="'line-template'" :iconWidth="`${18}px`" :iconColor="'gray-3'"
          @click.native="openLineTemplatePopup()")
        svg-icon(class="pointer mr-5"
          :iconName="'caret-up'" :iconWidth="`${8}px`" :iconColor="'gray-3'"
          @click.native="")
        svg-icon(class="pointer mr-15"
          :iconName="'caret-down'" :iconWidth="`${8}px`" :iconColor="'gray-3'"
          @click.native="")
        svg-icon(class="pointer mr-10"
          :iconName="'add-page'" :iconWidth="`${18}px`" :iconColor="'gray-3'"
          @click.native="addPage()")
        svg-icon(class="pointer"
          :class="[{'mr-10': getPageCount > 1}]"
          :iconName="'duplicate-page'" :iconWidth="`${18}px`" :iconColor="'gray-3'"
          @click.native="duplicatePage()")
        svg-icon(class="pointer"
          v-if="getPageCount > 1" :iconName="'trash'" :iconWidth="`${18}px`" :iconColor="'gray-3'"
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
        @mouseover="togglePageHighlighter(true)"
        @mouseleave="togglePageHighlighter(false)"
        tabindex="0")
      div(class="scale-container relative" :style="`transform: scale(${scaleRatio/100})`")
        page-content(:config="config" :pageIndex="pageIndex")
        div(v-show="pageIsHover || currFocusPageIndex === pageIndex"
          class="page-highlighter"
          :style="styles()")
        div(class="page-control" :style="styles('control')")
          div(class="snap-area")
            div(v-for="line in closestSnaplines.v"
              class="snap-area__line snap-area__line--vr"
              :style="snapLineStyles('v', line)")
            div(v-for="line in closestSnaplines.h"
              class="snap-area__line snap-area__line--hr"
              :style="snapLineStyles('h', line)")
            template(v-if="isShowGuideline")
              div(v-for="(line,index) in guidelines.v"
                class="snap-area__line snap-area__line--vr"
                :style="snapLineStyles('v', line,true)"
                @mouseover="showGuideline(line,'v',index)")
              div(v-for="(line,index) in guidelines.h"
                class="snap-area__line snap-area__line--hr"
                :style="snapLineStyles('h', line,true)"
                @mouseover="showGuideline(line,'h',index)")
          template(v-for="(layer, index) in config.layers")
            component(:is="layer.type === 'image' && layer.imgControl ? 'nu-img-controller' : 'nu-controller'"
              data-identifier="controller"
              :key="`controller-${(layer.id === undefined) ? index : layer.id}`"
              :layerIndex="index"
              :pageIndex="pageIndex"
              :config="layer"
              :snapUtils="snapUtils"
              @setFocus="setFocus()"
              @getClosestSnaplines="getClosestSnaplines"
              @clearSnap="clearSnap")
          div(v-if="currActivePageIndex === pageIndex"
              class="page-resizer"
              ref="pageResizer"
              @mousedown.left.stop="pageResizeStart($event)")
            div(class="page-resizer__resizer-bar")
        div(v-if="ImageUtils.isImgControl"
            class="dim-background"
            :style="styles('control')")
          template(v-if="getCurrLayer.type === 'group' || getCurrLayer.type === 'frame'")
            nu-layer(:layerIndex="currSubSelectedInfo.index"
              :pageIndex="pageIndex"
              :config="getCurrSubSelectedLayer")
            div(class="page-control" :style="Object.assign(styles('control'))")
                nu-img-controller(:layerIndex="currSubSelectedInfo.index"
                                  :pageIndex="pageIndex"
                                  :primaryLayerIndex="currSelectedInfo.index"
                                  :config="Object.assign(getCurrSubSelectedLayer, { pointerEvents: 'none' })")
          template(v-else)
            nu-layer(:layerIndex="currSelectedIndex"
              :pageIndex="pageIndex"
              :config="getCurrLayer")
            div(class="page-control" :style="Object.assign(styles('control'))")
                nu-img-controller(:layerIndex="currSelectedIndex"
                                  :pageIndex="pageIndex"
                                  :config="getCurrLayer")
        div(v-if="isBackgroundImageControl"
            class="background-control"
            :style="backgroundControlStyles()")
          nu-image(:config="config.backgroundImage.config")
          nu-background-controller(:config="config.backgroundImage.config" :pageIndex="pageIndex")
          div(:style="backgroundContorlClipStyles()")
            nu-image(:config="config.backgroundImage.config")
        div(v-if="isAnyBackgroundImageControl && !isBackgroundImageControl"
            class="dim-background"
            :style="Object.assign(styles('control'), {'pointer-events': 'initial'})")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations, mapGetters, mapState } from 'vuex'
import { IShape, IText, IImage, IGroup, ILayer, ITmp, IFrame } from '@/interfaces/layer'
import PageContent from '@/components/editor/page/PageContent.vue'
import MouseUtils from '@/utils/mouseUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import GroupUtils from '@/utils/groupUtils'
import SnapUtils from '@/utils/snapUtils'
import GeneralUtils from '@/utils/generalUtils'
import { ISnapline } from '@/interfaces/snap'
import ImageUtils from '@/utils/imageUtils'
import popupUtils from '@/utils/popupUtils'
import layerUtils from '@/utils/layerUtils'
import PageUtils from '@/utils/pageUtils'
import NuImage from '@/components/editor/global/NuImage.vue'
import NuBackgroundController from '@/components/editor/global/NuBackgroundController.vue'
import rulerUtils from '@/utils/rulerUtils'
import { IPage } from '@/interfaces/page'

export default Vue.extend({
  components: {
    NuImage,
    NuBackgroundController,
    PageContent
  },
  data() {
    return {
      initialAbsPos: { x: 0, y: 0 },
      initialRelPos: { x: 0, y: 0 },
      currentAbsPos: { x: 0, y: 0 },
      currentRelPos: { x: 0, y: 0 },
      initialPageHeight: 0,
      pageIsHover: false,
      ImageUtils,
      layerUtils,
      ShortcutUtils,
      // for test used
      coordinate: null as unknown as HTMLElement,
      coordinateWidth: 0,
      coordinateHeight: 0,
      snapUtils: new SnapUtils(this.pageIndex),
      closestSnaplines: {
        v: [] as Array<number>,
        h: [] as Array<number>
      },
      GeneralUtils
    }
  },
  props: {
    config: Object,
    pageIndex: Number,
    pageScaleRatio: Number,
    isAnyBackgroundImageControl: Boolean,
    editorView: HTMLElement
  },
  mounted() {
    this.initialPageHeight = (this.config as IPage).height
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      getLastSelectedPageIndex: 'getLastSelectedPageIndex',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      currActivePageIndex: 'getCurrActivePageIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      pages: 'getPages',
      getPage: 'getPage',
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
    },
    isBackgroundImageControl(): boolean {
      return this.config.backgroundImage.config.imgControl
    },
    guidelines(): { [index: string]: Array<number> } {
      return (this.config as IPage).guidelines
    },
    isShowGuideline(): boolean {
      return rulerUtils.showGuideline
    },
    currFocusPageIndex(): number {
      return PageUtils.currFocusPageIndex
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
    ...mapMutations({
      ADD_newLayers: 'ADD_newLayers',
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setDropdown: 'popup/SET_STATE',
      _addPage: 'ADD_page',
      _deletePage: 'DELETE_page',
      deleteGuideline: 'DELETE_guideline'
    }),
    styles(type: string) {
      return type === 'content' ? {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`,
        backgroundColor: this.config.backgroundColor,
        backgroundImage: `url(${this.config.backgroundImage.config.srcObj ? ImageUtils.getSrc(this.config.backgroundImage.config) : this.config.backgroundImage.src})`,
        backgroundPosition: this.config.backgroundImage.posX === -1 ? 'center center'
          : `${this.config.backgroundImage.posX}px ${this.config.backgroundImage.posY}px`,
        backgroundSize: `${this.config.backgroundImage.config.styles.imgWidth}px ${this.config.backgroundImage.config.styles.imgHeight}px`
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
    snapLineStyles(dir: string, pos: number, isGuideline?: string) {
      return dir === 'v' ? {
        height: `${this.config.height}px`,
        width: `${GeneralUtils.fixSize(1)}px`,
        transform: `translate3d(${pos}px,0,50px)`,
        'pointer-events': isGuideline ? 'auto' : 'none'
      }
        : {
          width: `${this.config.width}px`,
          height: `${GeneralUtils.fixSize(1)}px`,
          transform: `translate3d(0,${pos}px,50px)`,
          'pointer-events': isGuideline ? 'auto' : 'none'
        }
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
    pageDblClickHandler(): void {
      if ((this.config.backgroundImage.config.srcObj?.assetId ?? '') !== '') {
        PageUtils.startBackgroundImageControl(this.pageIndex)
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
      this.closestSnaplines.v = [...this.snapUtils.closestSnaplines.v.map((snapline: ISnapline) => snapline.pos)]
      this.closestSnaplines.h = [...this.snapUtils.closestSnaplines.h.map((snapline: ISnapline) => snapline.pos)]
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
      this._addPage(PageUtils.newPage({}))
    },
    deletePage() {
      GroupUtils.deselect()
      this.setLastSelectedPageIndex(this.pageIndex - 1)
      this.setCurrActivePageIndex(this.pageIndex - 1)
      this._deletePage(this.pageIndex)
    },
    duplicatePage() {
      const page = GeneralUtils.deepCopy(this.getPage(this.pageIndex))
      page.name += ' (copy)'
      page.designId = ''
      PageUtils.addPageToPos(page, this.pageIndex + 1)
      GroupUtils.deselect()
      this.setLastSelectedPageIndex(this.pageIndex + 1)
      this.setCurrActivePageIndex(this.pageIndex + 1)
    },
    backgroundControlStyles() {
      const backgroundImage = this.config.backgroundImage
      return {
        width: `${backgroundImage.config.styles.imgWidth}px`,
        height: `${backgroundImage.config.styles.imgHeight}px`,
        left: `${backgroundImage.posX}px`,
        top: `${backgroundImage.posY}px`
      }
    },
    backgroundContorlClipStyles() {
      const { posX, posY } = this.config.backgroundImage
      return {
        clipPath: `path('M${-posX},${-posY}h${this.config.width}v${this.config.height}h${-this.config.width}z`,
        'pointer-events': 'none'
      }
    },
    showGuideline(pos: number, type: string, index: number) {
      if (!rulerUtils.isDragging) {
        this.deleteGuideline({
          index,
          type
        })
        rulerUtils.event.emit('showGuideline', pos, rulerUtils.mapSnaplineToGuidelineArea(pos, type), type)
      }
    },
    openLineTemplatePopup() {
      popupUtils.openPopup('line-template', {
        posX: 'right'
      })
    },
    scrollUpdate() {
      console.log(this.currentAbsPos.x, this.currentAbsPos.y)
      const event = new MouseEvent('mousemove', {
        clientX: this.currentAbsPos.x,
        clientY: this.currentAbsPos.y
      })
      document.documentElement.dispatchEvent(event)
    },
    pageResizeStart(e: MouseEvent) {
      this.initialRelPos = this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.editorView as HTMLElement)
      this.initialAbsPos = this.currentAbsPos = MouseUtils.getMouseAbsPoint(e)
      document.documentElement.addEventListener('mousemove', this.pageResizing)
      this.editorView.addEventListener('scroll', this.scrollUpdate, { capture: true })
      document.documentElement.addEventListener('mouseup', this.pageResizeEnd)
    },
    pageResizing(e: MouseEvent) {
      this.currentAbsPos = MouseUtils.getMouseAbsPoint(e)
      this.currentRelPos = MouseUtils.getMouseRelPoint(e, this.editorView as HTMLElement)
      const yDiff = (this.currentRelPos.y - this.initialRelPos.y) * 100 / (this.scaleRatio)
      PageUtils.updatePageProps({
        height: Math.max(Math.trunc(this.initialPageHeight + yDiff), 20)
      })
    },
    pageResizeEnd(e: MouseEvent) {
      this.initialPageHeight = (this.config as IPage).height
      this.$nextTick(() => {
        document.documentElement.removeEventListener('mousemove', this.pageResizing)
        this.editorView.removeEventListener('scroll', this.scrollUpdate, { capture: true })
        document.documentElement.removeEventListener('mouseup', this.pageResizeEnd)
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
  user-select: none;

  &__icons {
    display: flex;
    align-items: center;
  }
}

.page-title {
  display: flex;
  justify-content: space-between;
  white-space: nowrap;
  transform: translate3d(0, 0, 10000px);
  > input {
    min-width: 40px;
    background-color: transparent;
    text-overflow: ellipsis;
  }
}
.pages-wrapper {
  position: relative;
  box-sizing: content-box;
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
  background-repeat: no-repeat;
  transform-style: preserve-3d;
}
.page-highlighter {
  position: absolute;
  top: 0px;
  left: 0px;
  outline: 5px solid setColor(blue-1, 0.5);
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

.page-resizer {
  @include flexCenter();
  position: absolute;
  bottom: 0px;
  left: 0px;
  pointer-events: auto;
  background-color: setColor(blue-1, 0.5);
  width: 100%;
  height: 20px;
  cursor: row-resize;
  transform: translate3d(0, 0, 1000px);
  &__resizer-bar {
    width: 100px;
    height: 70%;
    background-color: setColor(white);
  }
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

.background-control {
  position: absolute;
  // transform: translateZ(1000px);
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
}
</style>
