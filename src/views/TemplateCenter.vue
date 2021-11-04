<template lang="pug">
  div(class="template-center"
      @scroll="handleScroll")
    nu-header(:noSearchbar="true" :noNavigation="snapToTop")
      transition(name="slide")
        search-bar(v-if="snapToTop"
                :style="absoluteSearchbarStyles()"
                class="template-center__absolute-searchbar"
                :clear="true"
                placeholder="Search from our templates"
                fontFamily="Mulish")
    div(class="template-center__search-container")
      div(class="template-center__search")
        div(class="template-center__search__title")
          span 選擇一個心儀的模板著手設計吧！
        div(class="template-center__search__text")
          span 特別設計過的電商模板能讓您簡單又快速的做出電商所需要的圖片。
          br
          span 沒有設計底子也沒問題！只需要輕鬆點擊幾下，一張專屬於品牌的精美圖片馬上出爐！
        search-bar(ref="searchbar"
                  class="template-center__search__searchbar"
                  :style="searchbarStyles()"
                  :clear="true"
                  placeholder="Search from our templates"
                  fontFamily="Mulish")
    div(class="template-center__content")
    nu-footer
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import NuHeader from '@/components/NuHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import NuFooter from '@/components/NuFooter.vue'

export default Vue.extend({
  name: 'MyDesgin',
  components: {
    NuHeader,
    SearchBar,
    NuFooter
  },
  data() {
    return {
      snapToTop: false,
      searchbarTop: 0
    }
  },
  computed: {
    // ...mapGetters('design', {
    //   currLocation: 'getCurrLocation',
    //   folders: 'getFolders',
    //   selectedDesigns: 'getSelectedDesigns',
    //   selectedFolders: 'getSelectedFolders'
    // }),
  },
  methods: {
    // ...mapMutations('design', {
    //   addToSelection: 'UPDATE_addToSelection',
    //   removeFromSelection: 'UPDATE_removeFromSelection',
    //   addFolderToSelection: 'UPDATE_addFolderToSelection',
    //   removeFolderFromSelection: 'UPDATE_removeFolderFromSelection',
    //   clearSelection: 'UPDATE_clearSelection',
    //   setCurrLocation: 'SET_currLocation'
    // }),
    absoluteSearchbarStyles() {
      return { top: `${Math.max(this.searchbarTop, 5)}px` }
    },
    searchbarStyles() {
      return this.snapToTop ? { opacity: 0, pointerEvents: 'none' } : {}
    },
    handleScroll() {
      const searchbar = (this.$refs.searchbar as any).$el as HTMLElement
      this.snapToTop = searchbar.getBoundingClientRect().top <= 50
      this.searchbarTop = searchbar.getBoundingClientRect().top
    }
  }
})
</script>

<style lang="scss" scoped>
.template-center {
  @include size(100%, 100%);
  min-height: 100%;
  overflow-y: auto;
  &__absolute-searchbar {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 480px;
    height: 40px;
    border-radius: 3px;
    z-index: 1000;
  }
  &__search-container {
    position: relative;
    width: 100%;
    padding-top: 28%;
    background-size: cover;
    background-position: center center;
    background-image: url('~@/assets/img/jpg/templates/search_background.jpeg');
  }
  &__search {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: fit-content;
    height: 55%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    &__title {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 40px;
      > span {
        font-family: "NotoSansTC";
        font-weight: 700;
        font-size: 40px;
        line-height: 40px;
        letter-spacing: 0.255em;
        text-indent: 0.255em;
        display: block;
        color: #373F41;
      }
    }
    &__text {
      height: 52px;
      > span {
        font-family: Mulish;
        font-weight: 400;
        font-size: 16px;
        line-height: 26px;
        color: white;
      }
    }
    &__searchbar {
      width: 480px;
      height: 40px;
      border-radius: 3px;
    }
  }
  &__content {
    min-height: 100%;
  }
}
</style>
