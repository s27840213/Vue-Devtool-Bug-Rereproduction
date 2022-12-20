<template lang="pug">
div(class="design-item")
  div(class="design-item__block pointer")
    div(class="design-item__img-container"
      :style="containerStyles()")
      img(v-if="previewCheckReady"
          class="design-item__thumbnail"
          :style="imageStyles()"
          :src="appliedUrl")
    div(class="design-item__controller")
      div(class="design-item__controller-content"
        @click.self="handleClick")
  div(class="design-item__name")
    div(class="design-item__name__container")
      span(:title="config.name") {{ config.name }}
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import imageUtils from '@/utils/imageUtils'
import vClickOutside from 'click-outside-vue3'
import designUtils from '@/utils/designUtils'
import { IDesign } from '@/interfaces/design'

export default defineComponent({
  emits: [],
  props: {
    config: {
      type: Object as PropType<IDesign>,
      required: true
    }
  },
  data() {
    return {
      isMouseOver: false,
      isNameMouseOver: false,
      imgWidth: 10,
      imgHeight: 10,
      previewCheckReady: false,
      previewPlaceholder: 'src/assets/img/svg/loading-large.svg'
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  created() {
    this.checkImageSize()
  },
  watch: {
    'config.asset_index': {
      handler: function () {
        this.$nextTick(() => {
          this.checkImageSize()
        })
      },
      deep: true
    }
  },
  computed: {
    aspectRatio(): number {
      return this.config.width / this.config.height
    },
    configPreview(): string {
      return designUtils.getDesignPreview(this.config.id, 1, this.config.ver, this.config.signedUrl)
    },
    appliedUrl(): string {
      return this.config.thumbnail !== '' ? this.config.thumbnail : this.previewPlaceholder
    }
  },
  methods: {
    containerStyles() {
      return (this.aspectRatio < 1.2 && this.aspectRatio > 0.83) ? { padding: '26px' } : { padding: '17px' }
    },
    imageStyles() {
      if (this.aspectRatio > 1) {
        return {
          width: '100%',
          height: 'auto',
          border: '1px solid #DEDEDE'
        }
      } else {
        return {
          width: 'auto',
          height: '100%',
          border: '1px solid #DEDEDE'
        }
      }
    },
    handleClick() {
      designUtils.setDesign(this.config)
    },
    checkImageSize() {
      this.previewCheckReady = false
      if (this.config.polling) {
        this.previewCheckReady = true
        // eslint-disable-next-line vue/no-mutating-props
        this.config.thumbnail = this.previewPlaceholder
        this.pollingStep()
      } else {
        imageUtils.getImageSize(this.configPreview, 150, 150, false).then((size) => {
          const { width, height, exists } = size
          this.imgWidth = width
          this.imgHeight = height
          this.previewCheckReady = true
          // eslint-disable-next-line vue/no-mutating-props
          this.config.thumbnail = exists ? this.configPreview : this.previewPlaceholder
        })
      }
    },
    pollingStep(step = 0) {
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
          // eslint-disable-next-line vue/no-mutating-props
          this.config.thumbnail = this.configPreview
        } else if (step < 35) {
          setTimeout(() => {
            this.pollingStep(step + 1)
          }, timeout)
        }
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.design-item {
  display: flex;
  flex-direction: column;
  &__block {
    border: 1px solid setColor(gray-4);
    box-sizing: border-box;
    border-radius: 4px;
    width: 100%;
    padding-top: 90%;
    position: relative;
    &:hover {
      transition: all 0.2s ease-in-out;
      box-shadow: 5px 5px 10px 2px rgba(48, 55, 66, 0.15);
      transform: translate(0, -5px);
    }
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
  &__name {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    &__container {
      width: 100%;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      gap: 5px;
      border: none;
      padding-top: 10px;
      > span {
        @include body-XS;
        height: 20px;
        white-space: nowrap;
        text-overflow: ellipsis;
        display: block;
        overflow: hidden;
      }
    }
  }
}
</style>
