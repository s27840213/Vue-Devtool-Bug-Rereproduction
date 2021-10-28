<template lang="pug">
  div(class="page-setting")
    div(class="page-setting-row page-setting__title")
      span(class="text-gray-2 label-mid") 頁面尺寸
    div(class="page-setting-row page-setting__size")
      property-bar(class="page-setting__size__box pointer" @click.native="setSuggestionPanel(true)")
        span(class="body-3 text-gray-2") {{ currentPageWidth }}
        span(class="body-4 text-gray-3") W
      svg-icon(class="pointer"
          :iconName="isLocked ? 'lock' : 'unlock'" :iconWidth="'20px'" :iconColor="'gray-2'"
          @click.native="toggleLock()")
      property-bar(class="page-setting__size__box pointer" @click.native="setSuggestionPanel(true)")
        span(class="body-3 text-gray-2") {{ currentPageHeight }}
        span(class="body-4 text-gray-3") H
    div(class="page-setting-row page-setting__apply text-white bg-blue-1 pointer"
        @click="toggleSuggestionPanel()")
      span(class="page-setting__apply__text") 調 整 尺 寸
    transition(name="slide-fade")
      div(v-if="isPanelOpen"
        class="page-setting__suggestion-panel")
        img(class="page-setting__suggestion-panel__arrow" :src="require('@/assets/img/svg/up-arrow.svg')")
        div(class="page-setting__suggestion-panel__body")
          div(class="page-setting__suggestion-panel__body__close pointer"
              @click="setSuggestionPanel(false)")
            svg-icon(class="page-setting__suggestion-panel__body__close"
                    iconName="close" iconWidth="19px" iconColor="white")
          div(class="page-setting__suggestion-panel__body-row first-row")
            span(class="page-setting__suggestion-panel__body__title subtitle-2 text-white") 自訂尺寸
          div(class="page-setting__suggestion-panel__body-row")
            radio-btn(class="page-setting__suggestion-panel__body__radio"
                      :isSelected="selectedFormat === 'custom'",
                      formatKey="custom",
                      @select="selectFormat")
            div(class="page-setting__suggestion-panel__body__custom")
              property-bar(class="page-setting__suggestion-panel__body__custom__box"
                          :class="selectedFormat === 'custom' ? 'border-blue-1' : 'border-white'")
                input(class="body-3" type="number" min="0"
                      :class="selectedFormat === 'custom' ? 'text-blue-1' : 'text-white'"
                      :value="pageWidth" @input="setPageWidth" @click="selectFormat('custom')")
                span(class="body-4"
                    :class="selectedFormat === 'custom' ? 'text-blue-1' : 'text-white'") W
              svg-icon(class="pointer"
                  :iconName="isLocked ? 'lock' : 'unlock'"
                  iconWidth="15px" :iconColor="selectedFormat === 'custom' ? 'blue-1' : 'white'"
                  @click.native="toggleLock()")
              property-bar(class="page-setting__suggestion-panel__body__custom__box"
                          :class="selectedFormat === 'custom' ? 'border-blue-1' : 'border-white'")
                input(class="body-3" type="number" min="0"
                      :class="selectedFormat === 'custom' ? 'text-blue-1' : 'text-white'"
                      :value="pageHeight" @input="setPageHeight" @click="selectFormat('custom')")
                span(class="body-4"
                    :class="selectedFormat === 'custom' ? 'text-blue-1' : 'text-white'") H
          div(class="page-setting__suggestion-panel__body__hr horizontal-rule")
          div(class="page-setting__suggestion-panel__body-row first-row")
            span(class="page-setting__suggestion-panel__body__title subtitle-2 text-white") 最近使用
          div(v-if="!isLayoutReady" class="page-setting__suggestion-panel__body-row-center")
            svg-icon(iconName="loading" iconWidth="25px" iconHeight="10px" iconColor="white")
          div(v-for="(format, index) in recentlyUsed" class="page-setting__suggestion-panel__body-row pointer"
              @click="selectFormat(`recent-${index}`)")
            radio-btn(class="page-setting__suggestion-panel__body__radio"
                      :isSelected="selectedFormat === `recent-${index}`",
                      :formatKey="`recent-${index}`",
                      @select="selectFormat")
            span(class="page-setting__suggestion-panel__body__recently body-3 pointer"
                  :class="selectedFormat === `recent-${index}` ? 'text-blue-1' : 'text-white'"
                  @click="selectFormat(`recent-${index}`)") {{ makeFormatString(format) }}
          div(class="page-setting__suggestion-panel__body__hr horizontal-rule")
          div(class="page-setting__suggestion-panel__body-row first-row")
            span(class="page-setting__suggestion-panel__body__title subtitle-2 text-white") 常用尺寸
          div(v-if="!isLayoutReady" class="page-setting__suggestion-panel__body-row-center")
            svg-icon(iconName="loading" iconWidth="25px" iconHeight="10px" iconColor="white")
          div(v-for="(format, index) in formatList" class="page-setting__suggestion-panel__body-row pointer"
              @click="selectFormat(`preset-${index}`)")
            radio-btn(class="page-setting__suggestion-panel__body__radio"
                      :isSelected="selectedFormat === `preset-${index}`",
                      :formatKey="`preset-${index}`",
                      @select="selectFormat")
            span(class="page-setting__suggestion-panel__body__typical-name body-4"
                  :class="selectedFormat === `preset-${index}` ? 'text-blue-1' : 'text-white'") {{ format.title }}
            span(class="page-setting__suggestion-panel__body__typical-size body-4"
                  :class="selectedFormat === `preset-${index}` ? 'text-blue-1' : 'text-white'") {{ format.description }}
          div(class="page-setting__suggestion-panel__body__buttons")
            div(class="page-setting__suggestion-panel__body__button text-white"
                :class="isFormatApplicable ? 'bg-blue-1 pointer' : 'bg-gray-3'"
                @click="applySelectedFormat")
              span(class="page-setting__suggestion-panel__body__button__text") 調整尺寸
            div(class="page-setting__suggestion-panel__body__button text-white"
                :class="isFormatApplicable ? 'bg-blue-1 pointer' : 'bg-gray-3'"
                @click="copyAndApplySelectedFormat")
              span(class="page-setting__suggestion-panel__body__button__text") 複製並調整尺寸
    div(class="page-setting__footer")
    div(v-if="inAdminMode"
      class="template-information")
      span(class="text-gray-1 label-lg") Template Information
      div(class="template-information__content")
        div(class="template-information__line" style="background: #eee;")
          span(class="body-1") focus
          span(class="pl-15 body-2" @click="copyText(key_id)") {{key_id}}
        img(v-if="key_id.length > 0" style="margin: 0 auto;"
          :src="`https://template.vivipic.com/template/${key_id}/prev?ver=${imgRandQuery}`")
        btn(:type="'primary-sm'" class="rounded my-5" style="padding: 8px 40px;"
          @click.native="getDataClicked()") 取得模板資料
        div(class="template-information__line")
          span(class="body-1") key_id
          span(class="pl-15 body-2" @click="copyText(templateInfo.key_id)") {{templateInfo.key_id}}
        div(class="template-information__line")
          span(class="body-1") 作者
          span(class="pl-15 body-2" @click="copyText(templateInfo.author)") {{templateInfo.author}}
        div(class="template-information__line")
          span(class="body-1") 上次更新
          span(class="pl-15 body-2") {{templateInfo.edit_time}}
        div(class="template-information__line")
          span(class="body-1") 語系
          select(class="template-information__select" v-model="templateInfo.locale")
            option(v-for="locale in localeOptions" :value="locale") {{locale}}
        div(class="template-information__line")
          span(class="body-1") Theme_ids
        div(class="theme-wrapper")
          div(v-for="(item, idx) in themeList"
          class="pt-5 theme-option")
            input(type="checkbox"
              class="theme-option__check"
              :disabled="isDisabled(item.width, item.height)"
              v-model="templateThemes[item.id]")
            span(class="body-1") {{item.title}}
            span(class="body-2 text-gray-2") {{item.description}}
        div
          span tags_tw
        div
          property-bar
            input(class="body-2 text-gray-2" min="0" v-model="templateInfo.tags_tw")
        div
          span tags_us
        div
          property-bar
            input(class="body-2 text-gray-2" min="0" v-model="templateInfo.tags_us")
        div
          span tags_jp
        div
          property-bar
            input(class="body-2 text-gray-2" min="0" v-model="templateInfo.tags_jp")
        div(class="template-information__line")
          div(style="width: 50%;")
            input(type="checkbox" class="template-information__check" v-model="updateChecked")
            label 確定更新
          btn(:type="'primary-sm'" class="rounded my-5"
          style="padding: 5px 40px;" @click.native="updateDataClicked()") 更新
    spinner(v-if="isLoading")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import RadioBtn from '@/components/global/RadioBtn.vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import StepsUtils from '@/utils/stepsUtils'
