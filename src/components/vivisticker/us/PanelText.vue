<template lang="pug">
div(class="panel-text" :class="{'in-category': isInCategory, 'in-editor': isInEditor}")
  category-list(v-for="item in categoryListArray"
    v-show="item.show" :ref="item.key" :key="item.key"
    :list="item.content" @loadMore="handleLoadMore")
    template(#before)
      div(class="panel-text__top-item")
      //- Empty recently used view
      div(v-if="showAllRecently && !item.content.length && !pending" class="panel-text__recent-empty")
        svg-icon(iconName="vivisticker_design" iconWidth="42px" iconColor="white")
        div(class="panel-text__recent-empty--title") No content in Recently Used
    template(v-if="pending" #after)
      div(class="text-center")
        svg-icon(iconName="loading"
          iconColor="white"
          iconWidth="20px")
          div(class="panel-text__item" :style="itemStyles")
    template(v-slot:category-text-item="{ list }")
      div(class="panel-text__items" :style="itemsStyles")
        div(v-for="item in list"
            class="panel-text__card"
            :class="{recent: item.id === 'recent'}"
            :key="item.id"
            :style="itemStyles()")
          div(v-if="item.id === 'recent'" class="panel-text__card__recent"
                @click="handleCategorySearch($t('NN0024'))")
            svg-icon(class="pointer"
              iconName="clock"
              iconColor="balck-1"
              iconWidth="24px")
            div(class="overline-SM") RECENTLY USED
          CategoryTextPreview(v-else :item="item" @click="addText(item)")
  div(v-if="!showAllRecently" class="panel-text__text-button-wrapper" ref="btnAddText"
      :style="`font-family: ${localeFont()}`"
      @click="handleAddText")
    span(ref="txtAddText") {{ $t('STK0001') }}
    div(class="panel-text__text-button-wrapper__icon" ref="iconAddText")
      svg-icon(iconName="plus-small" iconWidth="24px" iconColor="white")
</template>

<script lang="ts">
import { CCategoryList } from '@/components/category/CategoryList.vue'
import CategoryTextPreview from '@/components/vivisticker/us/CategoryTextPreview.vue'
import { ICategoryItem, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import AssetUtils from '@/utils/assetUtils'
import generalUtils from '@/utils/generalUtils'
import textPropUtils from '@/utils/textPropUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import AnyTouch, { AnyTouchEvent } from 'any-touch'
import { defineComponent } from 'vue'
import { mapState } from 'vuex'
import PanelText from '../PanelText.vue'

const MAX_BTN_WIDTH = 310

export default defineComponent({
  name: 'panel-text-us',
  extends: PanelText,
  components: {
    CategoryTextPreview: CategoryTextPreview
  },
  data() {
    return {
      elMainContent: undefined as HTMLElement | undefined,
      scrollProgress: -1,
      scrollProgressStart: 0,
      scrollProgressToFinish: 0,
      scrollTopStart: 0,
      scrollTopPrev: 0,
      scrollDirPrev: -1 as -1 | 1, // -1 for scroll up, 1 for scroll down
      destScrollProgress: -1 as -1 | 1, // -1 for expanded button, 1 for minimized button
      btnAniStartTime: null as number | null,
      isPan: false,
    }
  },
  mounted() {
    generalUtils.panelInit('text',
      this.handleSearch,
      this.handleCategorySearch,
      async ({ reset }: {reset: boolean}) => {
        await this.getRecently({ writeBack: true, key: 'textStock' })
        await this.getContent()
      })

    const elMainContent = (this.$refs as Record<string, CCategoryList[]>).mainContent[0].$el as HTMLElement
    this.elMainContent = elMainContent

    const atMainContent = new AnyTouch(this.elMainContent, { preventDefault: false })
    atMainContent.on('panstart', (e: AnyTouchEvent) => {
      if (this.isPan) return // because this event will trigger when pan direction changes
      this.isPan = true
      this.scrollTopStart = elMainContent.scrollTop
      this.scrollProgressStart = this.destScrollProgress
    })
    atMainContent.on(['panup', 'pandown'], (e: AnyTouchEvent) => {
      this.handleMainContentPan()
    })
    atMainContent.on('panend', (e: AnyTouchEvent) => {
      this.isPan = false
    })
    elMainContent.onscroll = (e: Event) => {
      this.handleMainContentScroll()
    }
  },
  watch: {
    scrollOrResize() {
      this.updateBtnStyles()
    },
    isPan(isPan) {
      if (!isPan) this.playBtnAnimation()
    }
  },
  computed: {
    ...mapState({
      windowSize: 'windowSize'
    }),
    btnMaxWidth() {
      return Math.min(this.windowSize.width - 80, MAX_BTN_WIDTH)
    },
    scrollOrResize() {
      return { scrollProgress: this.scrollProgress, btnMaxWidth: this.btnMaxWidth }
    },
    listRecently(): ICategoryItem[] {
      const { categories } = this
      const gap = 20
      const list = (categories as IListServiceContentData[]).find(category => category.is_recent)?.list ?? []
      const result = new Array(Math.ceil(list.length / this.numTextColumns))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * this.numTextColumns, idx * this.numTextColumns + this.numTextColumns)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-text-item',
            list: rowItems,
            size: this.itemWidth + gap,
            title: ''
          }
        })
      return result
    },
    // extends: PanelText
    // eslint-disable-next-line vue/no-unused-properties
    mainContent(): ICategoryItem[] {
      if (this.showAllRecently) {
        return this.listRecently
      }
      const list = this.listResult
      if (list.length !== 0) {
        Object.assign(list[list.length - 1], { sentinel: true })
      }
      return list
    },
    itemGap(): number {
      return this.isTablet ? 30 : 20
    },
    itemWidth(): number {
      return Math.min((this.windowSize.width - 48 - (this.numTextColumns - 1) * this.itemGap) / this.numTextColumns, 200)
    },
    itemsStyles() {
      return this.isTablet ? {
        gridTemplateColumns: `repeat(${this.numTextColumns}, 200px)`
      } : {
        gridTemplateColumns: `repeat(${this.numTextColumns}, ${this.itemWidth}px)`,
        columnGap: '20px'
      }
    },
    numTextColumns(): number {
      return this.isTablet ? 3 : 2
    }
  },
  methods: {
    // extends: PanelText
    // eslint-disable-next-line vue/no-unused-properties
    processListResult(list = [] as IListServiceContentDataItem[], isSearch: boolean): ICategoryItem[] {
      const recentItem = {
        id: 'recent',
        type: NaN,
        ver: NaN
      } as IListServiceContentDataItem
      if (list.length > 0) list = [recentItem].concat(list)
      return new Array(Math.ceil(list.length / this.numTextColumns))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * this.numTextColumns, (idx + 1) * this.numTextColumns)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-text-item',
            list: rowItems,
            title: '',
            size: this.itemWidth + this.itemGap
          }
        })
    },
    itemStyles() {
      return {
        width: this.itemWidth + 'px',
        height: this.itemWidth + 'px',
        ...(!this.isTablet && { margin: '0 auto' })
      }
    },
    addText(item: any) {
      if (this.isInEditor) {
        AssetUtils.addAsset(item).then(() => {
          textPropUtils.updateTextPropsState()
        })
      } else {
        vivistickerUtils.startEditing('text', {
          plan: item.plan,
          assetId: item.id
        }, vivistickerUtils.getAssetInitiator(item), vivistickerUtils.getAssetCallback(item))
      }
    },
    handleMainContentScroll() {
      const el = this.elMainContent as HTMLElement
      const dltScroll = el.scrollTop - this.scrollTopPrev
      const scrollDir = dltScroll > 0 ? 1 : -1

      // ignore scroll bounce
      if (el.scrollTop <= 0 || el.scrollTop >= el.scrollHeight - el.clientHeight) return

      // play animation when scroll direction changes during scroll (touch event won't fire during scroll on iOS)
      if (!this.isPan && scrollDir !== this.scrollDirPrev) {
        this.scrollTopStart = el.scrollTop
        this.scrollProgress = 0
        this.destScrollProgress = scrollDir
        this.btnAniStartTime = null
        this.updateBtnStyles()
        this.playBtnAnimation()
      }

      this.scrollTopPrev = el.scrollTop
      this.scrollDirPrev = scrollDir
    },
    handleMainContentPan() {
      // unlink scroll with animation when animation is playing
      if (this.btnAniStartTime !== null) return

      // define scroll destination for animation
      const el = this.elMainContent as HTMLElement
      const maxDestScrollTop = (el.scrollHeight - el.clientHeight)
      const destScrollTop = Math.min(el.clientHeight / 2, maxDestScrollTop)

      // displacement from start scroll position
      let dispScroll = el.scrollTop - this.scrollTopStart

      // threshold to trigger animation
      const thScroll = 0
      if (Math.abs(dispScroll) <= thScroll) return
      if (dispScroll > 0) dispScroll -= thScroll
      if (dispScroll < 0) dispScroll += thScroll

      // check for over scroll (scroll down when button is already minimized or scroll up when button is already expanded)
      const newScrollProgress = Math.max(Math.min(dispScroll / destScrollTop, 1), -1)
      if (this.scrollProgressStart === 1 && newScrollProgress > 0) {
        this.scrollProgress = 1
        this.destScrollProgress = 1
        return
      } else if (this.scrollProgressStart === -1 && newScrollProgress < 0) {
        this.scrollProgress = -1
        this.destScrollProgress = -1
        return
      }

      // update scroll progress
      this.scrollProgress = newScrollProgress

      // update destination scroll progress
      if (dispScroll > 0 && this.scrollProgressStart === -1) this.destScrollProgress = 1
      else if (dispScroll < 0 && this.scrollProgressStart === 1) this.destScrollProgress = -1
    },
    updateBtnStyles() {
      this.scrollProgressToFinish = this.destScrollProgress - this.scrollProgress
      const scrollRate = this.destScrollProgress > 0 ? this.scrollProgress : (1 + this.scrollProgress)
      const rScrollRate = 1 - scrollRate
      const btn = this.$refs.btnAddText as HTMLElement
      const txt = this.$refs.txtAddText as HTMLElement
      const icon = this.$refs.iconAddText as HTMLElement
      if (!btn || !txt || !icon) return

      const btnWidth = Math.max(Math.min(this.btnMaxWidth, this.btnMaxWidth * rScrollRate), btn.clientHeight)
      btn.style.maxWidth = btnWidth + 'px'
      txt.style.opacity = (1 - Math.min(scrollRate * 2, 1)).toString()

      const targetIconPosLeft = btnWidth / 2 - icon.clientWidth / 2
      icon.style.left = targetIconPosLeft + 52 * rScrollRate + 'px'
      icon.style.transform = `rotate(${360 * rScrollRate}deg)`
    },
    btnAnimation(timestamp: number) {
      // cancel animation if already finished
      if (this.scrollProgress === this.destScrollProgress) {
        this.btnAniStartTime = null
        return
      }

      // get relative progress
      if (!this.btnAniStartTime) this.btnAniStartTime = timestamp
      const duration = 500
      const runtime = timestamp - this.btnAniStartTime
      const relativeProgress = Math.max(Math.min(runtime / duration, 1), 0)

      // update scroll progress
      this.scrollProgress += this.scrollProgressToFinish * relativeProgress

      // request next frame if not finished, otherwise reset animation
      if (runtime < duration) {
        this.playBtnAnimation()
      } else this.btnAniStartTime = null
    },
    playBtnAnimation() {
      window.requestAnimationFrame(this.btnAnimation)
    }
  }
})
</script>

