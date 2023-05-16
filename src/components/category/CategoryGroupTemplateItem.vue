<template lang="pug">
div(class="category-template-item" @click="handleClickGroup")
  div(class="relative pointer"
    @mouseover="() => !noCarousel && handleCarouse()"
    @mouseleave="!noCarousel && stopCarouse()")
    image-carousel(v-if="!noCarousel && showCarousel"
      :imgs="groupImages"
      @change="handleCarouselIdx")
      template(v-slot="{ url }")
        img(:src="url" class="category-template-item__img")
    img(v-else
      class="category-template-item__img pointer"
      :src="fallbackSrc || previewImage"
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
    },
    noCarousel: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      showCarousel: false,
      carouselIdx: 0,
      fallbackSrc: '',
      isHover: false,
      waitTimer: 0 as number
    }
  },
  mounted () {
    const preImg = new Image()
    preImg.src = this.groupImages[0]
  },
  computed: {
    groupImages (): string[] {
      return this.item.content_ids.map((content: any) => `https://template.vivipic.com/template/${content.id}/prev_2x?ver=${content.ver}`)
    },
    previewImage (): string {
      const { match_cover: cover, ver, id } = this.item
      return `https://template.vivipic.com/template/${cover.id ?? id}/prev_2x?ver=${ver}`
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
    handleCarouse () {
      this.isHover = true
      this.waitTimer = window.setInterval(() => {
        if (this.isHover) {
          this.showCarousel = true
        }
      }, 100)
    },
    stopCarouse () {
      this.isHover = false
      this.showCarousel = false
      window.clearInterval(this.waitTimer)
    }
  }
})
</script>

<style lang="scss" scoped>
  .category-template-item {
    &__img {
      @include size(100%);
      object-fit: contain;
      vertical-align: top;
      pointer-events: none;
      border-radius: 5px;
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
