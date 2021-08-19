<template lang="pug">
  div(class="panel-bg")
    search-bar(class="mb-15"
      placeholder="Search background"
      @search="handleSearch")
    div(class="panel-bg__content")
      div(class="text-left py-5 text-white") Color
      div(class="panel-bg__colors mb-15")
        color-picker(v-if="openColorPicker"
          class="panel-bg__color-picker"
          v-click-outside="handleColorPicker"
          currentColor="#ffffff"
          @update="setBgColor")
        div(class="panel-bg__color"
          @click="handleColorPicker")
          svg-icon(iconName="rainbow")
        div(v-for="color in defaultBgColor"
          class="panel-bg__color"
          :style="colorStyles(color)"
          @click="setBgColor(color)")
        div(class="panel-bg__color"
          @click="setBgColor('#ffffff00')")
          svg-icon(iconName="transparent")
      div(v-for="category in content"
        :key="category.category_id"
        class="panel-bg__items")
        category-background-item(v-for="item in category.list"
          class="panel-bg__item"
          :key="item"
          :src="`${host}/${item}/${preview}`"
          :objectId="item")
      div(class="text-center")
        svg-icon(v-if="pending"
          :iconName="'loading'"
          :iconColor="'white'"
          :iconWidth="'20px'")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations, mapGetters, mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListColumn from '@/components/category/CategoryListColumn.vue'
import CategoryBackgroundItem from '@/components/category/CategoryBackgroundItem.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import vClickOutside from 'v-click-outside'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryListColumn,
    CategoryBackgroundItem,
    ColorPicker
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      openColorPicker: false
    }
  },
  computed: {
    ...mapState(
      'background',
      [
        'content',
        'pending',
        'host',
        'preview'
      ]
    ),
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      defaultBgColor: 'color/getDefaultBgColor'
    })
  },
  mounted() {
    this.$store.dispatch('background/getContent')
  },
  methods: {
    ...mapMutations({
      _setBgColor: 'SET_backgroundColor'
    }),
    colorStyles(color: string) {
      return {
        backgroundColor: color
      }
    },
    setBgColor(color: string) {
      this._setBgColor({
        pageIndex: this.lastSelectedPageIndex,
        color: color
      })
      // this.setIsColorPickerOpened(true)
    },
    handleSearch() {
      // this.$store.dispatch('templates/getContent')
    },
    handleColorPicker() {
      this.openColorPicker = !this.openColorPicker
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-bg {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  &__color-picker {
    position: absolute;
    z-index: 2;
    top: 40px;
    left: 40px;
  }
  &__colors {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    column-gap: 8px;
    row-gap: 10px;
    position: relative;
  }
  &__color {
    @include size(clamp(40px, 2vw, 50px), clamp(40px, 2vw, 50px));
    border: 1px solid setColor(gray-4);
    border-radius: 4px;
    cursor: pointer;
    position: relative;
  }
  &__content {
    flex: 1;
    margin-right: -10px;
    overflow-y: scroll;
    overflow-x: hidden;
    scrollbar-width: thin;
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
      background-color: unset;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 5px;
      visibility: hidden;
      background-color: #d9dbe1;
      border: 3px solid #2c2f43;
    }
    &:hover {
      &::-webkit-scrollbar-thumb {
        visibility: visible;
      }
    }
  }
  &__item {
    width: 145px;
    height: 145px;
    object-fit: cover;
    vertical-align: middle;
  }
  &__items {
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 10px;
  }
}
</style>
