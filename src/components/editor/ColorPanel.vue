<template lang="pug">
  div(class="color-panel p-20"
      :class="[whiteTheme ? 'bg-white': 'bg-gray-1-5']"
      v-click-outside="vcoConfig"
      ref="colorPanel")
    img(class="color-panel__btn"
      :src="require(`@/assets/img/svg/btn-pack-hr${whiteTheme ? '-white': ''}.svg`)"
      @click="closePanel()")
    search-bar(:placeholder="'Search color'"
    class="mb-10")
    div(class="color-panel__colors mb-10"
        :style="{'color': whiteTheme ? '#000000' : '#ffffff'}")
      div(class="text-left mb-5")
        span(class="body-1") {{$t('NN0091')}}
      div
        div(class="color-panel__add-color pointer"
          @click="openColorPanel($event)")
        div(v-for="color in documentColors"
          class="pointer color-panel__color"
          :style="colorStyles(color)"
          @click="handleColorEvent(color)")
    //- div(class="color-panel__colors mb-10")
    //-   div(class="text-left mb-5")
    //-     span(class="body-1") 品牌
    //-   div
    //-     div(v-for="color in brandColors"
    //-       class="pointer color-panel__color"
    //-       :style="colorStyles(color)"
    //-       @click="handleColorEvent(color)")
    div(class="color-panel__colors"
        :style="{'color': whiteTheme ? '#000000' : '#ffffff'}")
      div(class="text-left mb-5")
        span(class="body-1") {{$t('NN0089')}}
      div
        div(v-for="color in defaultColors"
          class="pointer color-panel__color"
          :style="colorStyles(color)"
          @click="handleColorEvent(color)")
    color-picker(v-if="isColorPickerOpen"
      class="color-panel__color-picker"
      ref="colorPicker"
      v-click-outside="handleColorModal"
      :currentColor="colorUtils.currColor"
      @update="handleDragUpdate")
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import SearchBar from '@/components/SearchBar.vue'
import { mapGetters, mapMutations } from 'vuex'
import colorUtils from '@/utils/colorUtils'
import ColorPicker from '@/components/ColorPicker.vue'
import layerUtils from '@/utils/layerUtils'
import mouseUtils from '@/utils/mouseUtils'
import { ColorEventType, FunctionPanelType } from '@/store/types'
import color from '@/store/module/color'
import tiptapUtils from '@/utils/tiptapUtils'

