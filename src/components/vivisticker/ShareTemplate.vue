<template lang="pug">
div(class="share-template" :style="containerStyles")
  div(class="share-template__preview" ref="preview")
    div(class="share-template__preview__bg-page bg-black-6" :style="bgPageStyles()")
    page-content(class="share-template__preview__page" :config="config" :pageIndex="currFocusPageIndex" :contentScaleRatio="previewScale" :inPreview="true" :style="pageStyles()")
    div(class="share-template__preview__cover" @pointerdown="disableEvent")
  tabs(class="share-template__tabs"
    :tabs="['This page', 'Multi pages']"
    v-model="tabIndex")
  div(class="share-template__actions")
    div(v-for="button in buttons" :key="button.key" class="share-template__actions__action" @click="button.action")
      svg-icon(:iconName="button.iconName" iconWidth="24px" iconColor="white")
      div(class="share-template__actions__action__text text-white body-XS")
        span {{ button.title }}
</template>

<script lang="ts">
import PageContent from '@/components/editor/page/PageContent.vue'
import Tabs from '@/components/Tabs.vue'
import { IPage } from '@/interfaces/page'
import pageUtils from '@/utils/pageUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapState } from 'vuex'

interface IButton {
  key: string,
  title: string
  iconName: string
  action: () => void
}

export default defineComponent({
  components: {
    PageContent,
    Tabs
  },
  data() {
    return {
      tabIndex: 0,
      previewScale: 1
    }
  },
  props: {
    config: {
      type: Object as PropType<IPage>,
      required: true
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.handleResize()
    })
  },
  watch: {
    windowSize: {
      handler(): void {
        this.$nextTick(() => {
          this.handleResize()
        })
      },
      deep: true
    },
  },
  computed: {
    ...mapState({
      windowSize: 'windowSize',
      isLandscape: 'isLandscape'
    }),
    ...mapState('vivisticker', {
      templateShareType: 'templateShareType',
    }),
    ...mapState('templates', {
      igLayout: 'igLayout',
    }),
    ...mapGetters({
      pagesLength: 'getPagesLength',
      currFocusPageIndex: 'getCurrFocusPageIndex',
    }),
    buttons(): IButton[] {
      return [
        {
          key: 'save',
          title: 'Save',
          iconName: 'download_flat',
          action: this.save
        }
      ].concat(
        this.templateShareType === 'post' ? {
          key: 'post',
          title: 'Post',
          iconName: 'ig_post',
          action: this.share
        } : this.templateShareType === 'story' && this.tabIndex === 0 ? {
          key: 'story',
          title: 'Story',
          iconName: 'ig_story',
          action: this.share
        } : []
      )
    },
    containerStyles() {
      return {
        padding: `0 ${this.isLandscape ? 28 : 10}% 24px`
      }
    },
    previewOffset() {
      return this.tabIndex === 1 ? 12 : 0
    }
  },
  methods: {
    pageStyles(): {[key: string]: string} {
      return {
        transform: `translateX(-${this.previewOffset}px)`
      }
    },
    bgPageStyles(): {[key: string]: string} {
      return {
        width: `${this.config.width * this.previewScale}px`,
        height: `${this.config.height * this.previewScale - 32}px`,
        transform: `translateX(${this.previewOffset}px)`
      }
    },
    save() {
      console.log('saveTemplate')
      if (this.tabIndex === 0) {
        vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrlForJSON({ noBg: false }), 'download')
      } else {
        let pageIndex = 0
        const copyCallback = (flag: string) => {
          console.log('copyCallback', flag)
          if (flag === '0' && pageIndex < this.pagesLength) {
            vivistickerUtils.callScreenshotAsAPI(vivistickerUtils.createUrlForJSON({ page: pageUtils.getPage(pageIndex), noBg: false }), copyCallback, 'download')
            pageIndex += 1
          }
        }
        vivistickerUtils.callScreenshotAsAPI(vivistickerUtils.createUrlForJSON({ page: pageUtils.getPage(pageIndex), noBg: false }), copyCallback, 'download')
        pageIndex += 1
      }
    },
    share() {
      console.log('shareTemplate', this.templateShareType)
      const mapAction = {
        story: 'IGStory',
        post: 'IGPost'
      } as Record<string, string>
      vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrlForJSON({ noBg: false }), mapAction[this.templateShareType])
    },
    handleResize() {
      const elPreview = this.$refs.preview as HTMLElement
      if (!elPreview) return
      const targetAspectRatio = this.templateShareType === 'story' ? 9 / 16 : 1
      const aspectRatio = elPreview.clientWidth / elPreview.clientHeight
      this.previewScale = aspectRatio > targetAspectRatio ? (elPreview.clientHeight - 48) / this.config.height : elPreview.clientWidth / this.config.width
    },
    disableEvent(e: Event) {
      e.preventDefault()
      e.stopPropagation()
    }
  }
})
</script>

<style lang="scss" scoped>
.share-template {
  @include size(100%);
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  background-color: setColor(black-1);
  padding: 0 10% 24px;
  &__preview {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    position: relative;
    &__bg-page {
      position: absolute;
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 10px;
      box-sizing: border-box;
      transition: transform 0.2s ease-in-out;
    }
    &__page {
      position: absolute;
      border-radius: 10px;
      transition: transform 0.2s ease-in-out;
      box-shadow: 0px 0px 10px 8px rgba(60, 60, 60, 0.35);
    }
    &__cover {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
    }
  }
  &__tabs {
    justify-content: space-between;
    &::v-deep .tabs__item {
      width: 40% !important;
    }
  }
  &__actions {
    display: grid;
    grid-auto-flow: column;
    justify-content: space-evenly;
    margin-top: 8px;
    align-items: normal;
    &__action {
      display: flex;
      flex-direction: column;
      align-items: center;
      row-gap: 12px;
      &__text {
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}
</style>