import ResizeUtils from '@/utils/resizeUtils'
import designApis from '@/apis/design-info'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'
import { IListServiceContentData } from '@/interfaces/api'
import { ILayout } from '@/interfaces/layout'
import listApi from '@/apis/list'
import { Itheme } from '@/interfaces/theme'

export default Vue.extend({
  components: {
    SearchBar,
    RadioBtn
  },
  mounted() {
    this.fetchLayouts()
    this.pageWidth = this.currentPageWidth
    this.pageHeight = this.currentPageHeight
  },
  data() {
    return {
      formatList: [] as ILayout[],
      recentlyUsed: [] as ILayout[],
      selectedFormat: '',
      pageWidth: '' as string | number,
      pageHeight: '' as string | number,
      isLayoutReady: false,
      isLocked: true,
      isPanelOpen: false,
      isLoading: false,
      needUpdate: false,
      updateChecked: false,
      localeOptions: ['tw', 'us', 'jp'],
      currentKeyId: '',
      imgRandQuery: '',
      templateInfo: {
        key_id: '' as string,
        author: '' as string,
        edit_time: '' as string,
        tags_tw: '' as string,
        tags_us: '' as string,
        tags_jp: '' as string,
        locale: '' as string,
        width: '' as string,
        height: '' as string,
        theme_ids: '' as string
      },
      themeList: [] as Itheme[]
    }
  },
  watch: {
    key_id: function() {
      this.templateInfo = {
        key_id: '',
        author: '',
        edit_time: '',
        tags_tw: '',
        tags_us: '',
        tags_jp: '',
        locale: '',
        width: '',
        height: '',
        theme_ids: ''
      }
      this.themeList = []
      this.imgRandQuery = GeneralUtils.generateRandomString(5)
    },
    currentPageWidth: function (newVal) {
      this.pageWidth = newVal
      this.pageHeight = this.currentPageHeight
    },
    currentPageHeight: function (newVal) {
      this.pageWidth = this.currentPageWidth
      this.pageHeight = newVal
    },
    isPanelOpen: function (newVal) {
      if (!newVal) this.fetchLayouts()
    }
  },
  computed: {
    ...mapState('user', [
      'role',
      'adminMode']),
    ...mapState(
      'layouts',
      [
        'categories'
      ]
    ),
    ...mapGetters({
      getPage: 'getPage',
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      token: 'user/getToken',
      getAsset: 'getAsset'
    }),
    currentPageWidth(): number {
      return Math.round(this.getPage(this.lastSelectedPageIndex)?.width ?? 0)
    },
    currentPageHeight(): number {
      return Math.round(this.getPage(this.lastSelectedPageIndex)?.height ?? 0)
    },
    aspectRatio(): number {
      return (this.getPage(this.lastSelectedPageIndex)?.width ?? 1) / this.getPage(this.lastSelectedPageIndex)?.height ?? 1
    },
    isCustomValid(): boolean {
      return this.pageWidth !== '' && this.pageHeight !== ''
    },
    isFormatApplicable(): boolean {
      return this.selectedFormat === 'custom' ? this.isCustomValid : (this.selectedFormat !== '')
    },
    inAdminMode(): boolean {
      return this.role === 0 && this.adminMode === true
    },
    key_id(): string {
      return this.getPage(this.lastSelectedPageIndex).designId
    },
    templateThemes(): boolean[] {
      const themes = this.templateInfo.theme_ids.split(',')
      const templateThemes = [] as boolean[]
      themes.forEach((item) => {
        templateThemes[parseInt(item)] = true
      })
      return templateThemes
    }
  },
  methods: {
    ...mapMutations({
      updatePageProps: 'UPDATE_pageProps',
      addPageToPos: 'ADD_pageToPos',
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setCurrActivePageIndex: 'SET_currActivePageIndex'
    }),
    ...mapActions('layouts',
      [
        'getCategories'
      ]
    ),
    getSelectedFormat(): ILayout | undefined {
      if (this.selectedFormat === 'custom') {
        if (!this.isCustomValid) return undefined
        return { id: '', width: this.pageWidth as number, height: this.pageHeight as number, title: '', description: '' }
      } else if (this.selectedFormat.startsWith('recent')) {
        const [type, index] = this.selectedFormat.split('-')
        const format = this.recentlyUsed[parseInt(index)]
        return format
      } else if (this.selectedFormat.startsWith('preset')) {
        const [type, index] = this.selectedFormat.split('-')
        const format = this.formatList[parseInt(index)]
        return format
      } else {
        return undefined
      }
    },
    applySelectedFormat() {
      const format = this.getSelectedFormat()
      if (!format) return
      this.resizePage(format)
      listApi.addDesign(format.id, 'layout', format)
      const index = this.recentlyUsed.findIndex((recent) => {
        return format.id === recent.id && format.width === recent.width && format.height === recent.height
      })
      this.recentlyUsed.splice(index, 1)
      this.recentlyUsed.unshift(format)
    },
    copyAndApplySelectedFormat() {
      const page = GeneralUtils.deepCopy(this.getPage(this.lastSelectedPageIndex))
      page.name += ' (copy)'
      page.designId = ''
      this.addPageToPos({
        newPage: page,
        pos: this.lastSelectedPageIndex + 1
      })
      GroupUtils.deselect()
      this.setLastSelectedPageIndex(this.lastSelectedPageIndex + 1)
      this.setCurrActivePageIndex(this.lastSelectedPageIndex + 1)
      this.applySelectedFormat()
    },
    resizePage(format: { width: number, height: number }) {
      ResizeUtils.resizePage(this.lastSelectedPageIndex, this.getPage(this.lastSelectedPageIndex), format)
      this.updatePageProps({
        pageIndex: this.lastSelectedPageIndex,
        props: {
          width: format.width,
          height: format.height
        }
      })
      StepsUtils.record()
    },
    toggleLock() {
      this.isLocked = !this.isLocked
    },
    setSuggestionPanel(opened: boolean) {
      this.isPanelOpen = opened
    },
    toggleSuggestionPanel() {
      this.setSuggestionPanel(!this.isPanelOpen)
    },
    dropDownStyles() {
      return this.isPanelOpen ? { transform: 'translateX(-50%) rotate(180deg)' } : {}
    },
    makeFormatString(format: ILayout) {
      if (format.id !== '') {
        return `${format.title} ${format.description}`
      } else {
        return `${format.width} x ${format.height}`
      }
    },
    setPageWidth(event: Event) {
      const value = (event.target as HTMLInputElement).value
      this.pageWidth = value
      this.selectedFormat = 'custom'
      if (this.isLocked) {
        if (value === '') {
          this.pageHeight = ''
        } else {
          this.pageHeight = Math.round(parseInt(value) / this.aspectRatio)
        }
      }
    },
    setPageHeight(event: Event) {
      const value = (event.target as HTMLInputElement).value
      this.pageHeight = value
      this.selectedFormat = 'custom'
      if (this.isLocked) {
        if (value === '') {
          this.pageWidth = ''
        } else {
          this.pageWidth = Math.round(parseInt(value) * this.aspectRatio)
        }
      }
    },
    selectFormat(key: string) {
      this.selectedFormat = key
    },
    async getDataClicked() {
      this.isLoading = true
      if (this.key_id.length === 0) {
        this.isLoading = false
        this.$notify({ group: 'copy', text: '找不到模板資料' })
        return
      }
      this.updateChecked = false
      this.needUpdate = true
      const data = {}
      const res = await designApis.getTemplateInfo(this.token, 'template', this.key_id, 'select', JSON.stringify(data))
      if (res.data.flag === 0) {
        this.templateInfo = res.data.data
        this.templateInfo.edit_time = this.templateInfo.edit_time.replace(/T/, ' ').replace(/\..+/, '')
        this.themeList = res.data.data.themeList
      } else {
        this.$notify({ group: 'copy', text: '找不到模板資料' })
      }

      this.isLoading = false
    },
    async updateDataClicked() {
      // handle theme_ids
      let themeIds = ''
      if (this.templateThemes.length === 1 && this.templateThemes[0]) {
        // theme_ids unset
        themeIds = '0'
      } else {
        const arr = [] as string[]
        this.templateThemes.forEach((item, idx) => {
          if (item && idx !== 0) {
            arr.push(String(idx))
          }
        })
        themeIds = arr.join()
      }

      this.isLoading = true
      if (!this.templateInfo.key_id) {
        this.isLoading = false
        this.$notify({ group: 'copy', text: '請先取得模板資料' })
        return
      }
      if (!this.updateChecked) {
        this.isLoading = false
        this.$notify({ group: 'copy', text: '請先勾選確定更新' })
        return
      }
      const data = {
        locale: this.templateInfo.locale,
        tags_tw: this.templateInfo.tags_tw,
        tags_us: this.templateInfo.tags_us,
        tags_jp: this.templateInfo.tags_jp,
        theme_ids: themeIds
      }
      const res = await designApis.updateTemplateInfo(this.token, 'template', this.templateInfo.key_id, 'update', JSON.stringify(data))
      if (res.data.flag === 0) {
        this.$notify({ group: 'copy', text: '模板資料更新成功' })
        this.templateInfo = res.data.data
        this.templateInfo.edit_time = this.templateInfo.edit_time.replace(/T/, ' ').replace(/\..+/, '')
      } else {
        this.$notify({ group: 'copy', text: '更新時發生錯誤' })
      }
      this.updateChecked = false
      this.isLoading = false
    },
    copyText(text: string) {
      if (text.length === 0) {
        return
      }
      GeneralUtils.copyText(text)
        .then(() => {
          this.$notify({ group: 'copy', text: `${text} 已複製` })
        })
    },
    isDisabled(themeWidth: string, themeHeight: string) {
      const themeAspectRatio = parseInt(themeWidth) / parseInt(themeHeight)
      const templateAspectRatio = parseInt(this.templateInfo.width) / parseInt(this.templateInfo.height)

      if (themeAspectRatio === templateAspectRatio) {
        return false
      } else if ((themeWidth === this.templateInfo.width || themeWidth === '0') &&
                    (themeHeight === this.templateInfo.height || themeHeight === '0')) {
        return false
      } else {
        return true
      }
    },
    fetchLayouts() {
      this.isLayoutReady = false
      this.formatList = []
      this.recentlyUsed = []
      this.getCategories().then(() => {
        for (const category of this.categories as IListServiceContentData[]) {
          if (category.title === '常用尺寸') {
            this.formatList = category.list.map(item => ({
              id: item.id,
              width: item.width ?? 0,
              height: item.height ?? 0,
              title: item.title ?? '',
              description: item.description ?? ''
            }))
          }
          if (category.title === '最近使用') {
            this.recentlyUsed = category.list.map(item => ({
              id: item.id,
              width: item.width ?? 0,
              height: item.height ?? 0,
              title: item.title ?? '',
              description: item.description ?? ''
            }))
          }
        }
        this.isLayoutReady = true
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.page-setting {
  @include size(100%, 100%);
  font-family: NotoSansTC;
  text-align: left;
  &__title {
    & span {
      line-height: 18px;
    }
  }
  &-row {
    margin-top: 15px;
    width: 90%;
    margin-left: auto;
    margin-right: auto;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }
  &__size {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    grid-template-rows: auto;
    column-gap: 5px;
    align-items: center;
    &__box {
      height: 26px;
      box-sizing: border-box;
      & input {
        line-height: 16px;
        font-family: NotoSansTC;
      }
    }
  }
  &__apply {
    height: 28px;
    border-radius: 3px;
    text-align: center;
    margin-top: 19px;
    width: 88%;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    &__text {
      font-weight: 700;
      font-size: 12px;
      line-height: 16px;
    }
  }
  &__hr {
    margin-top: 19px;
    width: 95%;
  }
  &__suggestion {
    height: 28px;
    box-sizing: border-box;
    border: 1.2px solid setColor(gray-2);
    border-radius: 3px;
    text-align: center;
    margin-top: 20px;
    width: 88%;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    &__text {
      font-weight: 700;
      font-size: 12px;
      line-height: 16px;
    }
    &__icon {
      position: absolute;
      left: calc(50% + 36px);
      transform: translateX(-50%);
      transition: all 0.2s ease 0s;
    }
  }
  &__suggestion-panel {
    &__arrow {
      margin-left: auto;
      margin-right: 30%;
      margin-top: 15px;
      margin-bottom: -5px;
      display: block;
    }
    &__body {
      background-color: setColor(gray-1-5);
      box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.25);
      border-radius: 4px;
      padding: 11.57px;
      &-row {
        display: flex;
        justify-content: space-between;
        width: 87%;
        margin-left: auto;
        margin-top: 15px;
        margin-right: 10px;
        align-items: center;
        &-center {
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        &.first-row {
          margin-top: 0px;
        }
      }
      &__close {
        margin-left: auto;
        width: fit-content;
        height: 19px;
      }
      &__title {
        font-weight: 700;
        margin-left: -16px;
      }
      &__custom {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        grid-template-rows: auto;
        column-gap: 5px;
        align-items: center;
        width: 85%;
        &__box {
          height: 26px;
          box-sizing: border-box;
          padding: 5px 5px;
          & input {
            line-height: 16px;
            background-color: transparent;
            font-family: NotoSansTC;
          }
          &.border-blue-1 {
            @extend .border-blue-1;
          }
          &.border-white {
            @extend .border-white;
          }
        }
      }
      &__hr {
        margin-top: 31px;
        margin-bottom: 31px;
      }
      &__text {
        font-family: Mulish;
      }
      &__recently {
        @extend .page-setting__suggestion-panel__body__text;
        width: 88%;
      }
      &__typical-name {
        @extend .page-setting__suggestion-panel__body__text;
        width: 37%;
      }
      &__typical-size {
        @extend .page-setting__suggestion-panel__body__text;
        width: 45%;
        white-space: nowrap;
        transform: scale(0.85);
      }
      &__buttons {
        display: flex;
        justify-content: space-between;
        width: 95%;
        margin-left: auto;
        margin-right: auto;
        margin-top: 29px;
        margin-bottom: 17.43px;
      }
      &__button {
        border-radius: 3px;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 27px;
        padding: 0 18px;
        &__text {
          font-weight: 700;
          font-size: 12px;
        }
      }
    }
  }
  &__footer {
    height: 20px;
  }
}
.horizontal-rule {
  @extend .bg-gray-4;
  height: 1px;
  margin-left: auto;
  margin-right: auto;
  padding: 0;
}

.template-information {
  &__content {
    display: grid;
    row-gap: 8px;
    padding-bottom: 25px;
  }
  &__line {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__select {
    width: 40%;
    height: 35px;
    font-size: 18px;
    border: 1px solid #d9dbe1;
    padding-left: 15px;
  }
  &__check {
    width: 10%;
  }

  .theme-wrapper {
    border: 1px #000 solid;
    border-radius: 5px;
    padding: 5px 0;
  }

  .theme-option {
    display: grid;
    align-items: center;
    grid-auto-flow: column;
    grid-template-columns: 40px 100px auto;
    &__check {
      margin: auto 0;
    }
  }
}

.slide-fade-enter-active, .slide-fade-leave-active  {
  transition: .3s ease;
}

.slide-fade-enter, .slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
