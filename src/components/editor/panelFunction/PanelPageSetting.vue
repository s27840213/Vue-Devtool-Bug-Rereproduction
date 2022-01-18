<template lang="pug">
  div(class="page-setting")
    div(class="page-setting-row page-setting__title")
      span(class="text-gray-2 label-mid") {{$t('NN0021')}}
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
      span(class="page-setting__apply__text") {{$t('NN0022')}}
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
            span(class="page-setting__suggestion-panel__body__title subtitle-2 text-white") {{$t('NN0023')}}
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
          div(class="page-setting__container")
            div(class="page-setting__suggestion-panel__body-row first-row")
              span(class="page-setting__suggestion-panel__body__title subtitle-2 text-white") {{$t('NN0024')}}
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
            div(class="mt-10")
            div(class="page-setting__suggestion-panel__body-row first-row")
              span(class="page-setting__suggestion-panel__body__title subtitle-2 text-white") {{$t('NN0025')}}
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
              span(class="page-setting__suggestion-panel__body__button__text") {{$t('NN0022')}}
            div(class="page-setting__suggestion-panel__body__button text-white"
                :class="isFormatApplicable ? 'bg-blue-1 pointer' : 'bg-gray-3'"
                @click="copyAndApplySelectedFormat")
              span(class="page-setting__suggestion-panel__body__button__text") {{$t('NN0211')}}
    div(class="page-setting__footer")
    div(v-if="inAdminMode"
      class="template-information")
      div(class="template-information__divider pb-10")
      btn(:type="'primary-sm'" class="rounded my-5"
          style="padding: 8px 0; margin-left: 6%; width: 88%;"
          @click.native="getDataClicked()") 取 得 群 組 / 模 板 資 料
      div(v-if="groupId.length > 0"
        class="pt-10")
        span(class="text-gray-1 label-lg") 群 組 資 訊
        div(class="template-information__line")
          span(class="body-1") groupId
          span(class="pl-15 body-2"
            @click="copyText(groupId)") {{groupId}}
        div(class="pt-5 text-red body-2") {{groupErrorMsg}}
        div(v-for="id in unsetThemeTemplate"
          class="pt-5 text-red body-2"
          @click="copyText(id)") {{id}}
        div(v-if="isGetGroup")
          div(v-if="showDbGroup"
            class="py-5 text-red body-2") 提醒：原有的設定不合法，已自動修正。請在下方修正版確認內容後按下更新按鈕
          div(v-if="showDbGroup"
            class="template-information__line")
            span(class="body-1 text-red-1") 原設定內容
          div(v-if="showDbGroup"
            class="mb-10 square-wrapper wrong text-center")
            div(class="pr-10 cover-option body-4")
              span theme
              span 封面頁碼
            div(v-for="(item, idx) in dbGroupThemes"
              class="pt-5 pr-10 cover-option")
              span(class="pl-15 body-1 text-left") {{item.id}}: {{item.title}}
              span 第{{item.coverIndex+1}}頁
          div(v-if="showDbGroup"
            class="template-information__line")
            span(class="body-1 ") 修正版
          div(class="square-wrapper text-center")
            div(class="pr-10 cover-option body-4")
              span theme
              span 封面頁碼
            div(v-for="(item, idx) in groupInfo.groupThemes"
              class="pt-5 pr-10 cover-option")
              span(class="pl-15 body-1 text-left") {{item.id}}: {{item.title}}
              select(class="template-information__cover-select text-center"
                v-model="item.coverIndex")
                option(v-for="option in item.options" :value="option.index") 第{{option.index+1}}頁
          div(class="pt-10")
            btn(:type="'primary-sm'" class="rounded my-5"
              style="padding: 8px 0; margin: 0 auto; width: 70%;"
              @click.native="updateGroupClicked()") 更新
      div(class="template-information__divider2")
      span(class="text-gray-1 label-lg") 模 板 資 訊
      div(class="template-information__content")
        div(class="template-information__line" style="background: #eee;")
          span(class="body-1") focus
          span(class="pl-15 body-2" @click="copyText(key_id)") {{key_id}}
        img(v-if="key_id.length > 0" style="margin: 0 auto;"
          :src="`https://template.vivipic.com/template/${key_id}/prev?ver=${imgRandQuery}`")
        div(v-if="isGetTemplate")
          div(class="template-information__line")
            span(class="body-1") key_id
            span(class="pl-15 body-2" @click="copyText(templateInfo.key_id)") {{templateInfo.key_id}}
          div(class="template-information__line")
            span(class="body-1") 創建者
            span(class="pl-15 body-2" @click="copyText(templateInfo.creator)") {{templateInfo.creator}}
          div(class="template-information__line")
            span(class="body-1") 修改者
            span(class="pl-15 body-2" @click="copyText(templateInfo.author)") {{templateInfo.author}}
          div(class="template-information__line")
            span(class="body-1") 上次更新
            span(class="pl-15 body-2") {{templateInfo.edit_time}}
          div(class="template-information__line")
            span(class="body-1") 模板尺寸
            span(class="pl-15 body-2") {{templateInfo.width}} x {{templateInfo.height}}
          div(class="template-information__line")
            span(class="body-1") Theme_ids
          template(v-if="showDbTemplate")
            div(class="py-5 text-red body-2") 提醒：主題設定有誤。請在下方修正版確認內容後按下更新按鈕
            div(class="template-information__line")
              span(class="body-1 text-red-1") 原設定內容 (x表示設定錯誤)
          div(v-if="showDbTemplate"
            class="square-wrapper wrong")
            template(v-for="(item, idx) in themeList")
              div(v-if="dbTemplateThemes[item.id]"
                class="pt-5 theme-option")
                span(class="text-red-1 text-center") {{isDisabled(item.id, item.width, item.height) ? 'x' : ''}}
                span(class="body-1") {{item.title}}
                span(class="body-2 text-gray-2") {{item.description}}
          div(v-if="showDbTemplate"
            class="pt-10 template-information__line")
            span(class="body-1 ") 修正版
          div(class="square-wrapper")
            div(v-for="(item, idx) in themeList"
              class="pt-5 theme-option")
              input(type="checkbox"
                class="theme-option__check"
                :disabled="isDisabled(item.id, item.width, item.height)"
                v-model="templateThemes[item.id]")
              span(class="body-1") {{item.title}}
              span(class="body-2 text-gray-2") {{item.description}}
          div(class="template-information__line pt-10")
            span(class="body-1") 語系
            select(class="template-information__select" v-model="templateInfo.locale")
              option(v-for="locale in localeOptions" :value="locale") {{locale}}
          div(class="pt-10") tags_tw
          div
            property-bar
              input(class="body-2 text-gray-2" min="0"
                v-model="templateInfo.tags_tw")
          div(class="pt-10") tags_us
          div
            property-bar
              input(class="body-2 text-gray-2" min="0"
                v-model="templateInfo.tags_us")
          div(class="pt-10") tags_jp
          div
            property-bar
              input(class="body-2 text-gray-2" min="0"
                v-model="templateInfo.tags_jp")
          div(class="pt-10")
            btn(:type="'primary-sm'" class="rounded my-5"
              style="padding: 8px 0; margin: 0 auto; width: 70%;"
              @click.native="updateDataClicked()") 更新
          div(class="template-information__divider")
          div(class="template-information__line bg-blue")
            span(class="body-1") 父
            span(class="pl-15 body-2"
              @click="copyText(templateInfo.parent_id)") {{templateInfo.parent_id || '無'}}
            span(class="text-blue-1") {{templateInfo.parent_locale}}
          div(class="template-information__line bg-blue border-bottom pb-5")
            span(class="body-1") 爺
            span(class="pl-15 body-2"
              @click="copyText(templateInfo.grandparent_id)") {{templateInfo.grandparent_id || '無'}}
            span(class="text-blue-1") {{templateInfo.grandparent_locale}}
          div(class="bg-blue")
            div(v-for="(item) in templateInfo.grandchildren_id"
              class="border-bottom py-5")
              div(class="child-item")
                span(class="body-1") 子
                span(class="body-2"
                  @click="copyText(item.childrenId)") {{item.childrenId}}
                span {{item.childrenLocale}}
              div(v-for="(item2) in item.grandchildren"
                class="child-item")
                span 孫
                span(class="body-2"
                  @click="copyText(item2.key_id)") {{item2.key_id}}
                span {{item2.locale}}
          div(class="template-information__line")
            span(class="body-1 pt-10") parent_id (父模板)
          div
            property-bar
              input(class="body-2 text-gray-2" min="0"
                v-model="userParentId")
            div(class="pt-5 text-red body-3") 注意: parent_id的修改會更新模板的json，請修改時注意模板內容有無更動，避免複寫
          div(class="template-information__line pt-10")
            div(style="width: 50%;")
              input(type="checkbox"
                class="template-information__check"
                v-model="updateParentIdChecked")
              label 確定修改
            btn(:type="'primary-sm'" class="rounded my-5"
              style="padding: 5px 40px;"
              @click.native="updateParentIdClicked()") 修改
    spinner(v-if="isLoading")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import RadioBtn from '@/components/global/RadioBtn.vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import layouts from '@/store/module/layouts'
