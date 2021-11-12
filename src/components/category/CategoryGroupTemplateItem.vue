<template lang="pug">
  div(class="category-template-item")
    div(class="relative pointer"
      style="margin-bottom: 2px;"
      @mouseover="showCarousel = true"
      @mouseleave="showCarousel = false"
      @click="handleShowGroupItems")
      image-carousel(v-if="showCarousel"
        :imgs="groupImages"
        @change="handleCarouselIdx")
        template(v-slot="{ url }")
          img(:src="url" class="category-template-item__img")
      img(v-else
        class="category-template-item__img pointer"
        :src="previewImage"
        @error="handleNotFound")
      span(class="category-template-item__index") {{ carouselIdx + 1 }}/{{ item.content_ids.length }}
    div(v-if="showId"
      class="category-template-item__id"
      @click="copyId") {{ item.id }}
</template>

<script lang="ts">
import Vue from 'vue'
import ImageCarousel from '@/components/global/ImageCarousel.vue'
import GeneralUtils from '@/utils/generalUtils'

export default Vue.extend({
  components: { ImageCarousel },
  props: {
    src: String,
    item: Object,
    showId: Boolean
  },
  data () {
    return {
      showCarousel: false,
      carouselIdx: 0
    }
  },
  computed: {
    groupImages (): string[] {
      return this.item.content_ids.map((content: any) => `https://template.vivipic.com/template/${content.id}/prev?ver=${content.ver}`)
    },
    previewImage (): string {
      const { match_cover: cover, ver, id } = this.item
      return `https://template.vivipic.com/template/${cover.id ?? id}/prev?ver=${ver}`
    }
  },
  methods: {
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    copyId() {
      GeneralUtils.copyText(this.item.id)
        .then(() => {
          this.$notify({ group: 'copy', text: `${this.item.id} 已複製` })
        })
    },
    handleCarouselIdx (idx: number) {
      this.carouselIdx = idx
    },
    handleShowGroupItems () {
      this.$emit('showGroup', this.item)
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
