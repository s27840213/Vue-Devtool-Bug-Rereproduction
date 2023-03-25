<template lang="pug">
img(class="category-text-item__img" :class="{'no-bg': prevSrc && !fallbackSrc}"
  :src="src || fallbackSrc || prevSrc || bgPrevSrc"
  @error="handleNotFound"
  @load="isLoaded = true")
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  emits: [],
  props: {
    src: {
      type: String
    },
    item: {
      type: Object as PropType<any>,
      required: true
    },
    itemWidth: {
      type: Number,
      default: NaN
    }
  },
  data() {
    return {
      bgPrevSrc: `https://template.vivipic.com/text/${this.item.id}/bg_prev_2x?ver=${this.item.ver}`,
      prevSrc: '',
      fallbackSrc: '',
      isLoaded: false
    }
  },
  computed: {
    visibility(): string {
      return this.isLoaded ? 'visible' : 'hidden'
    }
  },
  methods: {
    handleNotFound() {
      if (!this.prevSrc) this.prevSrc = `https://template.vivipic.com/text/${this.item.id}/prev_2x?ver=${this.item.ver}`
      else this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    }
  }
})
</script>

<style lang="scss" scoped>
img {
  @include size(100%, 100%);
  object-position: center center;
  object-fit: contain;
  visibility: v-bind(visibility);
  &.no-bg{
    @include size(75%, 75%);
  }
}
</style>
