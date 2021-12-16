<template lang="pug">
  div(class="color-panel p-20" v-click-outside="vcoConfig")
    img(class="color-panel__btn"
      :src="require('@/assets/img/svg/btn-pack-hr.svg')"
      @click="closePanel()")
    search-bar(:placeholder="'Search color'"
    class="mb-10")
    div(class="color-panel__colors mb-10")
      div(class="text-left mb-5")
        span(class="body-1") 文件顏色
      div
        div(class="color-panel__add-color pointer"
          @click="handleColorModal")
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
    div(class="color-panel__colors")
      div(class="text-left mb-5")
        span(class="body-1") 預設
      div
        div(class="color-panel__add-color pointer"
          @click="handleColorModal")
        div(v-for="color in defaultColors"
          class="pointer color-panel__color"
          :style="colorStyles(color)"
          @click="handleColorEvent(color)")
    color-picker(v-if="isColorPickerOpen"
      class="color-panel__color-picker"
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
import textUtils from '@/utils/textUtils'
import layerUtils from '@/utils/layerUtils'
import { FunctionPanelType } from '@/store/types'
import color from '@/store/module/color'
import tiptapUtils from '@/utils/tiptapUtils'

export default Vue.extend({
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
    if (!tiptapUtils.isRanged) {
      tiptapUtils.focus()
    }
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
    }
  }
})
</script>

<style lang="scss" scoped>
.color-panel {
  position: relative;
  background-color: setColor(sidebar-panel);
  width: 100%;
  height: 100%;
  z-index: setZindex(color-panel);
  box-sizing: border-box;
  &__btn {
    position: absolute;
    top: 0;
    transform: translate3d(-50%, -99%, 0);
  }
  &__colors {
    color: white;
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
  }

  &__color-picker {
    position: absolute;
    left: 0px;
    bottom: 0px;
    transform: translate3d(-100%, 0, 0);
    z-index: setZindex(color-panel);
  }
}
</style>
