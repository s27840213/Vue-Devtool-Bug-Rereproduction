<template lang="pug">
div(class="category-object-card" @click="$emit('cardClick', $event)")
  img(class="category-object-card__cover" :src="coverSrc(coverUrl)" :style="coverStyles" @error="imgOnerror")
  div(class="category-object-card__label")
    div(class="category-object-card__label__title caption-MD") {{ title }}
    svg-icon(v-if="isFavorite !== undefined"
      :iconName="isFavorite ? 'favorites-fill' : 'heart'"
      iconWidth="24px"
      :style="{color: isFavorite ? '#FC5757' : '#9C9C9C'}"
        @click="$emit('favClick', $event)")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  emits: ['cardClick', 'favClick'],
  props: {
    title: {
      type: String,
      required: true
    },
    isFavorite: {
      type: Boolean,
      required: true
    },
    coverUrl: {
      type: String,
      default: ''
    },
    scrollTop: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      fallbackSrc: require('@/assets/img/svg/image-preview.svg'),
      coverPos: 50
    }
  },
  mounted() {
    this.handleScroll()
  },
  watch: {
    scrollTop() {
      this.handleScroll()
    }
  },
  computed: {
    scrollableParent() {
      const grandGrandParent = this.$el.parentElement.parentElement.parentElement as HTMLElement
      return grandGrandParent && grandGrandParent.classList.contains('vue-recycle-scroller')
        ? grandGrandParent
        : undefined
    },
    coverStyles() {
      return {
        'object-position': `center ${this.coverPos}%`
      }
    },
  },
  methods: {
    coverSrc(coverUrl: string): string {
      const prevType = 'prev_4x'
      return coverUrl ? [coverUrl, prevType].join('/') : this.fallbackSrc
    },
    imgOnerror(e: Event) {
      const target = (e.target as HTMLImageElement)
      target.src = this.fallbackSrc
    },
    translateY() {
      const transform = this.$el.parentElement.style.transform
      const match = transform.match(/translateY\((\d+(?:[.]\d*?)?)px\)/)
      if (!match || match.length < 2) return 0
      return parseFloat(match[1])
    },
    handleScroll() {
      if (!this.scrollableParent) return
      const cardOffsetTop = this.$el.parentElement.parentElement.offsetTop
      const scrollPos = this.translateY() - (this.scrollTop - cardOffsetTop)
      this.coverPos = ((scrollPos + this.$el.clientHeight * 0.5) / this.scrollableParent.clientHeight) * 100
    }
  }
})
</script>

<style lang="scss" scoped>
.category-object-card {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  overflow: hidden;
  &__cover {
    @include size(100%, 100%);
    object-fit: cover;
    object-position: center center;
  }
  &__label {
    display: flex;
    column-gap: 10px;
    position: absolute;
    right: 10px;
    bottom: 10px;
    &__title {
      color: white;
      // mix-blend-mode: difference;
    }
  }
}
</style>
