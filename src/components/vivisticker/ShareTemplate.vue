<template lang="pug">
div(class="share-template" :style="containerStyles")
  div(class="share-template__preview" ref="preview")
    page-content(class="share-template__preview__page" :config="config" :pageIndex="0" :style="pageStyles" :inPreview="true")
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
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent, PropType } from 'vue'
import { mapState } from 'vuex'

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
    pageStyles() {
      return {
        transform: `scale(${this.previewScale})`,
      }
    },
    containerStyles() {
      return {
        padding: `0 ${this.isLandscape ? 28 : 10}% 24px`
      }
    }
  },
  methods: {
    save() {
      console.log('saveTemplate')
      vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrlForJSON({ noBg: false }), 'download')
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
      const targetAspectRatio = 9 / 16
      const aspectRatio = elPreview.clientWidth / elPreview.clientHeight
      this.previewScale = aspectRatio > targetAspectRatio ? elPreview.clientHeight / this.config.height : elPreview.clientWidth / this.config.width
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
    box-sizing: border-box;
    margin: 24px 0;
    position: relative;
    &__page {
      position: absolute;
      border-radius: 10px;
      transform-origin: center top;
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
