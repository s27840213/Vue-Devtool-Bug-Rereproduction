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
      div(v-if="panelOpened"
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
          div(v-for="(format, index) in recentlyUsed" class="page-setting__suggestion-panel__body-row")
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
          div(v-for="[id, format] in Array.from(formatList)" class="page-setting__suggestion-panel__body-row")
            radio-btn(class="page-setting__suggestion-panel__body__radio"
                      :isSelected="selectedFormat === `preset-${format.id}`",
                      :formatKey="`preset-${format.id}`",
                      @select="selectFormat")
            span(class="page-setting__suggestion-panel__body__typical-name body-4 pointer"
                  :class="selectedFormat === `preset-${format.id}` ? 'text-blue-1' : 'text-white'"
                  @click="selectFormat(`preset-${format.id}`)") {{ format.name }}
            span(class="page-setting__suggestion-panel__body__typical-size body-4 pointer"
                  :class="selectedFormat === `preset-${format.id}` ? 'text-blue-1' : 'text-white'"
                  @click="selectFormat(`preset-${format.id}`)") {{ format.size }}
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
    div(v-if="inAdminMode")
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
import { mapGetters, mapMutations, mapState } from 'vuex'
import StepsUtils from '@/utils/stepsUtils'
import ResizeUtils from '@/utils/resizeUtils'
import designApis from '@/apis/design-info'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'

export default Vue.extend({
  components: {
    SearchBar,
    RadioBtn
  },
  mounted() {
    const formatPresets = [
      {
        id: '0',
        name: 'Facebook',
        width: 1080,
        height: 1080,
        size: '1080x1080'
      },
      {
        id: '1',
        name: 'Instagram',
        width: 1080,
        height: 1080,
        size: '1080x1080'
      },
      {
        id: '2',
        name: 'IG 限時動態',
        width: 1080,
        height: 1920,
        size: '1080x1920 (9:16)'
      },
      {
        id: '3',
        name: 'Line',
        width: 1040,
        height: 1040,
        size: '1040x1040'
      },
      {
        id: '4',
        name: '電商-商品圖',
        width: 1080,
        height: 1080,
        size: '1080x1080'
      },
      {
        id: '5',
        name: '電商-Banner',
        width: 2000,
        height: 1000,
        size: '2000x1000 (2:1)'
      }
    ]
    for (const format of formatPresets) {
      this.formatList.set(format.id, format)
    }
    this.pageWidth = this.currentPageWidth
    this.pageHeight = this.currentPageHeight
  },
  data() {
    return {
      formatList: new Map(),
      recentlyUsed: [
        {
          type: 'preset',
          id: '0'
        },
        {
          type: 'preset',
          id: '4'
        },
        {
          type: 'custom',
          id: '0',
          width: 1080,
          height: 720
        },
        {
          type: 'custom',
          id: '1',
          width: 1200,
          height: 1200
        },
        {
          type: 'preset',
          id: '2'
        }
      ],
      selectedFormat: '',
      pageWidth: '' as string | number,
      pageHeight: '' as string | number,
      isLocked: true,
      panelOpened: false,
      isLoading: false,
      needUpdate: false,
      updateChecked: false,
      localeOptions: ['tw', 'us', 'jp'],
      currentKeyId: '',
      templateInfo: {
        key_id: '' as string,
        author: '' as string,
        edit_time: '' as string,
        tags_tw: '' as string,
        tags_us: '' as string,
        tags_jp: '' as string,
        locale: '' as string
      },
      imgRandQuery: ''
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
        locale: ''
      }
      this.imgRandQuery = GeneralUtils.generateRandomString(5)
    },
    currentPageWidth: function (newVal) {
      this.pageWidth = newVal
      this.pageHeight = this.currentPageHeight
    },
    currentPageHeight: function (newVal) {
      this.pageWidth = this.currentPageWidth
      this.pageHeight = newVal
    }
  },
  computed: {
    ...mapState('user', [
      'role',
      'adminMode']),
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
    }
  },
  methods: {
    ...mapMutations({
      updatePageProps: 'UPDATE_pageProps',
      addPageToPos: 'ADD_pageToPos',
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setCurrActivePageIndex: 'SET_currActivePageIndex'
    }),
    getSelectedFormat(): { id: string, width: number, height: number } | undefined {
      if (this.selectedFormat === 'custom') {
        if (!this.isCustomValid) return undefined
        return { id: '', width: this.pageWidth as number, height: this.pageHeight as number }
      } else if (this.selectedFormat.startsWith('recent')) {
        const [type, index] = this.selectedFormat.split('-')
        const format = this.recentlyUsed[parseInt(index)]
        if (format.type === 'preset') {
          return this.formatList.get(format.id)
        } else {
          return { id: format.id, width: format.width as number, height: format.height as number }
        }
      } else if (this.selectedFormat.startsWith('preset')) {
        const [type, id] = this.selectedFormat.split('-')
        return this.formatList.get(id)
      } else {
        return undefined
      }
    },
    applySelectedFormat() {
      const format = this.getSelectedFormat()
      if (format) {
        this.resizePage(format)
      }
    },
    copyAndApplySelectedFormat() {
      const page = GeneralUtils.deepCopy(this.getPage(this.lastSelectedPageIndex))
      page.name += ' (copy)'
      page.designId = ''
      console.log(page)
      this.addPageToPos({
        newPage: page,
        pos: this.lastSelectedPageIndex + 1
      })
      GroupUtils.deselect()
      this.setLastSelectedPageIndex(this.lastSelectedPageIndex + 1)
      this.setCurrActivePageIndex(this.lastSelectedPageIndex + 1)
      this.applySelectedFormat()
    },
    resizePage(format: { id: string, width: number, height: number }) {
      ResizeUtils.resizePage(this.lastSelectedPageIndex, this.getPage(this.lastSelectedPageIndex), format)
      this.updatePageProps({
        pageIndex: this.lastSelectedPageIndex,
        props: {
          width: format.width,
          height: format.height
        }
      })
      this.pageWidth = ''
      this.pageHeight = ''
      StepsUtils.record()
    },
    toggleLock() {
      this.isLocked = !this.isLocked
    },
    setSuggestionPanel(opened: boolean) {
      this.panelOpened = opened
    },
    toggleSuggestionPanel() {
      this.setSuggestionPanel(!this.panelOpened)
    },
    dropDownStyles() {
      return this.panelOpened ? { transform: 'translateX(-50%) rotate(180deg)' } : {}
    },
    makeFormatString(format: { type: string, width?: number, height?: number, id: string }) {
      if (format.type === 'preset') {
        const presetFormat = this.formatList.get(format.id)
        return `${presetFormat.name} ${presetFormat.size}`
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
      } else {
        this.$notify({ group: 'copy', text: '找不到模板資料' })
      }

      this.isLoading = false
    },
    async updateDataClicked() {
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
        tags_jp: this.templateInfo.tags_jp
      }
      const res = await designApis.updateTemplateInfo(this.token, 'template', this.templateInfo.key_id, 'update', JSON.stringify(data))
      if (res.data.flag === 0) {
        this.$notify({ group: 'copy', text: '模板資料更新成功' })
        this.templateInfo = res.data.data
        this.templateInfo.edit_time = this.templateInfo.edit_time.replace(/T/, ' ').replace(/\..+/, '')
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
}

.slide-fade-enter-active, .slide-fade-leave-active  {
  transition: .3s ease;
}

.slide-fade-enter, .slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