<style lang="scss" scoped>
.search-bar {
  flex: 0 0 auto;
}
.panel-text {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  padding-top: 10px;
  &__searchbar {
    margin-top: 24px;
    margin-bottom: 14px;
    &.no-top {
      margin-top: 0;
    }
  }
  &__brand-header {
    margin-top: 10px;
    margin-bottom: 13px;
  }
  &__brand-settings {
    position: absolute;
    width: 24px;
    height: 24px;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
  }
  &__card {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.1);
    &__recent {
      @include size(100%, 100%);
      display: flex;
      flex-direction: column;
      gap: 14px;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      color: setColor(black-1);
    }
    &.recent {
      background-color: setColor(light-bg);
    }
    // object-fit: contain;
    // vertical-align: middle;
  }
  &__items {
    display: grid;
    grid-template-columns: repeat(3, auto);
    column-gap: 30px;
    justify-content: center;
  }
  &.in-category:deep(.vue-recycle-scroller__item-wrapper) {
    margin-top: 24px;
  }
  &.in-editor {
    padding-top: 0;
  }
  &.in-editor:deep(.vue-recycle-scroller__item-wrapper) {
    margin-top: 0;
  }
  &__header {
    grid-column: 1 / 4;
    line-height: 26px;
    color: #ffffff;
    padding: 10px 0;
    text-align: left;
  }
  &__text-button-wrapper {
    position: absolute;
    right: 40px;
    left: 40px;
    bottom: 24px;
    max-width: 310px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 7px 0;
    margin: 0 auto;
    box-sizing: border-box;
    background: rgba(46, 46, 46, 0.8);
    border-radius: 10px;
    overflow: hidden;
    white-space: nowrap;
    box-shadow: 0px 0px 2px 2px rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
    &:active {
      background-color: setColor(black-1-5);
    }
    & > span {
      position: relative;
      left: -12px;
      font-weight: 600;
      font-size: 20px;
      line-height: 28px;
      color: white;
    }
    &__icon {
      display: flex;
      position: absolute;
      left: calc(50% + 40px);
    }
  }
  &__recent-empty {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: calc((100vh - 161px) * 0.8);
    &--title {
      margin: 12px 0 24px 0;
      color: white;
    }
  }
}
</style>
