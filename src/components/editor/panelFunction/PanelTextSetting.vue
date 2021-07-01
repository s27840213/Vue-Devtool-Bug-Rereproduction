<template lang="pug">
  div(class="text-setting")
    span(class="text-setting__title text-blue-1 label-lg") Text Setting
    property-bar(class="pointer" @click.native="openFontsPanel")
      span(class="body-2 text-gray-2") {{ fontFamily }}
      svg-icon(class="pointer"
        :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
    div(class="text-setting__row2")
      property-bar
        input(class="body-2 text-gray-2" type="text" @mousedown="fontSizeInput" v-model="fontSize")
        div(class="text-setting__font-stepper")
          svg-icon(class="pointer" @mousedown.native="fontSizeStepping(2)"
            :iconName="'chevron-up'" :iconColor="'gray-2'" :iconWidth="'9px'")
          svg-icon(class="pointer" @mousedown.native="fontSizeStepping(-2)"
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
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown.native="onPropertyClick(icon)")
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font-align')"
        :key="`gp-action-icon-${index}`"
        class="pointer"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown.native="onPropertyClick(icon)")
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
import store from '@/store'
import { IText } from '@/interfaces/layer'
import GeneralUtils from '@/utils/generalUtils'

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
      ],
      selection: {
        start: {
          sIndex: 0,
          pIndex: 0,
          offset: 0
        },
        end: {
          sIndex: 0,
          pIndex: 0,
          offset: 0
        }
      },
      fontFamily: '',
      size: '--'
    }
  },
  mounted() {
    this.$root.$on('textSelection', (selectRange: boolean) => {
      const font = TextUtils.propReader('fontFamily')
      this.fontFamily = typeof font !== 'undefined' ? font : 'multi-fonts'
      const size = TextUtils.propReader('fontSize')
      this.size = typeof size !== 'undefined' ? size : '--'
    })
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
        // return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.font
        const font = TextUtils.propReader('fontFamily')
        return typeof font !== 'undefined' ? font : 'multi-fonts'
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
      get(): string {
        return this.size
        // return Math.round(this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.size)
      },
      set(value) {
        TextUtils.onPropertyClick('fontSize', value as string, this.selection.start, this.selection.end)
        // if (typeof value === 'string') {
        //   const step = this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.size - parseInt(value)
        //   TextUtils.fontSizeStepping(step)
        // }
      }
    },
    textColor: {
      get(): string {
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
    },
    lineHeight: {
      get(): number {
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
        TextUtils.updateLayerSize()
      }
    },
    fontSpacing: {
      get(): number {
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
        TextUtils.updateLayerSize()
      }
    },
    opacity: {
      get(): number {
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
      // TextUtils.fontSizeStepping(step)
      // used for test, need to refresh and direct update to vuex
      const sel = TextUtils.getSelection()
      console.log(sel)
      if (sel) {
        Object.assign(this.selection.start, sel.start)
        Object.assign(this.selection.end, sel.end)
      }
      setTimeout(() => {
        const select = window.getSelection()
        if (select) {
          const range = new Range()
          const node = sel?.div.childNodes[sel.start.pIndex].childNodes[sel.start.sIndex].firstChild as Node
          range.setStart(node, sel?.start.offset as number)
          const start = {
            pIndex: parseInt(range?.startContainer?.parentElement?.parentElement?.dataset.pindex as string),
            sIndex: parseInt(range?.startContainer?.parentElement?.dataset.sindex as string),
            offset: range?.startOffset as number
          }
          select.removeAllRanges()
          select.addRange(range)

          const config = (this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex) as IText)
          const fontSize = config.paragraphs[start.pIndex].spans[start.sIndex].styles.size
          this.updateLayerParagraphs(this.lastSelectedPageIndex, this.currSelectedIndex, start.pIndex, start.sIndex, { size: Math.ceil(fontSize + step) })
          this.size = `${Math.ceil(fontSize + step)}px`
        }
      }, 0)
    },
    fontSizeInput() {
      const sel = TextUtils.getSelection()
      if (sel) {
        Object.assign(this.selection.start, sel.start)
        Object.assign(this.selection.end, sel.end)
      }
      console.log(this.selection)
    },
    updateLayerParagraphs(pageIndex: number, layerIndex: number, pIndex: number, sIndex: number, props: { [key: string]: string | number }) {
      // couldn't work still, need to re-organize the structure of the update logic
      const config = this.getLayer(pageIndex, layerIndex) as IText
      const paragraphs = GeneralUtils.deepCopy(config.paragraphs)
      Object.assign(paragraphs[pIndex].spans[sIndex].styles, props)
      store.commit('UPDATE_layerProps', {
        pageIndex,
        layerIndex,
        props: { paragraphs }
      })
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
