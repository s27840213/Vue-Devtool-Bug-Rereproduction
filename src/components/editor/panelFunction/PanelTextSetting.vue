<template lang="pug">
  div(class="text-setting")
    span(class="text-setting__title text-blue-1 label-lg") Text Setting
    property-bar(class="pointer" @click.native="openFontsPanel")
      span(class="body-2 text-gray-2") {{layerFont}}
      svg-icon(class="pointer"
        :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
    div(class="text-setting__row2")
      property-bar
        span(class="body-2 text-gray-2") 40
        svg-icon(class="pointer"
          :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
      div(class="text-setting__color-picker")
        div(class="color-slip"
          :style="{'background-color': textColor}")
        div(class="full-width text-left ml-10")
          input(class="body-2 text-gray-2" v-model="textColor")
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font')"
        :key="`gp-action-icon-${index}`"
        class="pointer"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'")
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font-align')"
        :key="`gp-action-icon-${index}`"
        class="pointer"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'")
    div(class="text-setting__row5")
      property-bar
        span(class="body-2 text-gray-2") 40
        svg-icon(class="pointer"
          :iconName="'font-height'" :iconWidth="'20px'" :iconColor="'gray-2'")
      property-bar
        span(class="body-2 text-gray-2") 10%
        svg-icon(class="pointer"
          :iconName="'font-spacing'" :iconWidth="'20px'" :iconColor="'gray-2'")
      property-bar
        span(class="body-2 text-gray-2") 100
        svg-icon(class="pointer"
          :iconName="'transparency'" :iconWidth="'20px'" :iconColor="'gray-2'")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters } from 'vuex'

export default Vue.extend({
  components: {
    SearchBar
  },
  data() {
    return {
      fontPreset: [
        'sans-serif',
        'Manrop',
        'Lobster'
      ]
    }
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    }),
    layerFont: {
      get() {
        return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.font
      },
      set(value) {
        this.$store.commit('UPDATE_layerStyles', {
          pageIndex: this.lastSelectedPageIndex,
          layerIndex: this.currSelectedIndex,
          styles: {
            font: value
          }
        })
      }
    },
    textColor: {
      get() {
        return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.color
      },
      set(value) {
        this.$store.commit('UPDATE_layerStyles', {
          pageIndex: this.lastSelectedPageIndex,
          layerIndex: this.currSelectedIndex,
          styles: {
            color: value
          }
        })
      }
    }
  },
  methods: {
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    },
    openFontsPanel() {
      this.$emit('openFontsPanel')
    }
  }
})
</script>

<style lang="scss" scoped>
.text-setting {
  text-align: left;
  &__title {
    margin-bottom: 30px;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }

  &__row2 {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 2fr 3fr;
    column-gap: 20px;
  }
  &__row5 {
    display: grid;
    grid-template-rows: auto auto;
    grid-template-columns: 1fr 1fr;
    row-gap: 10px;
    column-gap: 20px;
  }
  &__color-picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid setColor(gray-4);
    border-radius: 3px;
  }
}
.color-slip {
  height: 100%;
  width: 40%;
}
</style>
