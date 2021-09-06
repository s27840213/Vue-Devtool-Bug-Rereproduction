<template lang="pug">
  div(class="shape-setting")
    //- span(class="color-picker__title text-blue-1 label-lg") Document Colors
    div(class="shape-setting__colors")
      div(v-for="(color, index) in getColors"
        class="shape-setting__color"
        :style="colorStyles(color, index)"
        @click="selectColor(index)")
    div(v-if="getColors.length" class="shape-setting__title")
      span(class="shape-setting__title text-blue-1 label-lg") Color Palette
      div(class="shape-setting__colors")
        div(class="shape-setting__color rainbow" ref="rainbow"
          :style="colorPickerStyles()" @click="handleColorModalOn")
          color-picker(v-if="openColorPicker"
            class="shape-setting__color-picker"
            v-click-outside="handleColorModalOff"
            :currentColor="getColors[currSelectedColorIndex]"
            @update="handleColorUpdate")
        div(v-for="(color, index) in colorPresets"
          class="shape-setting__color palette"
          :style="paletteColorStyle(color, index)"
          @click="setColor(color, index)")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import { mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'
import ColorPicker from '@/components/ColorPicker.vue'

export default Vue.extend({
  components: {
    SearchBar,
    ColorPicker
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    }),
    isGroup(): boolean {
      const layer = this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex)
      return layer.type === 'tmp' || layer.type === 'group'
    },
    getColors(): string[] {
      if (!this.isGroup) {
        return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).color
      } else {
        return []
      }
    }
  },
  data() {
    return {
      colorPresets: [
        '#000000',
        '#FFFFFF',
        '#F2994A',
        '#F2C94C',
        '#219653',
        '#BB6BD9',
        '#EB5757',
        '#2F80ED',
        '#2D9CDB',
        '#56CCF2',
        '#FF0000'
      ],
      currSelectedColorIndex: 0,
      openColorPicker: false,
      paletteRecord: [{ key: 0, value: -1 }]
    }
  },
  watch: {
    currSelectedIndex: function() {
      this.initilizeRecord()
    }
  },
  mounted() {
    this.initilizeRecord()
  },
  methods: {
    ...mapMutations({
      _updateLayerProps: 'UPDATE_layerProps'
    }),
    colorStyles(color: string, index: number) {
      return {
        backgroundColor: color,
        boxShadow: index === this.currSelectedColorIndex ? '0 0 0 2px #808080, inset 0 0 0 1.5px #fff' : ''
        // boxShadow: index === this.currSelectedColorIndex ? '0 0 0 2px #7d2ae8, inset 0 0 0 2px #fff' : ''
      }
    },
    paletteColorStyle(color: string, index: number) {
      const currSelectedInPalette = this.paletteRecord.find(record => record.key === this.currSelectedColorIndex)?.value
      if (currSelectedInPalette === index) {
        return {
          backgroundColor: color,
          boxShadow: '0 0 0 2px #7d2ae8, inset 0 0 0 1.5px #fff'
        }
      } else {
        return {
          backgroundColor: color
        }
      }
    },
    colorPickerStyles() {
      const isSelected = this.paletteRecord.find(record => record.key === this.currSelectedColorIndex)?.value === -1
      return {
        background: `url(${require('@/assets/img/png/picker.png')})`,
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
        boxShadow: isSelected ? '0 0 0 2px #7d2ae8, inset 0 0 0 1.5px #fff' : ''
      }
    },
    handleColorModalOn(e: MouseEvent) {
      this.openColorPicker = true
    },
    handleColorModalOff(e: MouseEvent) {
      this.openColorPicker = false
    },
    handleColorUpdate(color: string) {
      this.setColor(color, this.currSelectedColorIndex)
      const record = this.paletteRecord.find(record => record.key === this.currSelectedColorIndex)
      if (record) {
        record.value = -1
      }
    },
    selectColor(index: number) {
      if (this.openColorPicker) {
        this.openColorPicker = false
      }
      this.currSelectedColorIndex = index
    },
    setColor(newColor: string, index: number) {
      const colors = Object.assign([], this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).color)
      colors[this.currSelectedColorIndex] = newColor
      const record = this.paletteRecord.find(record => record.key === this.currSelectedColorIndex)
      if (record) {
        record.value = index
      }
      this.updateLayerProps(this.lastSelectedPageIndex, this.currSelectedIndex, colors)
    },
    updateLayerProps(pageIndex: number, layerIndex: number, color: [string]) {
      this._updateLayerProps({
        pageIndex,
        layerIndex,
        props: { color: color }
      })
    },
    initilizeRecord() {
      this.paletteRecord = []
      for (let i = 0; i < this.getColors.length; i++) {
        const record = { key: i, value: this.colorPresets.findIndex(color => this.getColors[i] === color) }
        this.paletteRecord.push(record)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.shape-setting {
  @include size(100%, 100%);
  text-align: center;
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  grid-template-columns: 1fr;
  &__title {
    margin-bottom: 0px;
    margin-top: 10px;
  }
  > div {
    margin-top: 10px;
  }
  &__colors {
    width: 100%;
    margin-top: 10px;
    padding: 5px;;
    display: flex;
    flex-wrap: wrap;
  }
  &__color {
    @include size(clamp(30px, 2vw, 50px), clamp(30px, 2vw, 50px));
    margin: 5px;
    border: 1.5px solid setColor(gray-4);
    border-radius: 4px;
    &:hover {
      box-shadow: 0 0 0 2px #808080, inset 0 0 0 1.5px #fff
    }
    transition: box-shadow .2s ease-in-out;
  }
  &__color-picker {
    position: absolute;
    z-index: 10;
    left: -5px;
    top: 35px;
  }
}
.rainbow {
  position: relative;
  &:hover {
    box-shadow: 0 0 0 2px #7d2ae8, inset 0 0 0 1.5px #fff
  }
}

</style>
