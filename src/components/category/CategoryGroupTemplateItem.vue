<template lang="pug">
div(class="category-template-item" @click="handleClickGroup")
  image-carousel(
    :imgs="groupImages"
    :speed="2000"
    @change="handleCarouselIdx")
    template(v-slot="{ url }")
      img(class="category-template-item__img"
          :src="fallbackSrc || url"
          @error="handleNotFound")
  span(class="category-template-item__index") {{ carouselIdx + 1 }}/{{ item.content_ids.length }}
  pro-item(v-if="item.plan")
</template>

<script lang="ts">
import ImageCarousel from '@/components/global/ImageCarousel.vue'
import ProItem from '@/components/payment/ProItem.vue'
import { defineComponent } from 'vue'

export default defineComponent({
  emits: ['clickGroupItem'],
  components: {
    ImageCarousel,
    ProItem
  },
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      showCarousel: false,
      carouselIdx: 0,
      fallbackSrc: '',
      isHover: false,
      waitTimer: 0 as number,
      renderedWidth: 120,
      renderedHeight: 120
    }
  },
  mounted () {
    const preImg = new Image()
    preImg.src = this.groupImages[0]
    this.handleCarouse()
  },
  computed: {
    groupImages (): string[] {
      return this.item.content_ids.map((content: any) => `https://template.vivipic.com/template/${content.id}/prev_2x?ver=${content.ver}`)
    }
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    handleCarouselIdx (idx: number) {
      this.carouselIdx = idx
    },
    handleClickGroup () {
      this.$emit('clickGroupItem', this.item)
    },
    handleCarouse() {
      this.getRenderedSize()
      this.isHover = true
      this.waitTimer = window.setInterval(() => {
        if (this.isHover) {
          this.showCarousel = true
        }
      }, 100)
    },
    getRenderedSize(): boolean {
      const elContainer = this.$el as HTMLElement
      if (!elContainer) return false
      this.renderedWidth = elContainer.clientWidth
      this.renderedHeight = elContainer.clientHeight
      return true
    }
  }
})
</script>

<style lang="scss" scoped>
  .category-template-item {
    @include size(100%);
    position: relative;
    border-radius: 5px;
    overflow: hidden;
    &__img {
      @include size(v-bind("`${renderedWidth}px`"), v-bind("`${renderedHeight}px`"));
      object-fit: contain;
      vertical-align: top;
      pointer-events: none;
    }
    &__index {
      position: absolute;
      bottom: 2px;
      right: 4px;
      font-size: 20px;
      color: #ffffff;
      padding: 4px 8px;
      width: 70px;
      border-radius: 20px;
      box-sizing: border-box;
      background: rgba(24, 25, 31, 0.7);
      transform: scale(0.4);
      transform-origin: bottom right;
    }
  }
</style>
