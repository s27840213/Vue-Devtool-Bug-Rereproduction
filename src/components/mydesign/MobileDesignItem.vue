<template lang="pug">
div(class="mobile-design-item" :data-index="config.asset_index")
  div(class="mobile-design-item__block pointer")
    div(class="mobile-design-item__img-container")
      image-carousel(v-if="showCarousel && isInView && previewCheckReady"
        :imgs="pageImages"
        :speed="2000"
        @change="handleCarouselIdx")
        template(v-slot="{ url }")
          img(class="mobile-design-item__thumbnail"
              draggable="false"
              :style="imageStyles()"
              :src="url")
      img(ref="thumbnail"
          v-if="!(showCarousel && isInView) && previewCheckReady"
          class="mobile-design-item__thumbnail"
          draggable="false"
          :src="appliedUrl")
    div(class="mobile-design-item__controller")
      div(v-if="!isTempDesign"
          class="mobile-design-item__controller-content"
          @click.self="handleClick")
        div(v-if="isSelected"
          class="mobile-design-item__checkbox-checked"
          @click.stop="emitDeselect")
          svg-icon(iconName="done"
                  iconWidth="20px"
                  iconHeight="20px"
                  iconColor="white")
        div(v-if="!isSelected && isAnySelected"
          class="mobile-design-item__checkbox"
          @click.stop="emitSelect")
        div(class="mobile-design-item__more"
          @click.stop="openMenu()")
          svg-icon(iconName="more_vertical"
                  iconWidth="24px"
                  iconColor="gray-2")
        span(class="mobile-design-item__index") {{ carouselIdx + 1 }}/{{ config.pageNum }}
  div(class="mobile-design-item__name"
      @click.prevent.stop)
    div(class="mobile-design-item__name__container")
      span(:title="config.name") {{ config.name }}
  div(class="mobile-design-item__size"
      @click.prevent.stop)
    span {{ `${sizeToShow.width} x ${sizeToShow.height} ${sizeToShow.unit}` }}
</template>

<script lang="ts">
import ImageCarousel from '@/components/global/ImageCarousel.vue'
import { IDesign } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import imageUtils from '@/utils/imageUtils'
import modalUtils from '@/utils/modalUtils'
import { PRECISION } from '@/utils/unitUtils'
import vClickOutside from 'click-outside-vue3'
import { round } from 'lodash'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

