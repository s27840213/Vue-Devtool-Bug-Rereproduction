<template lang="pug">
div(class="category-row")
  div(class="category-row__items" ref="items" :style="itemsStyles" @scroll.passive="handleScroll")
    slot
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  props: {
    gap: {
      type: Number,
      default: 10
    }
  },
  computed: {
    items(): HTMLElement {
      return this.$refs.items as HTMLElement
    },
    itemsStyles(): {[key: string]: string} {
      return {
        columnGap: this.gap + 'px'
      }
    }
  },
  data() {
    return {
      prevIcon: true,
      nextIcon: true
    }
  },
  mounted() {
    this.handleIconDisplay()
  },
  methods: {
    handleScroll(event: Event) {
      const { scrollLeft } = event.target as HTMLElement
      this.handleIconDisplay(scrollLeft)
    },
    handleIconDisplay(left = 0) {
      const { scrollWidth, offsetWidth } = this.items
      this.prevIcon = left > 0
      this.nextIcon = left < (scrollWidth - offsetWidth) && scrollWidth > offsetWidth
    }
  }
})
</script>

<style lang="scss" scoped>
.category-row {
  $this: &;
  position: relative;
  &__items {
    overflow: scroll;
    display: grid;
    column-gap: 10px;
    grid-template-columns: auto;
    justify-content: start;
    grid-auto-flow: column;
    scroll-behavior: smooth;
    text-align: left;
    @include no-scrollbar;
  }
  &__icon {
    display: flex;
    background: #ffffff;
    border-radius: 50%;
    position: relative;
    box-shadow: 0px 3px 10px rgba(78, 171, 230, 0.3);
    width: 20px;
  }
  &__move {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    z-index: 1;
    transform: translateZ(1px); // Fix ios safari z-index issue. https://stackoverflow.com/a/19572572
    cursor: pointer;
    // background-color: setColor(gray-4);
    &--left {
      left: -1px;
      background: linear-gradient(
        90deg,
        #202020 23.91%,
        rgba(32, 32, 32, 0) 104.35%
      );
      #{$this}__icon {
        left: 3px;
      }
    }
    &--right {
      right: -1px;
      background: linear-gradient(
        270deg,
        #202020 23.91%,
        rgba(32, 32, 32, 0) 104.35%
      );
      #{$this}__icon {
        right: 3px;
      }
    }
  }
}
</style>
