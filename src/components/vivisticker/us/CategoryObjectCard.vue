<template lang="pug">
div(v-show="isShow" class="category-object-card" @click="$emit('cardClick', $event)")
  img(class="category-object-card__cover" :src="coverSrc" :style="coverStyles" @load="isShow = true" @error="imgOnerror")
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
      coverPos: 50,
      isShow: false
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
    elRecycleScrollerView(): HTMLElement | null {
      return (this.$el as HTMLElement).closest('.vue-recycle-scroller__item-view')
    },
    elRecycleScrollerWrapper(): HTMLElement | null {
      return this.elRecycleScrollerView?.parentElement ?? null
    },
    elRecycleScroller(): HTMLElement | null {
      return this.elRecycleScrollerWrapper?.parentElement ?? null
    },
    coverSrc(): string {
      const prevType = 'prev_4x'
      return this.coverUrl ? [this.coverUrl, prevType].join('/') : this.fallbackSrc
    },
    coverStyles() {
      return {
        'object-position': `center ${this.coverPos}%`
      }
    },
  },
  methods: {
    imgOnerror(e: Event) {
      const target = (e.target as HTMLImageElement)
      target.src = this.fallbackSrc
      this.isShow = true
    },
    translateY(): number {
      if (!this.elRecycleScrollerView) return 0
      const transform = this.elRecycleScrollerView.style.transform
      const match = transform.match(/translateY\((\d+(?:[.]\d*?)?)px\)/)
      if (!match || match.length < 2) return 0
      return parseFloat(match[1])
    },
    handleScroll() {
      if (!this.elRecycleScroller) return
      const cardOffsetTop = this.elRecycleScrollerWrapper?.offsetTop ?? 0
      const scrollPos = this.translateY() - (this.scrollTop - cardOffsetTop)
      this.coverPos = (scrollPos / (this.elRecycleScroller.clientHeight - this.$el.clientHeight)) * 100
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
  position: relative;
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