export default Vue.extend({
  props: {
    whiteTheme: {
      type: Boolean,
      default: false
    },
    alignLeft: {
      type: Boolean,
      default: true
    }
  },
  components: {
    SearchBar,
    ColorPicker
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      vcoConfig: {
        handler: () => {
          const sel = window.getSelection()
          if (sel && sel.rangeCount) {
            const target = sel?.getRangeAt(0).startContainer
            if (target && target instanceof HTMLElement && target.classList.contains('input-color')) {
              return
            }
          }
          colorUtils.setIsColorPickerOpen(false)
          this.$emit('toggleColorPanel', false)
        },
        middleware: null as unknown,
        events: ['dblclick', 'click', 'contextmenu']
        // events: ['dblclick', 'click', 'contextmenu', 'mousedown']
      },
      openColorPicker: false,
      brandColors: ['#2D9CDB'],
      colorUtils,
      middlewareMap: {
        text: 'shape-setting__color',
        shapge: 'shape-setting__color'
      }
    }
  },
  created() {
    this.vcoConfig.middleware = this.middleware
    colorUtils.event.emit(ColorEventType.textInit, '')
  },
  mounted() {
    this.updateDocumentColors({ pageIndex: layerUtils.pageIndex, color: colorUtils.currColor })
    this.setCurrFunctionPanel(FunctionPanelType.colorPicker)
  },
  destroyed() {
    this.updateDocumentColors({ pageIndex: layerUtils.pageIndex, color: colorUtils.currColor })
    this.setCurrFunctionPanel(FunctionPanelType.none)
  },
  computed: {
    ...mapGetters({
      documentColors: 'color/getDocumentColors',
      defaultColors: 'color/getDefaultColors',
      currSelectedInfo: 'getCurrSelectedInfo'
    }),
    isShape(): boolean {
      return this.currSelectedInfo.types.has('shape') && this.currSelectedInfo.layers.length === 1
    },
    isText(): boolean {
      return this.currSelectedInfo.types.has('text') && this.currSelectedInfo.layers.length === 1
    },
    isColorPickerOpen(): boolean {
      return colorUtils.isColorPickerOpen
    }
  },
  methods: {
    ...mapMutations({
      updateDocumentColors: 'UPDATE_documentColors',
      setCurrFunctionPanel: 'SET_currFunctionPanelType'
    }),
    colorStyles(color: string) {
      return {
        backgroundColor: color
      }
    },
    handleColorEvent(color: string) {
      colorUtils.event.emit(colorUtils.currEvent, color)
      colorUtils.setCurrColor(color)
      this.updateDocumentColors({ pageIndex: layerUtils.pageIndex, color })
    },
    handleDragUpdate(color: string) {
      colorUtils.event.emit(colorUtils.currEvent, color)
      colorUtils.setCurrColor(color)
    },
    handleColorModal(): void {
      colorUtils.setIsColorPickerOpen(!colorUtils.isColorPickerOpen)
    },
    middleware(event: MouseEvent): boolean {
      return this.isShape ? (event.target as HTMLElement).className !== 'shape-setting__color' : true
    },
    closePanel(): void {
      this.$emit('toggleColorPanel', false)
    },
    openColorPanel(event: MouseEvent) {
      colorUtils.setIsColorPickerOpen(true)
      Vue.nextTick(() => {
        const colorPanel = this.$refs.colorPanel as HTMLElement
        const colorPicker = document.getElementsByClassName('color-panel__color-picker')[0] as HTMLElement
        const [width, height] = [colorPicker.offsetWidth, colorPicker.offsetHeight]
        const [vw, vh] = [window.innerWidth || document.documentElement.clientWidth, window.innerHeight || document.documentElement.clientHeight]
        const mousePos = mouseUtils.getMouseAbsPoint(event)
        const { top, left, right } = (event.target as HTMLElement).getBoundingClientRect()

        const margin = 10
        const panelTop = colorPanel.getBoundingClientRect().top
        let topPos = top - panelTop
        console.log(top, height, vh, topPos)
        if (top + height > vh) {
          topPos -= ((top + height) - vh)
        }

        console.log(`${left - colorPanel.getBoundingClientRect().left - margin}px`)
        console.log(`${colorPanel.getBoundingClientRect().left - width - margin}px`)
        const pickerPos = this.alignLeft ? {
          left: `${left - colorPanel.getBoundingClientRect().left - width - margin}px`,
          top: `${topPos}px`
        } : {
          right: `${colorPanel.getBoundingClientRect().right - right - width - margin}px`,
          top: `${topPos}px`
        }
        if (this.alignLeft) {
          colorPicker.style.left = pickerPos.left ?? '0px'
          colorPicker.style.top = pickerPos.top
        } else {
          colorPicker.style.right = pickerPos.right ?? '0px'
          colorPicker.style.top = pickerPos.top
        }
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.color-panel {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: setZindex(color-panel);
  box-sizing: border-box;
  filter: drop-shadow(0px -1px 5px setColor(white, 0.2));
  &__btn {
    position: absolute;
    top: 0;
    transform: translate3d(-50%, -70%, 0);
  }
  &__colors {
    display: flex;
    flex-direction: column;
    align-items: center;
    > div:nth-child(1) {
      width: 100%;
      display: flex;
      justify-content: flex-start;
    }
    > div:nth-child(2) {
      width: 100%;
      display: grid;
      grid-auto-rows: auto;
      grid-template-columns: repeat(7, 1fr);
      row-gap: 5px;
      column-gap: 5px;
      justify-content: center;
      align-items: center;
    }
  }

  &__add-color {
    width: 100%;
    // height: 100%;
    padding-top: 100%;
    background-image: url("~@/assets/img/svg/addColor.png");
    background-size: cover;
  }

  &__color {
    // aspect-ratio: 1/1;
    // height: 100%;
    width: 100%;
    padding-top: 100%;
    border-radius: 2px;
    box-shadow: 0px 1px 4px setColor(gray-1-5, 0.2);
  }

  &__color-picker {
    position: absolute;
    z-index: setZindex(color-panel);
  }
}
</style>
