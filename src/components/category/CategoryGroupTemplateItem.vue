<template lang="pug">
div(class="category-template-item" :style="itemStyle" @click="handleClickGroup")
  div(class="relative pointer"
    @mouseover="() => handleCarouse()"
    @mouseleave="stopCarouse()")
    image-carousel(v-if="showCarousel"
      :imgs="groupImages"
      @change="handleCarouselIdx")
      template(v-slot="{ url }")
        img(:src="url" :style="previewStyle" class="category-template-item__img")
    img(v-else
      class="category-template-item__img pointer"
      :src="fallbackSrc || previewImage"
      :style="previewStyle"
      @error="handleNotFound")
    span(class="category-template-item__index") {{ carouselIdx + 1 }}/{{ item.content_ids.length }}
    pro-item(v-if="item.plan")
  div(v-if="showId"
    class="category-template-item__id"
    @click.self.stop="copyId") {{ item.id }}
</template>

<script lang="ts">
import ImageCarousel from '@/components/global/ImageCarousel.vue'
import ProItem from '@/components/payment/ProItem.vue'
import GeneralUtils from '@/utils/generalUtils'
import { notify } from '@kyvg/vue3-notification'
import { defineComponent } from 'vue'

export default defineComponent({
  emits: ['clickGroupItem'],
  components: {
    ImageCarousel,
    ProItem
  },
  props: {
    src: {
      type: String
    },
    item: {
      type: Object,
      required: true
    },
    showId: {
      type: Boolean,
      required: true
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
      return this.item.content_ids.map((content: any) => `https://template.vivipic.com/template/${content.id}/prev_4x?ver=${content.ver}`)
    },
    previewImage (): string {
      const { match_cover: cover, ver, id } = this.item
      return `https://template.vivipic.com/template/${cover.id ?? id}/prev_4x?ver=${ver}`
    },
    previewStyle(): any {
      const { width, height } = this.item.preview || { width: GeneralUtils.getListRowItemSize(), height: GeneralUtils.getListRowItemSize() }
      return { width: `${width}px`, height: `${height}px` }
    },
    itemStyle(): any {
      const { width } = this.item.preview || { width: GeneralUtils.getListRowItemSize() }
      return { width: `${width}px` }
    }
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    copyId() {
      GeneralUtils.copyText(this.item.id)
        .then(() => {
          notify({ group: 'copy', text: `${this.item.id} 已複製` })
        })
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
      object-fit: contain;
      height: 145px;
      width: 145px;
      vertical-align: top;
      pointer-events: none;
    }
    &__id {
      color: #ffffff;
      font-size: 20px;
      line-height: 40px;
      text-align: left;
      transform: scale(.5);
      transform-origin: left top;
      cursor: pointer;
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
