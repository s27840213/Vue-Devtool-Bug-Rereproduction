<template lang="pug">
panel-photo(v-if="showStock")
div(v-else class="panel-replace")
  div(class="panel-replace__item" @click="openPhoto()")
    svg-icon(iconName="cameraroll" iconWidth="24px" iconColor="gray-2")
    span {{ $t('STK0067') }}
  div(class="panel-replace__item" @click="openStock()")
    svg-icon(iconName="photo" iconWidth="24px" iconColor="gray-2")
    span {{ $t('STK0069') }}
</template>

<script lang="ts">
import PanelPhoto from '@/components/editor/panelSidebar/PanelPhoto.vue'
import imageUtils from '@/utils/imageUtils'
import { replaceImgInject } from '@/utils/textFillUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent, inject, PropType } from 'vue'

export default defineComponent({
  name: 'PanelReplace',
  components: {
    PanelPhoto
  },
  props: {
    panelHistory: {
      type: Array as PropType<string[]>,
      default: [] as string[]
    },
  },
  data() {
    return {
      replaceImgInject: inject(replaceImgInject, null),
    }
  },
  computed: {
    showStock() {
      if (this.panelHistory.length === 0) return false
      else return this.panelHistory[this.panelHistory.length - 1] === 'stock'
    },
  },
  methods: {
    openPhoto() {
      vivistickerUtils.getIosImg().then(async (images: Array<string>) => {
        if (!images.length) return
        const src = imageUtils.getSrc({
          type: 'ios',
          assetId: images[0],
          userId: ''
        })

        imageUtils.imgLoadHandler(src, (img: HTMLImageElement) => {
          const { naturalWidth, naturalHeight } = img

          this.replaceImgInject && this.replaceImgInject({
            width: naturalWidth,
            height: naturalHeight,
            id: images[0],
            preview: {
              width: naturalWidth,
              height: naturalHeight,
            },
            urls: {
              prev: src,
              full: src,
              larg: src,
              original: src,
              midd: src,
              smal: src,
              tiny: src,
            }
          })
          this.$emit('leaveExtraPanel')
        })
      })
    },
    openStock() {
      this.$emit('pushHistory', 'stock')
    },
  }
})
</script>

<style lang="scss" scoped>
.panel-replace {
  @include body-SM;
  color: setColor(gray-2);
  margin: 0 8px;
  &__item {
    display: flex;
    align-items: center;
    gap: 16px;
    height: 40px;
  }
}
</style>
