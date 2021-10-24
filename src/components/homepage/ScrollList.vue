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
      div(v-for="item, idx in list" class="scroll-list-item")
        img(class="pointer"
        :src="`https://template.vivipic.com/template/${item.id}/prev?ver=${item.ver}`"
        @click="goToPage('Editor')"
        @error="handleNotFound")
</template>
<script lang="ts">
import Vue from 'vue'
// import { mapMutations } from 'vuex'

export default Vue.extend({
  props: {
    list: Array
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
    grid-auto-flow: column;
    scroll-behavior: smooth;
    overflow-x: scroll;
    overflow-y: hidden;
    text-align: left;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &-item {
    width: 100px;
    height: 100px;
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

    > img {
      width: 100%;
      height: 100%;
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
