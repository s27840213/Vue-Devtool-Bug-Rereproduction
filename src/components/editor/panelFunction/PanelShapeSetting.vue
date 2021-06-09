<template lang="pug">
  div(class="color-picker")
    span(class="color-picker__title text-blue-1 label-lg") Document Colors
    div(class="color-picker__colors")
      div(v-for="(color, index) in getDocumentColors"
        class="color-picker__color"
        :style="colorStyles(color, index)"
        @click="selectColor(index)")
    span(class="color-picker__title text-blue-1 label-lg") Color Picker
    div(class="color-picker__colors")
      div(v-for="color in colorPresets"
        class="color-picker__color"
        :style="colorStyles(color)"
        @click="setColor(color)")
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
    getDocumentColors(): [string] {
      return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).color
    }
  },
  data() {
    return {
      colorPresets: [
        '#F2994A',
        '#F2C94C',
        '#219653',
        '#9B51E0',
        '#BB6BD9',
        '#EB5757',
        '#2F80ED',
        '#2D9CDB',
        '#56CCF2',
        '#FFFFFF'
      ],
      currSelectedColorIndex: 0
    }
  },
  methods: {
    ...mapMutations({
      _updateLayerProps: 'UPDATE_layerProps'
    }),
    colorStyles(color: string, index: number) {
      return {
        backgroundColor: color,
        border: index === this.currSelectedColorIndex ? '1.5px solid black' : '',
        boxShadow: index === this.currSelectedColorIndex ? 'inset 0 0 0 2px #fff' : ''
      }
    },
    selectColor(index: number) {
      this.currSelectedColorIndex = index
    },
    setColor(newColor: string) {
      const colors = Object.assign([], this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).color)
      colors[this.currSelectedColorIndex] = newColor
      this.updateLayerProps(this.lastSelectedPageIndex, this.currSelectedIndex, colors)
    },
    updateLayerProps(pageIndex: number, layerIndex: number, color: [string]) {
      this._updateLayerProps({
        pageIndex,
        layerIndex,
        props: { color: color }
      })
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
  &__color {
    @include size(clamp(30px, 2vw, 50px), clamp(30px, 2vw, 50px));
    margin: 5px;
    border: 1px solid setColor(gray-4);
    border-radius: 4px;
  }
}
</style>
