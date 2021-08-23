<template lang="pug">
  div(class="color-picker")
    //- span(class="color-picker__title text-blue-1 label-lg") Document Colors
    div(class="color-picker__colors")
      div(v-for="(color, index) in getColors"
        class="color-picker__color"
        :style="colorStyles(color, index)"
        @click="selectColor(index)")
    span(class="color-picker__title text-blue-1 label-lg") Color Palette
    div(class="color-picker__colors")
      div(class="color-picker__color__palette")
      div(v-for="(color, index) in colorPresets"
        class="color-picker__color palette"
        :style="paletteColorStyle(color, index)"
        @click="setColor(color, index)")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import { mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  components: {
    SearchBar
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    }),
    getColors(): [string] {
      return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).color
    }
  },
  data() {
    return {
      colorPresets: [
        '#000000',
        '#F2994A',
        '#F2C94C',
        '#219653',
        '#9B51E0',
        '#BB6BD9',
        '#EB5757',
        '#2F80ED',
        '#2D9CDB',
        '#56CCF2',
        '#FF0000'
      ],
      currSelectedColorIndex: 0,
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
    selectColor(index: number) {
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
        const record = { key: i, value: -1 }
        this.paletteRecord.push(record)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.color-picker {
  @include size(100%, 100%);
  text-align: center;
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  grid-template-columns: 1fr;
  &__title {
    margin-bottom: 0px;
    margin-top: 20px;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }
  &__colors {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
  }
  &__color-palette {

  }
  &__color {
    @include size(clamp(30px, 2vw, 50px), clamp(30px, 2vw, 50px));
    margin: 5px;
    border: 1px solid setColor(gray-4);
    border-radius: 4px;
    &:hover {
      box-shadow: 0 0 0 2px #808080, inset 0 0 0 1.5px #fff
    }
    transition: box-shadow .2s ease-in-out;
  }
}
.palette {
  &:hover {
    box-shadow: 0 0 0 2px #7d2ae8, inset 0 0 0 1.5px #fff
  }
}
</style>
