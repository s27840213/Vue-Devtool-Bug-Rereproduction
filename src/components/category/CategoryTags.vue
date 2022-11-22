<template lang="pug">
div(class="category-tags")
  div(v-if="prevIcon"
    class="category-tags__move category-row__move--left"
    @click="handlePrev")
    div(class="category-tags__icon")
      svg-icon(iconName="arrow-left" iconWidth="20px" iconColor="gray-1")
  div(v-if="nextIcon"
    class="category-tags__move category-tags__move--right"
    @click="handleNext")
    div(class="category-tags__icon")
      svg-icon(iconName="arrow-right" iconWidth="20px" iconColor="gray-1")
  div(class="category-tags__items" ref="items" @scroll.passive="handleScroll")
    div(class="category-tags__tag") Women’s day
    div(class="category-tags__tag") Spring
    div(class="category-tags__tag") birthday
    div(class="category-tags__tag") taiwan
    div(class="category-tags__tag") okkk
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  computed: {
    items () {
      return this.$refs.items as HTMLElement
    }
  },
  data () {
    return {
      prevIcon: true,
      nextIcon: true
    }
  },
  mounted () {
    this.handleIconDisplay()
  },
  methods: {
    handleNext () {
      const { scrollLeft, offsetWidth } = this.items
      this.items.scrollLeft = scrollLeft + offsetWidth
    },
    handlePrev () {
      const { scrollLeft, offsetWidth } = this.items
      this.items.scrollLeft = scrollLeft - offsetWidth
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
  .category-tags {
    $this: &;
    position: relative;
    &__items {
      overflow: scroll;
      display: grid;
      column-gap: 5px;
      grid-template-columns: auto;
      grid-auto-flow: column;
      scroll-behavior: smooth;
      @include no-scrollbar;
    }
    &__icon {
      display: flex;
      background: #ffffff;
      border-radius: 50%;
      position: relative;
      box-shadow: 0px 3px 10px rgba(78, 171, 230, 0.3);
    }
    &__tag {
      white-space: nowrap;
      padding: 4px 10px;
      border-radius: 16px;
      border: 1px solid #E0E0E0;
      color: setColor(gray-2);
      cursor: pointer;
    }
    &__move {
      position: absolute;
      top: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      z-index: 1;
      cursor: pointer;
      // background-color: setColor(gray-4);
      &--left {
        left: -1px;
        background: linear-gradient(90deg, #FFFFFF 22%, rgba(255, 255, 255, 0) 85%);
        #{$this}__icon {
          left: 3px;
        }
      }
      &--right {
        right: -1px;
        background: linear-gradient(270deg, #FFFFFF 22%, rgba(255, 255, 255, 0) 85%);
        #{$this}__icon {
          right: 3px;
        }
      }
    }
  }
</style>
