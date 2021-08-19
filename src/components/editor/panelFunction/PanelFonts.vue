<template lang="pug">
  div(class="panel-fonts")
    div(class="panel-fonts__title")
      span(class="text-blue-1 label-lg") Fonts
    search-bar(:placeholder="'Search font'")
    div(v-for="font in fontPreset"
        class="panel-fonts__font pointer"
        :style="styles(font)"
        @click="setFont(font)")
      span {{font.name}}
    div
      svg-icon(class="panel-fonts__close pointer"
        :iconName="'close'"
        :iconWidth="'30px'"
        :iconColor="'gray-2'"
        @click.native="closeFontsPanel")
    btn(class="full-width" :type="'primary-mid'" @click.native="FileUtils.importFont(updateFontPreset)") Upload Font
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapState } from 'vuex'
import FileUtils from '@/utils/fileUtils'
import TextUtils from '@/utils/textUtils'
import TextPropUTils from '@/utils/textPropUtils'

export default Vue.extend({
  components: {
    SearchBar
  },
  data() {
    return {
      FileUtils,
      currFont: ''
    }
  },
  mounted() {
    if (this.props.font) {
      this.currFont = this.props.font
    }
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'fontPreset']),
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    }),
    layerFont(): string {
      return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.font
    }
  },
  methods: {
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    },
    closeFontsPanel() {
      this.$emit('closeFontsPanel')
    },
    setFont(font: { name: string, face: string }) {
      TextPropUTils.onPropertyClick('fontFamily', font.face, this.sel.start, this.sel.end)
      TextPropUTils.updateTextPropsState({ font: font.name })
      this.currFont = font.name
    },
    updateFontPreset(e: any) {
    //   const target = e.target.files[0]
    //   const fontName: string = target.name.split('.')[0]
    //   const objectUrl = window.URL.createObjectURL(target)
    //   const style = document.createElement('style')
    //   style.innerHTML = `
    //   @font-face {
    //     font-family: ${fontName};
    //     src: url(${objectUrl});
    //   }
    // `
    //   document.head.appendChild(style)
    //   this.fontPreset.push({ name: fontName, face: fontName })
    },
    styles(font: { name: string, face: string }) {
      return {
        'font-family': font.face,
        'background-color': this.currFont === font.name ? 'rgba(15, 40, 71, 0.14)' : '',
        'border-radius': this.currFont === font.name ? '5px' : ''
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-fonts {
  text-align: left;
  position: relative;
  &__title {
    text-align: center;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }
  &__font {
    transition: background-color .1s linear;
    font-size: 18px;
    padding: 5px;
    > span {
      display: inline-block;
    }
  }
  &__close {
    position: absolute;
    top: 0px;
    right: 0px;
  }
}
</style>
