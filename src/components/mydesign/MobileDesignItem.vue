<template lang="pug">
  div(class="mobile-design-item")
    div(class="mobile-design-item__block pointer")
      div(class="mobile-design-item__img-container")
        image-carousel(v-if="showCarousel && previewCheckReady"
          :imgs="pageImages"
          :speed="2000"
          @change="handleCarouselIdx")
          template(v-slot="{ url }")
            img(class="mobile-design-item__thumbnail"
                draggable="false"
                :style="imageStyles()"
                :src="url")
        img(ref="thumbnail"
            v-if="!showCarousel && previewCheckReady"
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
                    iconWidth="10px"
                    iconHeight="8px"
                    iconColor="white")
          div(v-if="!isSelected && isAnySelected"
            class="mobile-design-item__checkbox"
            @click.stop="emitSelect")
          div(class="mobile-design-item__more"
            @click.stop="openMenu()")
            svg-icon(iconName="more_vertical"
                    iconWidth="24px"
                    iconColor="gray-2")
          //- div(v-if="favorable && !isMultiSelected" class="mobile-design-item__favorite" @click.stop="emitLike")
            svg-icon(v-if="isMouseOver && !config.favorite"
                    iconName="favorites"
                    iconWidth="20px"
                    iconColor="white")
            svg-icon(v-if="isMouseOver && config.favorite"
                    iconName="favorites-fill"
                    iconWidth="20px"
                    iconColor="white")
            svg-icon(v-if="!isMouseOver && config.favorite"
                    iconName="favorites-fill"
                    iconWidth="20px"
                    iconColor="gray-4")
          span(class="mobile-design-item__index") {{ carouselIdx + 1 }}/{{ config.pageNum }}
    div(class="mobile-design-item__name"
        @click.prevent.stop)
      div(class="mobile-design-item__name__container")
        span(:title="config.name") {{ config.name }}
    div(class="mobile-design-item__size"
        @click.prevent.stop)
      span {{ `${config.width} x ${config.height}` }}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import ImageCarousel from '@/components/global/ImageCarousel.vue'
import vClickOutside from 'v-click-outside'
import imageUtils from '@/utils/imageUtils'
import designUtils from '@/utils/designUtils'

export default Vue.extend({
  components: {
    ImageCarousel
  },
  props: {
    config: Object,
    unenterable: Boolean,
    isAnySelected: Boolean,
    isSelected: Boolean,
    isMultiSelected: Boolean,
    index: Number
  },
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
      pageImages: [] as string[]
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  created() {
    this.checkImageSize(this.startCarousel)
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
  },
  destroyed() {
    window.removeEventListener('resize', this.handleResize)
  },
  watch: {
    'config.asset_index': {
      handler: function () {
        this.showCarousel = false
        this.checkImageSize(this.startCarousel)
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
    }
  },
  methods: {
    ...mapMutations('design', {
      clearSelection: 'UPDATE_clearSelection',
      setBottomMenu: 'SET_bottomMenu',
      setMobileDesignBuffer: 'SET_mobileDesignBuffer'
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
      designUtils.setDesign(this.config)
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
        this.config.thumbnail = this.previewPlaceholder
        this.pollingStep(0, callback)
      } else {
        this.pageImages = designUtils.getDesignPreviews(this.config.pageNum, this.config.id, 2, this.config.ver, this.config.signedUrl)
        imageUtils.getImageSize(this.configPreview, this.imgWidth, this.imgHeight, false).then((size) => {
          const { width, height, exists } = size
          this.imgWidth = width
          this.imgHeight = height
          this.previewCheckReady = true
          this.config.thumbnail = exists ? this.configPreview : this.previewPlaceholder
          this.$nextTick(() => {
            callback()
          })
        })
      }
    },
    pollingStep(step = 0, callback: () => void) {
      const timeout = step > 14 ? 2000 : 1000
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
          this.config.thumbnail = this.configPreview
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
      this.waitTimer = setInterval(() => {
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
      this.showCarousel = false
      this.checkImageSize(this.startCarousel)
    }
  }
})
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
    font-family: Noto Sans;
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
