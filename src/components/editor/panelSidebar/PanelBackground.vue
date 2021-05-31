<template lang="pug">
  div(class="panel-bg")
    search-bar(:placeholder="'Search background'")
    span(class="text-left mt-10") Color
    div(class="panel-bg__colors")
      div(v-for="color in colorPresets"
        class="panel-bg__color"
        :style="colorStyles(color)"
        @click="setBgColor(color)")
    tmp-images
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import { mapMutations, mapGetters } from 'vuex'

export default Vue.extend({
  components: {
    SearchBar
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
      ]
    }
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    })
  },
  methods: {
    ...mapMutations({
      updateLayerStyles: 'UPDATE_layerStyles',
      _setBgColor: 'SET_backgroundColor'
    }),
    colorStyles(color: string) {
      return {
        backgroundColor: color
      }
    },
    setBgColor(color: number) {
      this._setBgColor({
        pageIndex: this.lastSelectedPageIndex,
        color: color
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-bg {
  @include size(100%, 100%);
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  grid-template-columns: 1fr;
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
