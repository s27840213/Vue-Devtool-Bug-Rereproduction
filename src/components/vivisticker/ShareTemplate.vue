<template lang="pug">
div(class="share-template" :style="containerStyles")
  template(v-if="isInMultiPageShare")
    div(class="share-template__preview multi-page" ref="preview")
      div(class="share-template__preview__page-item" v-for="(page, index) in pagesState" :key="`preview-page-${page.config.id}`")
        page-content(class="share-template__preview__page-item__page"
        :config="page.config"
        :pageIndex="index"
        :contentScaleRatio="previewScale"
        :inPreview="true"
        :style="previewPageStyles()")
        div(class="share-template__preview__page-item__index text-white") {{ index + 1 }}
        div(class="share-template__preview__cover" @click.prevent.stop="handleTogglePagesSelected(index)")
        div(class="share-template__preview__page-item__checkbox checkbox" :class="{checked: selectedPages.has(index)}")
          svg-icon(v-if="selectedPages.has(index)" iconName="check" iconColor="white" iconWidth="20.7px")
    div(class="share-template__action")
      div(v-if="currAction?.key === 'post'" class="share-template__action__text text-black-5 body-SM") {{ 'In order to post directly to IG, please select up to ten pages.' }}
      div(v-else class="share-template__action__select" @click="handleSelectAll")
        div(class="share-template__action__select__checkbox checkbox" :class="{checked: selectedPages.size === pagesState.length}")
          svg-icon(v-if="selectedPages.size === pagesState.length" iconName="check" iconColor="white" iconWidth="20.7px")
        div(class="share-template__action__select__text text-white body-SM") {{ strToggleSelectAll }}
      div(class="share-template__action__btn" :class="{disabled: selectedPages.size === 0}" @click="() => selectedPages.size > 0 && currAction?.action()")
        svg-icon(:iconName="currAction?.iconName" iconWidth="24px")
        div(class="share-template__action__btn__text body-SM") {{ currAction?.title }}
  template(v-else)
    div(class="share-template__preview" ref="preview")
      div(class="share-template__preview__bg-page bg-black-6" :style="bgPageStyles()")
      page-content(class="share-template__preview__page"
      :config="config"
      :pageIndex="currFocusPageIndex"
      :contentScaleRatio="previewScale"
      :inPreview="true"
      :style="pageStyles()")
      div(class="share-template__preview__cover" @pointerdown="disableEvent")
    tabs(class="share-template__tabs"
      :tabs="['This page', 'Multi pages']"
      v-model="tabIndex")
    div(class="share-template__actions")
      div(v-for="button in buttons" :key="button.key" class="share-template__actions__action" @click="handleAction(button)")
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
import { mapGetters, mapMutations, mapState } from 'vuex'

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
  props: {
    config: {
      type: Object as PropType<IPage>,
      required: true
    }
  },
  data() {
    return {
      tabIndex: 0,
      previewScale: 1,
      selectedPages: new Set<number>(),
      currAction: null as IButton | null
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
    isInMultiPageShare(newVal) {
      if (newVal) this.initSelectedPages()
      else this.currAction = null
      this.$nextTick(() => {
        this.handleResize()
      })
    }
  },
  computed: {
    ...mapState({
      windowSize: 'windowSize',
      isLandscape: 'isLandscape'
    }),
    ...mapState('vivisticker', {
      templateShareType: 'templateShareType',
      isInMultiPageShare: 'isInMultiPageShare',
    }),
    ...mapState('templates', {
      igLayout: 'igLayout',
    }),
    ...mapGetters({
      pagesState: 'getPagesState',
      pagesLength: 'getPagesLength',
      currFocusPageIndex: 'getCurrFocusPageIndex',
    }),
    buttons(): IButton[] {
      return [
        {
          key: 'save',
          title: 'Save', // TODO: translate
          iconName: 'download_flat',
          action: this.save
        }
      ].concat(
        this.templateShareType === 'post' ? {
          key: 'post',
          title: 'Post', // TODO: translate
          iconName: 'ig_post',
          action: this.share
        } : this.templateShareType === 'story' && this.tabIndex === 0 ? {
          key: 'story',
          title: 'Story', // TODO: translate
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
    },
    strToggleSelectAll() {
      return this.selectedPages.size === this.pagesState.length ? 'Unselect all' : 'Select all' // TODO: translate
    }
  },
  methods: {
    ...mapMutations('vivisticker', { setIsInMultiPageShare: 'SET_isInMultiPageShare' }),
    initSelectedPages() {
      if (this.currAction?.key === 'post') this.selectedPages = new Set()
      else this.selectedPages = new Set(this.pagesState.keys())
    },
    previewPageStyles(): {[key: string]: string} {
      return {

      }
    },
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
    handleTogglePagesSelected(pageIndex: number) {
      if (this.selectedPages.has(pageIndex)) this.selectedPages.delete(pageIndex)
      else if (this.currAction?.key !== 'post' || this.selectedPages.size < 10) this.selectedPages.add(pageIndex)
    },
    handleSelectAll() {
      if (this.selectedPages.size === this.pagesState.length) this.selectedPages.clear()
      else this.selectedPages = new Set(this.pagesState.keys())
    },
    handleAction(action: IButton) {
      this.currAction = action
      action.action()
    },
    save() {
      if (this.isInMultiPageShare) {
        const selectedPageIndexs = Array.from(this.selectedPages)
        selectedPageIndexs.sort((a, b) => b - a)

        let idx = 0
        const copyCallback = (flag: string) => {
          if (flag === '0' && idx < selectedPageIndexs.length) {
            vivistickerUtils.callScreenshotAsAPI(vivistickerUtils.createUrlForJSON({ page: pageUtils.getPage(selectedPageIndexs[idx]), noBg: false, toast: idx === selectedPageIndexs.length - 1 }), copyCallback, 'download')
            idx += 1
          }
        }
        vivistickerUtils.callScreenshotAsAPI(vivistickerUtils.createUrlForJSON({ page: pageUtils.getPage(selectedPageIndexs[idx]), noBg: false, toast: selectedPageIndexs.length === 1 }), copyCallback, 'download')
        idx += 1
      } else if (this.tabIndex === 0) {
        vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrlForJSON({ noBg: false }), 'download')
      } else this.setIsInMultiPageShare(true)
    },
    share() {
      if (this.isInMultiPageShare && this.templateShareType === 'post') {
        const selectedPageIndexs = Array.from(this.selectedPages)
        selectedPageIndexs.sort((a, b) => b - a)
        let idx = 0
        const copyCallback = (flag: string) => {
          if (flag === '0' && idx < selectedPageIndexs.length) {
            vivistickerUtils.callScreenshotAsAPI(vivistickerUtils.createUrlForJSON({ page: pageUtils.getPage(selectedPageIndexs[idx]), noBg: false, toast: false }), copyCallback, idx === selectedPageIndexs.length - 1 ? 'IGPost' : 'download')
            idx += 1
          }
        }
        vivistickerUtils.callScreenshotAsAPI(vivistickerUtils.createUrlForJSON({ page: pageUtils.getPage(selectedPageIndexs[idx]), noBg: false, toast: false }), copyCallback, selectedPageIndexs.length === 1 ? 'IGPost' : 'download')
        idx += 1
      } else if (this.tabIndex === 0) {
        const mapAction = {
          story: 'IGStory',
          post: 'IGPost'
        } as Record<string, string>
        vivistickerUtils.sendScreenshotUrl(vivistickerUtils.createUrlForJSON({ noBg: false }), mapAction[this.templateShareType])
      } else this.setIsInMultiPageShare(true)
    },
    handleResize() {
      const elPreview = this.$refs.preview as HTMLElement
      if (!elPreview) return
      const targetAspectRatio = this.templateShareType === 'story' ? 9 / 16 : 1
      const aspectRatio = elPreview.clientWidth / elPreview.clientHeight
      this.previewScale = this.isInMultiPageShare ? (elPreview.clientWidth - 48) / this.config.width / 2
        : aspectRatio > targetAspectRatio ? (elPreview.clientHeight - 48) / this.config.height : elPreview.clientWidth / this.config.width
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
    &.multi-page {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 16px;
      margin-top: 40px;
      overflow-y: auto;
    }
    &__bg-page {
      position: absolute;
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 10px;
      box-sizing: border-box;
      transition: transform 0.2s ease-in-out;
    }
    &__page {
      border-radius: 10px;
      transition: transform 0.2s ease-in-out;
      box-shadow: 0px 0px 10px 8px rgba(60, 60, 60, 0.35);
    }
    &__page-item {
      position: relative;
      padding: 0px 8px 16px 8px;
      &__page {
        border-radius: 10px;
        filter: drop-shadow(0px 0px 8px rgba(60, 60, 60, 0.31));
      }
      &__index {
        margin-top: 16px;
        font-weight: 600;
        font-size: 16px;
        line-height: 28px;
      }
      &__checkbox {
        position: absolute;
        top: 4px;
        right: 12px;
      }
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
  &__action {
    display: flex;
    column-gap: 20px;
    padding: 24px 0;
    border-top: 1px solid #474747;
    align-items: center;
    justify-content: space-between;
    &__select {
      display: flex;
      column-gap: 8px;
      align-items: center;
    }
    &__btn {
      display: flex;
      background: white;
      border-radius: 10px;
      padding: 9px 16px;
      column-gap: 8px;
      color: setColor(black-3);
      svg {
        color: setColor(black-3);
        transition: none;
      }
      &:active {
        background: rgba(255, 255, 255, 0.8);
      }
      &.disabled {
        background: setColor(black-3);
        color: setColor(black-5);
        svg {
          color: setColor(black-5);
        }
      }
    }
  }

  .checkbox {
    @include size(20px);
    background: setColor(gray-6);
    border: 1px solid setColor(black-5);
    border-radius: 50%;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    &.checked {
      background: setColor(black-3);
      border: none;
    }
  }
}
</style>