import StepsUtils from '@/utils/stepsUtils'
import ResizeUtils from '@/utils/resizeUtils'
import designApis from '@/apis/design-info'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'
import PageUtils from '@/utils/pageUtils'
import uploadUtils from '@/utils/uploadUtils'
import { IListServiceContentData } from '@/interfaces/api'
import { ILayout } from '@/interfaces/layout'
import listApi from '@/apis/list'
import { Itheme, ICoverTheme, IThemeTemplate } from '@/interfaces/theme'

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
  beforeCreate() {
    this.$store.registerModule('layouts', layouts)
  },
  beforeDestroy() {
    this.$store.unregisterModule('layouts')
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
      isGetGroup: false,
      isGetTemplate: false,
      updateParentIdChecked: false,
      localeOptions: ['tw', 'us', 'jp'],
      currentKeyId: '',
      imgRandQuery: '',
      templateInfo: {
        key_id: '' as string,
        creator: '' as string,
        author: '' as string,
        edit_time: '' as string,
        tags_tw: '' as string,
        tags_us: '' as string,
        tags_jp: '' as string,
        locale: '' as string,
        width: '' as string,
        height: '' as string,
        theme_ids: '' as string,
        parent_id: '' as string,
        parent_locale: '' as string,
        grandparent_id: '' as string,
        grandparent_locale: '' as string,
        grandchildren_id: []
      },
      themeList: [] as Itheme[],
      userParentId: '',
      groupInfo: {
        cover_ids: '',
        contents: [] as IThemeTemplate[],
        groupThemes: [] as ICoverTheme[]
      },
      showDbGroup: false,
      showDbTemplate: false,
      dbGroupThemes: [] as ICoverTheme[],
      templateThemes: [] as boolean[],
      dbTemplateThemes: [] as boolean[],
      groupErrorMsg: '',
      unsetThemeTemplate: [] as string[]
    }
  },
  watch: {
    key_id: function () {
      this.isGetTemplate = false
      this.isGetGroup = false
      this.templateInfo = {
        key_id: '',
        creator: '',
        author: '',
        edit_time: '',
        tags_tw: '',
        tags_us: '',
        tags_jp: '',
        locale: '',
        width: '',
        height: '',
        theme_ids: '',
        parent_id: '',
        parent_locale: '',
        grandparent_id: '',
        grandparent_locale: '',
        grandchildren_id: []
      }
      this.imgRandQuery = GeneralUtils.generateRandomString(5)
    },
    groupId: function () {
      this.isGetGroup = false
      this.showDbGroup = false
      this.dbGroupThemes = []
      this.unsetThemeTemplate = []
      this.groupErrorMsg = ''
      this.groupInfo = {
        cover_ids: '',
        contents: [],
        groupThemes: []
      }
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
      middlemostPageIndex: 'getMiddlemostPageIndex',
      token: 'user/getToken',
      getAsset: 'getAsset',
      groupId: 'getGroupId',
      groupType: 'getGroupType',
      pagesLength: 'getPagesLength',
      getPageSize: 'getPageSize'
    }),
    currentPageWidth(): number {
      return Math.round(this.getPage(this.middlemostPageIndex)?.width ?? 0)
    },
    currentPageHeight(): number {
      return Math.round(this.getPage(this.middlemostPageIndex)?.height ?? 0)
    },
    aspectRatio(): number {
      return (this.getPage(this.middlemostPageIndex)?.width ?? 1) / this.getPage(this.middlemostPageIndex)?.height ?? 1
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
      return this.getPage(this.middlemostPageIndex).designId
    }
  },
  methods: {
    ...mapMutations({
      updatePageProps: 'UPDATE_pageProps',
      addPageToPos: 'ADD_pageToPos',
      setMiddlemostPageIndex: 'SET_middlemostPageIndex',
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
    applySelectedFormat(record = true) {
      if (!this.isFormatApplicable) return
      const format = this.getSelectedFormat()
      if (!format) return
      this.resizePage(format)
      if (this.groupType === 1) {
        // resize電商詳情頁時 其他頁面要依width做resize
        this.resizeOtherPages([this.middlemostPageIndex], { width: format.width })
      }
      listApi.addDesign(format.id, 'layout', format)
      const index = this.recentlyUsed.findIndex((recent) => {
        return format.id === recent.id && format.width === recent.width && format.height === recent.height
      })
      this.recentlyUsed.splice(index, 1)
      this.recentlyUsed.unshift(format)
      this.setSuggestionPanel(false)
      if (record) {
        StepsUtils.record()
      }
    },
    copyAndApplySelectedFormat() {
      if (!this.isFormatApplicable) return
      const page = GeneralUtils.deepCopy(this.getPage(this.middlemostPageIndex))
      page.designId = ''
      this.addPageToPos({
        newPage: page,
        pos: this.middlemostPageIndex + 1
      })
      GroupUtils.deselect()
      this.setMiddlemostPageIndex(this.middlemostPageIndex + 1)
      this.setCurrActivePageIndex(this.middlemostPageIndex + 1)
      this.applySelectedFormat(false)
      StepsUtils.record()
      this.$nextTick(() => { PageUtils.scrollIntoPage(this.middlemostPageIndex) })
    },
    resizePage(format: { width: number, height: number }) {
      ResizeUtils.resizePage(this.middlemostPageIndex, this.getPage(this.middlemostPageIndex), format)
      this.updatePageProps({
        pageIndex: this.middlemostPageIndex,
        props: {
          width: format.width,
          height: format.height
        }
      })
    },
    resizeOtherPages(excludes: number[] = [], format: { [key: string]: number }) {
      const { pagesLength, getPageSize } = this
      for (let pageIndex = 0; pageIndex < pagesLength; pageIndex++) {
        if (excludes.includes(pageIndex)) continue
        const { width, height } = getPageSize(pageIndex)
        const newSize = {
          width: format.width || width * (format.height / height),
          height: format.height || height * (format.width / width)
        }
        ResizeUtils.resizePage(pageIndex, this.getPage(pageIndex), newSize)
        this.updatePageProps({
          pageIndex,
          props: newSize
        })
      }
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
      this.pageWidth = typeof value === 'string' ? parseInt(value) : value
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
      this.pageHeight = typeof value === 'string' ? parseInt(value) : value
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

      this.resetStatus()
      const data = {}
      if (this.groupId.length === 0 && this.key_id.length === 0) {
        this.$notify({ group: 'copy', text: '無群組及模板id' })
      }
      if (this.groupId.length > 0) {
        const groupRes = await designApis.getDesignInfo(this.token, 'group', this.groupId, 'select', JSON.stringify(data))
        if (groupRes.data.flag === 0) {
          this.isGetGroup = true
          this.setGroupInfo(groupRes.data)
        } else {
          this.$notify({ group: 'copy', text: '找不到群組資料' })
        }
      }

      if (this.key_id.length > 0) {
        const res = await designApis.getDesignInfo(this.token, 'template', this.key_id, 'select', JSON.stringify(data))
        if (res.data.flag === 0) {
          this.isGetTemplate = true
          this.setTemplateInfo(res.data)
          if (this.themeList.length === 0) {
            this.themeList = res.data.data.themeList
          }
          this.userParentId = this.templateInfo.parent_id
        } else {
          this.$notify({ group: 'copy', text: '找不到模板資料' })
        }
      }

      this.isLoading = false
    },
    async updateGroupClicked() {
      const coverId = this.groupInfo.groupThemes.map(theme => {
        return String(theme.id) + ':' + this.groupInfo.contents[theme.coverIndex].key_id
      })
      this.isLoading = true
      const data = {
        cover_ids: coverId.join()
      }

      const res = await designApis.updateDesignInfo(this.token, 'group', this.groupId, 'update', JSON.stringify(data))
      if (res.data.flag === 0) {
        this.$notify({ group: 'copy', text: '群組資料更新成功' })
        this.setGroupInfo(res.data)
      } else {
        this.$notify({ group: 'copy', text: '更新時發生錯誤' })
      }
      this.resetStatus()
      this.isLoading = false
    },
    async updateDataClicked() {
      // handle theme_ids
      const arr = [] as string[]
      this.templateThemes.forEach((item, idx) => {
        if (item && idx !== 0) {
          arr.push(String(idx))
        }
      })
      const themeIds = arr.join()

      if (!this.templateInfo.key_id) {
        this.$notify({ group: 'copy', text: '請先取得模板資料' })
        return
      }
      if (themeIds === '' || themeIds.length === 0) {
        this.$notify({ group: 'copy', text: 'theme_ids不得為空' })
        return
      }

      this.isLoading = true
      const data = {
        locale: this.templateInfo.locale,
        tags_tw: this.templateInfo.tags_tw,
        tags_us: this.templateInfo.tags_us,
        tags_jp: this.templateInfo.tags_jp,
        theme_ids: themeIds
      }
      const res = await designApis.updateDesignInfo(this.token, 'template', this.templateInfo.key_id, 'update', JSON.stringify(data))
      if (res.data.flag === 0) {
        this.$notify({ group: 'copy', text: '模板資料更新成功' })
        this.setTemplateInfo(res.data)
      } else {
        this.$notify({ group: 'copy', text: '更新時發生錯誤' })
      }
      this.resetStatus()
      this.isGetGroup = false
      this.unsetThemeTemplate = []
      this.groupErrorMsg = ''
      this.isLoading = false
    },
    updateParentIdClicked() {
      if (!this.updateParentIdChecked) {
        this.$notify({ group: 'copy', text: '請先勾選確定修改' })
        return
      }
      this.updatePageProps({
        pageIndex: this.middlemostPageIndex,
        props: {
          parentId: this.userParentId
        }
      })
      uploadUtils.updateTemplate()
      this.resetStatus()
    },
    resetStatus() {
      this.updateParentIdChecked = false
    },
    setGroupInfo(data: any) {
      this.groupInfo = {
        cover_ids: '',
        contents: [],
        groupThemes: []
      }
      this.showDbGroup = false
      this.dbGroupThemes = []
      this.unsetThemeTemplate = []
      this.groupErrorMsg = ''
      this.groupInfo.cover_ids = data.data.cover_ids
      this.groupInfo.contents = data.data.contents
      this.themeList = data.data.themeList

      // fill in contents
      this.groupInfo.contents.forEach((content, idx) => {
        const themes = content.theme_ids.split(',')
        if (themes.length === 0 || themes[0] === '0') {
          // this.$notify({ group: 'copy', text: '有模板尚未設定theme，請設定完後再更新群組資訊' })
          this.groupErrorMsg = '以下模板尚未設定theme，請設定完後再更新群組資訊：'
          this.unsetThemeTemplate.push(content.key_id)
          this.isGetGroup = false
        } else {
          themes.forEach(id => {
            if (parseInt(id) !== 0) {
              const index = this.groupInfo.groupThemes.findIndex(theme => theme.id === parseInt(id))
              if (index === -1) {
                const theme = {
                  id: parseInt(id),
                  title: this.themeList[this.themeList.findIndex(theme => theme.id === parseInt(id))].title,
                  coverIndex: idx,
                  options: [{
                    index: idx,
                    key_id: content.key_id
                  }]
                }
                this.groupInfo.groupThemes.push(theme)
              } else {
                this.groupInfo.groupThemes[index].options.push({
                  index: idx,
                  key_id: content.key_id
                })
              }
            }
          })
        }
      })

      // fill in cover_ids
      const coverList = this.groupInfo.cover_ids.split(',')
      coverList.map((cover) => {
        const id = parseInt(cover.split(':')[0])
        const index = this.groupInfo.groupThemes.findIndex(theme => theme.id === id)
        if (index !== -1) {
          const keyId = cover.split(':')[1]
          const pageIndex = this.groupInfo.contents.findIndex(x => x.key_id === keyId)
          this.groupInfo.groupThemes[index].coverIndex = pageIndex
        }
        this.dbGroupThemes.push({
          id: id,
          title: this.themeList[this.themeList.findIndex(theme => theme.id === id)].title,
          coverIndex: this.groupInfo.contents.findIndex(theme => theme.key_id === cover.split(':')[1]),
          options: []
        })
      })

      // delete themes which are not set as theme_ids of templates
      this.groupInfo.groupThemes = this.groupInfo.groupThemes.filter(theme => theme.options.length > 0)

      // sort theme_cover list by theme_id
      this.groupInfo.groupThemes.sort((a, b) => a.id - b.id)
      this.dbGroupThemes.sort((a, b) => a.id - b.id)

      // if template in cover of theme is not exist, the value will be set to the first element of options
      this.groupInfo.groupThemes.forEach(theme => {
        const keyId = this.groupInfo.contents[theme.coverIndex].key_id
        if (theme.options.findIndex(option => option.key_id === keyId) === -1) {
          theme.coverIndex = theme.options[0].index
        }
      })

      const groupThemesString = this.groupInfo.groupThemes.map(theme => {
        return theme.id
      }).join(',')
      const dbThemesString = this.dbGroupThemes.map(theme => {
        return theme.id
      }).join(',')
      if (groupThemesString !== dbThemesString) {
        this.showDbGroup = true
      }
    },
    setTemplateInfo(data: any) {
      this.showDbTemplate = false
      this.templateThemes = []
      this.templateInfo = data.data
      this.templateInfo.edit_time = this.templateInfo.edit_time.replace(/T/, ' ').replace(/\..+/, '')
      const themes = this.templateInfo.theme_ids.split(',')
      themes.forEach((item) => {
        this.templateThemes[parseInt(item)] = true
      })
      this.dbTemplateThemes = Array.from(this.templateThemes)
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
    isDisabled(idx: number, themeWidth: string, themeHeight: string) {
      const themeAspectRatio = parseInt(themeWidth) / parseInt(themeHeight)
      const templateAspectRatio = parseInt(this.templateInfo.width) / parseInt(this.templateInfo.height)

      if (parseInt(themeHeight) === 0) { // 詳情頁模板
        return false
      } else if (themeAspectRatio === templateAspectRatio) {
        return false
      } else if ((themeWidth === this.templateInfo.width || parseInt(themeWidth) === 0) &&
        (themeHeight === this.templateInfo.height || parseInt(themeHeight) === 0)) {
        return false
      } else { // Disabled
        if (this.templateThemes[idx]) {
          this.showDbTemplate = true
          this.templateThemes[idx] = false
        }
        return true
      }
    },
    fetchLayouts() {
      this.isLayoutReady = false
      this.formatList = []
      this.recentlyUsed = []
      this.getCategories().then(() => {
        /**
         * @Todo TingAn -handle the sizz missing problem when intergate the i18n
         */
        for (const category of this.categories as IListServiceContentData[]) {
          if (category.title === `${this.$t('NN0025')}`) {
            this.formatList = category.list.map(item => ({
              id: item.id,
              width: item.width ?? 0,
              height: item.height ?? 0,
              title: item.title ?? '',
              description: item.description ?? ''
            }))
          }
          if (category.title === `${this.$t('NN0024')}`) {
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
    &:hover {
      background-color: setColor(blue-hover);
    }
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
        width: 95%;
        margin-left: auto;
        margin-right: auto;
        margin-top: 29px;
        margin-bottom: 17.43px;
        gap: 11px;
      }
      &__button {
        flex-grow: 1;
        border-radius: 3px;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 4px;
        text-align: center;
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
  &__container {
    max-height: 500px;
    margin-right: -5px;
    padding-right: 5px;
    overflow-y: auto; // overlay is not supported in Firefox
    scrollbar-width: thin;
    &::-webkit-scrollbar {
      width: 4px;
      height: 4px;
      background-color: rgba(24, 25, 31, 0.5);
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 2px;
      background-color: setColor(gray-3);
    }
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
  &__cover-select {
    width: 95%;
    height: 30px;
    font-size: 14px;
    border: 1px solid #d9dbe1;
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
  &__divider {
    width: 100%;
    border-top: 2px solid #000;
    margin-top: 10px;
    padding-bottom: 5px;
  }
  &__divider2 {
    width: 100%;
    border-top: 2px dotted #000;
    margin-top: 10px;
    padding-bottom: 5px;
  }
  .square-wrapper {
    border: 1px #000 solid;
    border-radius: 5px;
    padding: 5px 0;
    &.wrong {
      border: 1px setColor(red-1) solid;
    }
  }
  .cover-option {
    display: grid;
    align-items: center;
    grid-auto-flow: column;
    grid-template-columns: 140px auto;
  }
  .theme-option {
    display: grid;
    align-items: center;
    grid-auto-flow: column;
    grid-template-columns: 40px 130px auto;
    &__check {
      margin: auto 0;
    }
  }
  .border-bottom {
    border-bottom: 1px dashed setColor(blue-1);
  }
  .child-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    > :last-child {
      color: setColor(blue-1);
    }
  }
  .bg-blue {
    background: setColor(blue-4);
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: 0.3s ease;
}

.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
