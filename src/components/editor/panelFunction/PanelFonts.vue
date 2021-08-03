<template lang="pug">
  div(class="panel-fonts")
    div(class="panel-fonts__title")
      span(class="text-blue-1 label-lg") Fonts
    search-bar(:placeholder="'Search font'")
    div(v-for="font in fontPreset"
        class="panel-fonts__font pointer"
        :style="{'font-family': font.face}"
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
import LayerUtils from '@/utils/layerUtils'
import FileUtils from '@/utils/fileUtils'
import TextUtils, { tmpFontsPreset } from '@/utils/textUtils'

export default Vue.extend({
  components: {
    SearchBar
  },
  data() {
    return {
      FileUtils,
      fontPreset: tmpFontsPreset
    }
  },
  computed: {
    ...mapState('text', ['sel', 'props']),
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
      TextUtils.onPropertyClick('fontFamily', font.face, this.sel.start, this.sel.end)
      TextUtils.updateTextPropsState({ font: font.name })
    },
    updateFontPreset(e: any) {
      const target = e.target.files[0]
      const fontName: string = target.name.split('.')[0]
      const objectUrl = window.URL.createObjectURL(target)
      const style = document.createElement('style')
      style.innerHTML = `
      @font-face {
        font-family: ${fontName};
        src: url(${objectUrl});
      }
    `
      document.head.appendChild(style)
      this.fontPreset.push({ name: fontName, face: fontName })
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
    font-size: 18px;
  }
  &__close {
    position: absolute;
    top: 0px;
    right: 0px;
  }
}
</style>
