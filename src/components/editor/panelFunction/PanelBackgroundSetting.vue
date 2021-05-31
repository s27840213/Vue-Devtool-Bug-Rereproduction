<template lang="pug">
  div(class="bg-setting")
    span(class="bg-setting__title text-blue-1 label-lg") Background Setting
    div(class="bg-setting__tabs")
      btn(v-for="(tab,index) in tabs"
        :key="`tab-${index}`"
        class="full-width"
        :type="activeTab === tab ? 'primary-sm' : 'inactive-sm'" @click.native="toggleTab(tab)") {{tab}}
    div(v-if="activeTab === 'Colors'" class="bg-setting__content")
      div(class="bg-setting__colors")
        div(class="bg-gray-1 pointer" @click="setBgColor('#18191F')")
        div(class="bg-gray-2 pointer" @click="setBgColor('#474A57')")
        div(class="bg-gray-3 pointer" @click="setBgColor('#969BAB')")
        div(class="bg-gray-4 pointer" @click="setBgColor('#D9DBE1')")
        div(class="bg-gray-5 pointer" @click="setBgColor('#EEEFF4')")
        div(class="bg-gray-6 pointer" @click="setBgColor('#ffffff')")
      property-bar
        input(class="body-2 text-gray-2" max="100" min="0" value="100" step="1")
        svg-icon(class="pointer"
          :iconName="'transparency'" :iconWidth="'20px'" :iconColor="'gray-2'")
    div(v-if="activeTab === 'Photos'" class="bg-setting__content")
      property-bar
        input(class="body-2 text-gray-2" max="100" min="0" value="100" step="1")
        svg-icon(class="pointer"
          :iconName="'transparency'" :iconWidth="'20px'" :iconColor="'gray-2'")
      div(class="bg-setting__grid")
        btn(class="full-width" :type="'primary-mid'") Replace
        btn(class="full-width" :type="'primary-mid'") Crop
        btn(class="full-width" :type="'primary-mid'") Filter
        btn(class="full-width" :type="'primary-mid'") Adjust
        btn(class="full-width" :type="'primary-mid'") BG Delete
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  components: {
    SearchBar
  },
  data() {
    return {
      activeTab: 'Colors',
      tabs: ['Colors', 'Photos']
    }
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    })
    // opacity: {
    //   get() {
    //     return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.opacity
    //   },
    //   set(value) {
    //     if (this.currSelectedInfo.layers.length === 1) {
    //       this.$store.commit('UPDATE_layerStyles', {
    //         pageIndex: this.lastSelectedPageIndex,
    //         layerIndex: this.currSelectedIndex,
    //         styles: {
    //           opacity: value
    //         }
    //       })
    //     } else {

    //     }
    //   }
    // }
  },
  methods: {
    ...mapMutations({
      updateLayerStyles: 'UPDATE_layerStyles',
      _setBgColor: 'SET_backgroundColor'
    }),
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    },
    toggleTab(tab: string) {
      this.activeTab = tab
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
.bg-setting {
  &__tabs {
    display: flex;
    > button {
      margin: 0px 5px;
    }
  }
  &__title {
  }
  > div:nth-child(n + 1) {
    margin-top: 15px;
  }
  &__content {
    > div:nth-child(n + 1) {
      margin-top: 15px;
    }
  }
  &__colors {
    display: flex;
    justify-content: space-between;
    > div {
      @include size(40px, 40px);
    }
  }
  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(3, 1fr);
    row-gap: 10px;
    column-gap: 20px;

    > button:nth-child(1) {
      grid-column-start: 1;
      grid-column-end: 3;
    }
  }
}
</style>
