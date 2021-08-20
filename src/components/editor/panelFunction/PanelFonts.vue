<template lang="pug">
  div(class="panel-fonts")
    div(class="panel-fonts__title")
      span(class="text-blue-1 label-lg") Fonts
    search-bar(:placeholder="'Search font'")
    div(v-for="category in content"
      :key="category.category_id"
      class="panel-fonts__items")
      category-font-item(v-for="item in category.list"
        class="panel-fonts__item"
        :key="item"
        :src="`${host}/${item}/${preview}`"
        :objectId="item"
        @init="fetchJson")
    div
      svg-icon(class="panel-fonts__close pointer"
        :iconName="'close'"
        :iconWidth="'30px'"
        :iconColor="'gray-2'"
        @click.native="closeFontsPanel")
              div(class="text-center")
    svg-icon(v-if="pending"
      :iconName="'loading'"
      :iconColor="'white'"
      :iconWidth="'20px'")
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
import CategoryFontItem from '@/components/category/CategoryFontItem.vue'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryFontItem
  },
  data() {
    return {
      FileUtils
    }
  },
  async mounted() {
    // if (this.props.font) {
    //   this.currFont = this.props.font
    // }
    console.log('font panel mounted')
    await this.$store.dispatch('font/getContent')
    console.log(this.content)
  },
  computed: {
    ...mapState(
      'font',
      [
        'categories',
        'content',
        'pending',
        'host',
        'preview',
        'keyword'
      ]
    ),
    ...mapState('text', ['sel', 'props', 'fontPreset']),
    ...mapGetters('font', ['hasNextPage']),
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    })
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
    },
    fetchJson (id: string) {
      this.$store.dispatch('font/getContentJson', id)
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
    }
    // styles(font: { name: string, face: string }) {
    //   return {
    //     'font-family': font.face,
    //     'background-color': this.currFont === font.name ? 'rgba(15, 40, 71, 0.14)' : '',
    //     'border-radius': this.currFont === font.name ? '5px' : ''
    //   }
    // }
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
  &__items {
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: auto;
    grid-gap: 10px;
    margin-left: auto;
  }
  &__item {
  // width:%;
  height: 30px;
  object-fit: contain;
  }
}
</style>
