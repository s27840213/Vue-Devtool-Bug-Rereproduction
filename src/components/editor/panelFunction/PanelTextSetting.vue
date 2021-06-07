<template lang="pug">
  div(class="text-setting")
    span(class="text-setting__title text-blue-1 label-lg") Text Setting
    property-bar(class="pointer" @click.native="openFontsPanel")
      span(class="body-2 text-gray-2") {{textFont}}
      svg-icon(class="pointer"
        :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
    div(class="text-setting__row2")
      property-bar
        input(class="body-2 text-gray-2" type="number" v-model="fontSize")
        div(class="text-setting__font-stepper")
          svg-icon(class="pointer" @click.native="fontSizeStepping(2)"
            :iconName="'chevron-up'" :iconColor="'gray-2'" :iconWidth="'9px'")
          svg-icon(class="pointer" @click.native="fontSizeStepping(-2)"
            :iconName="'chevron-down'" :iconColor="'gray-2'" :iconWidth="'14px'")
        //- svg-icon(class="pointer"
        //-   :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
      div(class="text-setting__color-picker")
        div(class="color-slip"
          :style="{'background-color': textColor}")
        div(class="full-width text-left ml-10")
          input(class="body-2 text-gray-2" v-model="textColor")
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font')"
        :key="`gp-action-icon-${index}`"
        class="pointer"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @click.native="onPropertyClick(icon)")
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font-align')"
        :key="`gp-action-icon-${index}`"
        class="pointer"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @click.native="onPropertyClick(icon)")
    div(class="text-setting__row5")
      property-bar
        input(class="body-2 text-gray-2" type="number" v-model="lineHeight")
        svg-icon(class="pointer"
          :iconName="'font-height'" :iconWidth="'20px'" :iconColor="'gray-2'")
      property-bar
        input(class="body-2 text-gray-2" type="number" v-model="fontSpacing")
        svg-icon(class="pointer"
          :iconName="'font-spacing'" :iconWidth="'20px'" :iconColor="'gray-2'")
      property-bar
        input(class="body-2 text-gray-2" type="number" v-model="opacity")
        svg-icon(class="pointer"
          :iconName="'transparency'" :iconWidth="'20px'" :iconColor="'gray-2'")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters } from 'vuex'
import TextUtils from '@/utils/textUtils'

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
    textFont: {
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
    fontSize: {
      get() {
        return Math.round(this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.size)
      },
      set(value) {
        this.$store.commit('UPDATE_layerStyles', {
          pageIndex: this.lastSelectedPageIndex,
          layerIndex: this.currSelectedIndex,
          styles: {
            size: value
          }
        })
        if (typeof value === 'string') {
          const step = this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.size - parseInt(value)
          TextUtils.fontSizeStepping(step)
        }
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
            size: value
          }
        })
      }
    },
    lineHeight: {
      get() {
        const value = this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.lineHeight
        return value === -1 ? -1 : value * 1000
      },
      set(value) {
        this.$store.commit('UPDATE_layerStyles', {
          pageIndex: this.lastSelectedPageIndex,
          layerIndex: this.currSelectedIndex,
          styles: {
            lineHeight: typeof value === 'string' ? parseInt(value) / 1000 : value
          }
        })
      }
    },
    fontSpacing: {
      get() {
        return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.fontSpacing * 1000
      },
      set(value) {
        this.$store.commit('UPDATE_layerStyles', {
          pageIndex: this.lastSelectedPageIndex,
          layerIndex: this.currSelectedIndex,
          styles: {
            fontSpacing: typeof value === 'string' ? parseInt(value) / 1000 : value
          }
        })
      }
    },
    opacity: {
      get() {
        return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.opacity
      },
      set(value) {
        this.$store.commit('UPDATE_layerStyles', {
          pageIndex: this.lastSelectedPageIndex,
          layerIndex: this.currSelectedIndex,
          styles: {
            opacity: value
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
    },
    onPropertyClick(iconName: string) {
      TextUtils.onPropertyClick(iconName)
    },
    fontSizeStepping(step: number) {
      TextUtils.fontSizeStepping(step)
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
  &__font-stepper {
    display: flex;
    flex-direction: column;
  }
}
.color-slip {
  height: 100%;
  width: 40%;
}
</style>