const component = defineComponent({
  components: {
    ImageCarousel
  },
  props: {
    config: {
      type: Object,
      required: true
    },
    unenterable: {
      type: Boolean,
      required: true
    },
    isAnySelected: {
      type: Boolean,
      required: true
    },
    isSelected: {
      type: Boolean,
      required: true
    },
  },
  emits: ['select', 'deselect'],
  data() {
    return {
      imgWidth: 150,
      imgHeight: 150,
      previewCheckReady: false,
      previewPlaceholder: require('@/assets/img/svg/loading-large.svg'),
      showCarousel: false,
      carouselIdx: 0,
      waitTimer: 0,
      renderedWidth: 150,
      renderedHeight: 150,
      pageImages: [] as string[],
      isInView: false
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
  },
  unmounted() {
    window.removeEventListener('resize', this.handleResize)
  },
  watch: {
    'config.asset_index': {
      handler: function () {
        if (this.showCarousel) {
          this.showCarousel = false
          this.checkImageSize(this.startCarousel)
        }
      }
    }
  },
  computed: {
    ...mapGetters('design', {
      folders: 'getFolders'
    }),
    configPreview(): string {
      return designUtils.getDesignPreview(this.config.id, 2, this.config.ver, this.config.signedUrl)
    },
    appliedUrl(): string {
      return this.config.thumbnail !== '' ? this.config.thumbnail : this.previewPlaceholder
    },
    isTempDesign(): boolean {
      return (this.config.id ?? '').endsWith('_new')
    },
    sizeToShow(): {width: number, height: number, unit: string} {
      const precision = this.config.unit === 'px' ? 0 : PRECISION
      return {
        width: round(this.config.width, precision),
        height: round(this.config.height, precision),
        unit: this.config.unit ?? 'px'
      }
    }
  },
  methods: {
    ...mapMutations('design', {
      clearSelection: 'UPDATE_clearSelection',
      setBottomMenu: 'SET_bottomMenu',
      setMobileDesignBuffer: 'SET_mobileDesignBuffer',
      setDesignThumbnail: 'UPDATE_setDesignThumbnail'
    }),
    imageStyles() {
      return { width: `${this.renderedWidth}px`, height: `${this.renderedHeight}px` }
    },
    handleClick() {
      if (this.isAnySelected) {
        this.$emit(this.isSelected ? 'deselect' : 'select')
        return
      }
      if (this.unenterable || this.isTempDesign) return
      if (this.$isTouchDevice() && this.config.group_type === 1) {
        modalUtils.setModalInfo(
            `${this.$t('NN0808')}`,
            [],
            {
              msg: `${this.$t('NN0358')}`,
              class: 'btn-blue-mid',
              action: () => { return false }
            }
        )
        return
      }
      designUtils.setDesign(this.config as IDesign)
    },
    handleCarouselIdx(idx: number) {
      this.carouselIdx = idx
    },
    openMenu() {
      this.clearSelection()
      this.setMobileDesignBuffer(this.config)
      this.setBottomMenu('design-menu')
    },
    emitSelect() {
      this.$emit('select')
    },
    emitDeselect() {
      this.$emit('deselect')
    },
    checkImageSize(callback: () => void) {
      this.previewCheckReady = false
      if (this.config.polling) {
        this.pageImages = Array(this.config.pageNum).fill(this.previewPlaceholder)
        this.previewCheckReady = true
        this.setDesignThumbnail({
          asset_index: this.config.asset_index,
          thumbnail: this.previewPlaceholder
        })
        this.pollingStep(0, callback)
      } else {
        if (this.isTempDesign) return
        this.pageImages = designUtils.getDesignPreviews(this.config.pageNum, this.config.id, 2, this.config.ver, this.config.signedUrl)
        imageUtils.getImageSize(this.configPreview, this.imgWidth, this.imgHeight, false).then((size) => {
          const { width, height, exists } = size
          this.imgWidth = width
          this.imgHeight = height
          this.previewCheckReady = true
          this.setDesignThumbnail({
            asset_index: this.config.asset_index,
            thumbnail: exists ? this.configPreview : this.previewPlaceholder
          })
          this.$nextTick(() => {
            callback()
          })
        })
      }
    },
    pollingStep(step = 0, callback: () => void) {
      const timeout = step > 14 ? 2000 : 1000
      if (this.isTempDesign) return
      imageUtils.getImageSize(
        designUtils.getDesignPreview(
          this.config.id, 2,
          undefined,
          this.config.signedUrl
        ),
        this.imgWidth, this.imgHeight, false
      ).then((size) => {
        const { width, height, exists } = size
        this.imgWidth = width
        this.imgHeight = height
        if (exists) {
          this.setDesignThumbnail({
            asset_index: this.config.asset_index,
            thumbnail: this.configPreview
          })
          this.$nextTick(() => {
            callback()
          })
        } else if (step < 35) {
          setTimeout(() => {
            this.pollingStep(step + 1, callback)
          }, timeout)
        }
      })
    },
    multiPollingStep() {
      for (let i = 0; i < this.config.pageNum; i++) {
        this.pagePollingStep(i)
      }
    },
    pagePollingStep(index: number, step = 0) {
      if (this.pageImages[index] !== this.previewPlaceholder) return
      if (this.isTempDesign) return
      const timeout = step > 14 ? 2000 : 1000
      imageUtils.getImageSize(designUtils.getDesignPreview(this.config.id, 2, undefined, this.config.signedUrl, index), 0, 0, false).then((size) => {
        if (size.exists) {
          this.pageImages[index] = designUtils.getDesignPreview(this.config.id, 2, this.config.ver, this.config.signedUrl, index)
        } else if (step < 35) {
          setTimeout(() => {
            this.pagePollingStep(index, step + 1)
          }, timeout)
        }
      })
    },
    startCarousel() {
      if (this.config.pageNum === 1) return
      this.waitTimer = window.setInterval(() => {
        const success = this.getThumbnailSize()
        if (success) {
          clearInterval(this.waitTimer)
        } else {
          return
        }
        if (this.config.polling) {
          this.multiPollingStep()
        }
        this.showCarousel = true
      }, 100)
    },
    getThumbnailSize(): boolean {
      const thumbnailElement = this.$refs.thumbnail as HTMLImageElement
      if (!thumbnailElement) return false
      this.renderedWidth = thumbnailElement.width
      this.renderedHeight = thumbnailElement.height
      return true
    },
    handleResize() {
      if (this.showCarousel) {
        this.showCarousel = false
        this.checkImageSize(this.startCarousel)
      }
    },
    // Call by MobileDesignGallery
    // eslint-disable-next-line vue/no-unused-properties
    handleEnterView() {
      this.isInView = true
      this.showCarousel = false
      this.checkImageSize(this.startCarousel)
    },
    // Call by MobileDesignGallery
    // eslint-disable-next-line vue/no-unused-properties
    handleLeaveView() {
      this.isInView = false
    }
  }
})

export default component
export type CMobileDesignitem = InstanceType<typeof component>
</script>

<style lang="scss" scoped>
.mobile-design-item {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  &__block {
    box-sizing: border-box;
    border-radius: 4px;
    width: 100%;
    padding-top: 90%;
    position: relative;
    background: setColor(gray-5);
  }
  &__img-container {
    display: flex;
    align-items: center;
    justify-content: center;
    top: 0;
    left: 0;
    box-sizing: border-box;
    position: absolute;
    width: 100%;
    height: 100%;
    padding: 12px 22px;
  }
  &__thumbnail {
    object-fit: contain;
    width: 100%;
    height: 100%;
  }
  &__controller {
    display: flex;
    align-items: center;
    justify-content: center;
    top: 0;
    left: 0;
    box-sizing: border-box;
    position: absolute;
    width: 100%;
    height: 100%;
    &-content {
      position: relative;
      width: 100%;
      height: 100%;
    }
  }
  &__index {
    background-color: white;
    border-radius: 100px;
    position: absolute;
    padding: 0px 10px;
    bottom: 8px;
    right: 8px;
    text-align: center;
    min-width: 50px;
    box-sizing: border-box;
    @include body-XS;
    transform-origin: right bottom;
    transform: scale(0.8);
    color: setColor(gray-2);
  }
  &__checkbox {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    left: 10px;
    top: 12px;
    border: 1px solid #969bab;
    box-sizing: border-box;
    cursor: pointer;
  }
  &__checkbox-checked {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: setColor(blue-1);
    left: 10px;
    top: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  &__more {
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    right: 8px;
    top: 8px;
    cursor: pointer;
  }
  &__favorite {
    position: absolute;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    left: 10px;
    bottom: 5px;
    cursor: pointer;
  }
  &__name {
    margin-top: 10px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    &__container {
      width: 100%;
      height: 24px;
      padding: 4px 0px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      border: none;
      > span {
        height: 24px;
        max-width: 30vw;
        @include body-SM;
        color: setColor(gray-1);
        white-space: nowrap;
        text-overflow: ellipsis;
        display: block;
        overflow: hidden;
      }
    }
  }
  &__size {
    width: 100%;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    > span {
      @include body-XS;
      color: setColor(gray-3);
    }
  }
}
</style>
