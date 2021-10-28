<template lang="pug">
  div(class="scroll-list")
    div(v-if="prevIcon"
        class="scroll-list-move scroll-list-move-left"
        @click="handlePrev")
        div
          svg-icon(iconName="chevron-left" iconWidth="40px" iconColor="gray-3")
    div(v-if="nextIcon"
        class="scroll-list-move scroll-list-move-right"
        @click="handleNext")
        div
          svg-icon(iconName="chevron-right" iconWidth="40px" iconColor="gray-3")
    div(class="scroll-list-items" @scroll="handleScroll" ref="items")
      div(v-if="type === 'theme'"
        class="pointer scroll-list-plus")
        img(:src="require('@/assets/img/png/plus-origin.png')"
          @click="goToPage('Editor')")
        div(class="pt-10 body-1") 自訂尺寸
      div(v-for="item, idx in list" class="scroll-list-item pt-10"
        :class="{'pb-70': type === 'theme'}")
        img(class="pointer item-image"
          :src="type === 'theme' ? item.url : `https://template.vivipic.com/template/${item.id}/prev?ver=${item.ver}`"
          @click="goToPage('Editor')"
          @error="handleNotFound")
        div(v-if="type === 'theme'"
          class="pt-10 body-1") {{item.title}}
        div(v-if="type === 'theme'"
          class="pt-2 body-2 text-gray-2") {{item.description}}
</template>
<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    list: Array,
    type: String
  },
  data () {
    return {
      prevIcon: false,
      nextIcon: true
    }
  },
  computed: {
    items () {
      return this.$refs.items as HTMLElement
    }
  },
  methods: {
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    goToPage(pageName: string) {
      this.$router.push({ name: pageName })
    },
    handleNext () {
      const { scrollLeft, offsetWidth } = this.items
      this.items.scrollLeft = scrollLeft + (offsetWidth / 2)
    },
    handlePrev () {
      console.log('handlePrev')
      const { scrollLeft, offsetWidth } = this.items
      this.items.scrollLeft = scrollLeft - (offsetWidth / 2)
    },
    handleScroll (event: Event) {
      const { scrollLeft } = event.target as HTMLElement
      this.handleIconDisplay(scrollLeft)
    },
    handleIconDisplay (left = 0) {
      const { scrollWidth, offsetWidth } = this.items
      this.prevIcon = left > 0
      this.nextIcon = left < (scrollWidth - offsetWidth)
    }
  }
})
</script>
<style lang="scss" scoped>
.scroll-list {
  $this: &;
  position: relative;

  &-items {
    display: grid;
    column-gap: 30px;
    grid-template-columns: auto;
    justify-content: start;
    align-items: center;
    grid-auto-flow: column;
    scroll-behavior: smooth;
    overflow-x: scroll;
    overflow-y: hidden;
    text-align: left;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &-plus {
    width: 100px;
    text-align: center;

    @media(min-width: 976px) {
      width: 140px;
    }
    @media(min-width: 1260px) {
      width: 170px;
    }
    @media(min-width: 1560px) {
      width: 200px;
    }

    > img:hover {
      transition: all .2s ease-in-out;
      box-shadow: 5px 5px 10px 0 rgba(48, 55, 66, 0.15);
      transform: translate(0, -10px);
    }
  }

  &-item {
    width: 100px;
    height: 100px;
    text-align: center;

    @media(min-width: 976px) {
      width: 140px;
      height: 140px;
    }
    @media(min-width: 1260px) {
      width: 170px;
      height: 170px;
    }
    @media(min-width: 1560px) {
      width: 200px;
      height: 200px;
    }

    .item-image {
      border-radius: 10px;
      height: 100%;

      &:hover {
        transition: all .2s ease-in-out;
        box-shadow: 5px 5px 10px 0 rgba(48, 55, 66, 0.15);
        transform: translate(0, -10px);
      }
    }

    &-title {
      padding-top: 10px;
    }
  }

  &-icon {
    display: flex;
    background: #ffffff;
    border-radius: 50%;
    position: relative;
    box-shadow: 0px 3px 10px rgba(78, 171, 230, 0.3);
  }

  &-move {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    z-index: 1;
    cursor: pointer;

    &-left {
      left: -75px;
      #{$this}__icon {
        left: 3px;
      }
    }

    &-right {
      right: -75px;
      #{$this}__icon {
        right: 3px;
      }
    }
  }
}
</style>
