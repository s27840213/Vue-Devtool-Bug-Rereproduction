<template lang="pug">
div(class="page-setting")
  div(class="page-setting-row page-setting__title")
    span(class="text-gray-2 label-mid") {{$t('NN0021')}}
  div(class="page-setting-row page-setting__size bg-gray-6 pointer" @click="toggleSuggestionPanel()")
    div(class="page-setting__size__box")
      span(class="body-XS text-gray-2") {{ `${sizeToShow.width} ${sizeToShow.unit}` }}
    span(class="body-XS text-gray-3") W
    span(class="body-XS text-gray-2 text-center") x
    div(class="page-setting__size__box")
      span(class="body-XS text-gray-2") {{ `${sizeToShow.height} ${sizeToShow.unit}` }}
    span(class="body-XS text-gray-3") H
  div(class="page-setting-row page-setting__apply text-white bg-blue-1 pointer"
      @click="toggleSuggestionPanel()")
    svg-icon(iconName="pro" iconWidth="22px" iconColor="alarm" class="mr-10")
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
        keep-alive
          page-size-selector(:isDarkTheme="true" @close="setSuggestionPanel(false)" ref="pageSizeSelector")
  div(v-if="hasBleed" class="page-setting__bleed")
    div(class="page-setting-row page-setting__bleed__title pointer" @click="() => showBleedSettings = !showBleedSettings")
      span(class="text-gray-2 label-mid") {{$t('NN0780')}}
      svg-icon(class='page-setting__bleed__expand-icon'
              iconName="chevron-up"
              iconWidth="14px"
              iconColor="gray-2"
              :style="expandIconStyles()")
    div(v-if="showBleedSettings" class="page-setting-row page-setting__bleed__content")
      div(v-for="bleed in bleedsToShow" class='page-setting__bleed__content__item')
        div(class='page-setting__bleed__content__item__label')
          span(class="body-XS text-gray-2") {{bleed.label}}
        div(class='page-setting__bleed__content__item__input')
          div(class='page-setting__bleed__content__item__input__icon pointer'
              @click="addBleed(bleed.key, 1, isLocked)")
            svg-icon(iconName="chevron-up"
              iconWidth="14px"
              iconColor="gray-2")
          div(class='page-setting__bleed__content__item__input__icon pointer'
              @click="addBleed(bleed.key, -1, isLocked)")
            svg-icon(iconName="chevron-up"
              iconWidth="14px"
              iconColor="gray-2"
              :style="{transform: 'scaleY(-1)'}")
          div(class='page-setting__bleed__content__item__input__value body-XS')
            input(type="number" min="0"
                  :value="bleed.value"
                  @input="setBleed($event, bleed.key, isLocked)"
                  @blur="handleBleedSubmit()"
                  @keyup="handleBleedSubmit")
            span(class='text-gray-3') {{sizeToShow.unit}}
      div(class="page-setting__bleed__content__lock-icon")
        div(class="page-setting__bleed__content__lock-icon__box"
            :style="isLocked ? {background: '#E7EFFF'} : {}")
          svg-icon(class="pointer"
                  :iconName="isLocked ? 'lock' : 'unlock'"
                  iconWidth="15px"
                  iconColor="gray-2"
                  @click="toggleLock()")
  div(class="page-setting__footer")
  div(v-if="showAdminTool"
    class="template-information")
    div(class="template-information__divider pb-10")
    btn(:type="'primary-sm'" class="rounded my-5"
        style="padding: 8px 0; margin-left: 6%; width: 88%;"
        @click="getDataClicked()") 取 得 群 組 / 模 板 資 料
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
          div(v-if="dbGroupThemes.length === 0"
            class="body-1") 尚未設定
          div(v-else
            class="pr-10 cover-option body-4")
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
        div(v-if="groupId.length > 0 && !isGroupMember"
          class="text-red") 此模板不是上列群組的成員
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
        div(class="pt-10") plan(0：預設一般 / 1：Pro)
        div
          property-bar
            input(class="body-2 text-gray-2" min="0"
              v-model="templateInfo.plan")
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
            @click="updateDataClicked()") 更新
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
            @click="updateParentIdClicked()") 修改
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { notify } from '@kyvg/vue3-notification'
import SearchBar from '@/components/SearchBar.vue'
import RadioBtn from '@/components/global/RadioBtn.vue'
import PageSizeSelector from '@/components/editor/PageSizeSelector.vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import designApis from '@/apis/design-info'
import GeneralUtils from '@/utils/generalUtils'
import uploadUtils from '@/utils/uploadUtils'
import { Itheme, ICoverTheme, IThemeTemplate } from '@/interfaces/theme'
import { IBleed, IPage } from '@/interfaces/page'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import resizeUtils from '@/utils/resizeUtils'
import { STR_UNITS, PRECISION } from '@/utils/unitUtils'
import { round } from 'lodash'

export default defineComponent({
  emits: [],
  components: {
    SearchBar,
    RadioBtn,
    PageSizeSelector
  },
  data() {
    return {
      isLocked: true,
      isPanelOpen: false,
      isGetGroup: false,
      isGetTemplate: false,
      updateParentIdChecked: false,
      localeOptions: ['tw', 'us', 'jp'],
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
        plan: '' as string,
        width: '' as string,
        height: '' as string,
        theme_ids: '' as string,
        parent_id: '' as string,
        parent_locale: '' as string,
        grandparent_id: '' as string,
        grandparent_locale: '' as string,
        grandchildren_id: [] as {
          childrenId: string
          childrenLocale: string
          grandchildren: {
            key_id: string
            locale: string
          }[]
        }[]
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
      unsetThemeTemplate: [] as string[],
      showBleedSettings: true,
      unitOptions: STR_UNITS,
      bleeds: pageUtils.getDefaultBleeds('px'),
      bleedsToShow: {
        top: {
          key: 'top',
          label: `${this.$t('NN0781')}`,
          value: ''
        },
        bottom: {
          key: 'bottom',
          label: `${this.$t('NN0782')}`,
          value: ''
        },
        left: {
          key: 'left',
          label: `${this.$t('NN0783')}`,
          value: ''
        },
        right: {
          key: 'right',
          label: `${this.$t('NN0784')}`,
          value: ''
        }
      } as {[index: string]: {key: string, label: string, value: string}}
    }
  },
  mounted: function () {
    Object.keys(this.currentPageBleeds).forEach(key => {
      this.bleeds[key] = this.currentPageBleeds[key]
      this.bleedsToShow[key].value = round(this.currentPageBleeds[key], this.sizeToShow.unit === 'px' ? 0 : PRECISION).toString()
    })
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
        plan: '',
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
    currentPageBleeds: function (newVal) {
      Object.keys(newVal).forEach(key => {
        this.bleeds[key] = newVal[key]
      })
    },
    bleeds: {
      handler: function(newVal) {
        Object.keys(newVal).forEach(key => {
          this.bleedsToShow[key].value = round(newVal[key], this.sizeToShow.unit === 'px' ? 0 : PRECISION).toString()
        })
      },
      deep: true
    },
    hasBleed: function () {
      this.showBleedSettings = true
    }
  },
  computed: {
    ...mapState('layouts', [
      'categories'
    ]),
    ...mapGetters({
      getPage: 'getPage',
      getPages: 'getPages',
      token: 'user/getToken',
      groupId: 'getGroupId',
      groupType: 'getGroupType',
      pagesLength: 'getPagesLength',
      showAdminTool: 'user/showAdminTool'
    }),
    currentPageBleeds(): IBleed {
      const currPage = pageUtils.currFocusPage
      let bleeds = currPage?.physicalBleeds ?? currPage?.bleeds ?? pageUtils.getDefaultBleeds(currPage.unit)
      bleeds = {
        top: this.groupType === 1 ? this.getPage(0).physicalBleeds?.top ?? this.getPage(0).bleeds?.top ?? 0 : bleeds.top,
        bottom: this.groupType === 1 ? this.getPage(this.pagesLength - 1).physicalBleeds?.bottom ?? this.getPage(this.pagesLength - 1).bleeds?.bottom ?? 0 : bleeds.bottom,
        left: bleeds.left,
        right: bleeds.right
      }
      return bleeds
    },
    sizeToShow(): {width: number, height: number, unit: string} {
      const { width, height, physicalWidth, physicalHeight, unit } = pageUtils.currFocusPageSizeWithBleeds
      return {
        width: round(physicalWidth ?? width ?? 0, PRECISION),
        height: round(physicalHeight ?? height ?? 0, PRECISION),
        unit: unit ?? 'px'
      }
    },
    hasBleed(): boolean {
      return this.getPages.some((page: IPage) => page.isEnableBleed)
    },
    key_id(): string {
      return this.getPage(pageUtils.currFocusPageIndex).designId
    },
    isGroupMember(): boolean {
      if (this.groupId.length === 0) {
        return false
      } else if (this.groupInfo.contents.some(template => template.key_id === this.key_id)) {
        return true
      } else {
        return false
      }
    }
  },
  methods: {
    ...mapMutations({
      updatePageProps: 'UPDATE_pageProps',
      setIsloading: 'SET_isGlobalLoading'
    }),
    ...mapActions('layouts', [
      'getRecently'
    ]),
    toggleLock() {
      this.isLocked = !this.isLocked
    },
    setSuggestionPanel(opened: boolean) {
      this.isPanelOpen = opened
    },
    toggleSuggestionPanel() {
      this.setSuggestionPanel(!this.isPanelOpen)
    },
    async getDataClicked() {
      this.setIsloading(true)

      this.resetStatus()
      const data = {}
      if (this.groupId.length === 0 && this.key_id.length === 0) {
        notify({ group: 'copy', text: '無群組及模板id' })
      }
      if (this.groupId.length > 0) {
        const groupRes = await designApis.getDesignInfo(this.token, 'group', this.groupId, 'select', JSON.stringify(data))
        if (groupRes.data.flag === 0) {
          this.isGetGroup = true
          this.setGroupInfo(groupRes.data)
        } else {
          notify({ group: 'copy', text: '找不到群組資料' })
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
          notify({ group: 'copy', text: '找不到模板資料' })
        }
      }

      this.setIsloading(false)
    },
    async updateGroupClicked() {
      const coverId = this.groupInfo.groupThemes.map(theme => {
        return String(theme.id) + ':' + this.groupInfo.contents[theme.coverIndex].key_id
      })
      this.setIsloading(true)
      const data = {
        cover_ids: coverId.join(),
        contents: this.groupInfo.contents
      }

      const res = await designApis.updateDesignInfo(this.token, 'group', this.groupId, 'update', JSON.stringify(data))
      if (res.data.flag === 0) {
        notify({ group: 'copy', text: '群組資料更新成功' })
        this.setGroupInfo(res.data)
      } else {
        notify({ group: 'copy', text: '更新時發生錯誤' })
      }
      this.resetStatus()
      this.setIsloading(false)
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
        notify({ group: 'copy', text: '請先取得模板資料' })
        return
      }
      if (themeIds === '' || themeIds.length === 0) {
        notify({ group: 'copy', text: 'theme_ids不得為空' })
        return
      }

      this.setIsloading(true)
      const data = {
        locale: this.templateInfo.locale,
        plan: this.templateInfo.plan ? this.templateInfo.plan : '0',
        tags_tw: this.templateInfo.tags_tw,
        tags_us: this.templateInfo.tags_us,
        tags_jp: this.templateInfo.tags_jp,
        theme_ids: themeIds
      }
      const res = await designApis.updateDesignInfo(this.token, 'template', this.templateInfo.key_id, 'update', JSON.stringify(data))
      if (res.data.flag === 0) {
        notify({ group: 'copy', text: '模板資料更新成功' })
        this.setTemplateInfo(res.data)
      } else {
        notify({ group: 'copy', text: '更新時發生錯誤' })
      }
      this.resetStatus()
      this.isGetGroup = false
      this.unsetThemeTemplate = []
      this.groupErrorMsg = ''
      this.setIsloading(false)
    },
    updateParentIdClicked() {
      if (!this.updateParentIdChecked) {
        notify({ group: 'copy', text: '請先勾選確定修改' })
        return
      }
      this.updatePageProps({
        pageIndex: pageUtils.currFocusPageIndex,
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
          notify({ group: 'copy', text: '有模板尚未設定theme，請設定完後再更新群組資訊' })
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
      coverList.forEach((cover) => {
        const id = parseInt(cover.split(':')[0])
        if (id === 0) {
          return
        }
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

      // 比較 cover_ids 是否有設定錯誤
      const coverIds = this.groupInfo.groupThemes.map(theme => {
        return String(theme.id) + ':' + this.groupInfo.contents[theme.coverIndex].key_id
      })
      const dbCoverIds = this.dbGroupThemes.map(theme => {
        return String(theme.id) + ':' + this.groupInfo.contents[theme.coverIndex].key_id
      })
      const sameCoverId = coverIds.join(',') === dbCoverIds.join(',')
      if (!sameCoverId) {
        this.showDbGroup = true
      }
    },
    setTemplateInfo(data: any) {
      this.showDbTemplate = false
      this.templateThemes = []
      this.templateInfo = data.data
      this.templateInfo.edit_time = this.templateInfo.edit_time.replace(/T/, ' ').replace(/\..+/, '')
      if (this.templateInfo.theme_ids === '0' ||
        this.templateInfo.theme_ids.length === 0) {
        notify({ group: 'copy', text: '尚未設定主題' })
      }
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
          notify({ group: 'copy', text: `${text} 已複製` })
        })
    },
    isDisabled(idx: number, themeWidth: number, themeHeight: number) {
      const themeAspectRatio = themeWidth / themeHeight
      const templateAspectRatio = parseInt(this.templateInfo.width) / parseInt(this.templateInfo.height)
      if (themeHeight === 0) { // 詳情頁模板
        return false
      } else if (themeAspectRatio === templateAspectRatio) {
        return false
      } else if ((String(themeWidth) === this.templateInfo.width || themeWidth === 0) &&
        (String(themeHeight) === this.templateInfo.height || themeHeight === 0)) {
        return false
      } else { // Disabled
        if (this.templateThemes[idx]) {
          this.showDbTemplate = true
          this.templateThemes[idx] = false
        }
        return true
      }
    },
    expandIconStyles() {
      return this.showBleedSettings ? {} : { transform: 'scaleY(-1)' }
    },
    setBleed(evt: Event, key: string, all = false) {
      const value = (evt.target as HTMLInputElement).value
      this.bleedsToShow[key].value = value
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      const striped = numValue.toString() !== value
      const roundedValue = round(numValue, this.sizeToShow.unit === 'px' ? 0 : PRECISION)
      const rounded = this.bleeds[key] !== roundedValue
      const strValue = !striped || rounded ? roundedValue.toString() : this.bleedsToShow[key].value
      this.bleeds[key] = roundedValue
      this.bleedsToShow[key].value = strValue

      console.log('set bleed', { ...this.currentPageBleeds }, value)
      if (all) {
        Object.keys(this.bleeds).forEach((key) => {
          this.bleeds[key] = roundedValue
          this.bleedsToShow[key].value = strValue
        })
      }
      this.applyBleeds(key, all)
    },
    addBleed(key: string, value: number, all = false) {
      console.log('add bleed', { ...this.currentPageBleeds }, value)
      if (all) {
        Object.keys(this.bleeds).forEach((key) => {
          this.bleeds[key] = Math.max(this.bleeds[key] + value, 0)
          this.bleedsToShow[key].value = this.bleeds[key].toString()
        })
      } else {
        this.bleeds[key] = Math.max(this.bleeds[key] + value, 0)
        this.bleedsToShow[key].value = this.bleeds[key].toString()
      }
      this.applyBleeds(key, all)
      stepsUtils.record()
    },
    applyBleeds(key: string, all: boolean) {
      // resize all bleeds of all pages if is email marketing design
      if (this.groupType === 1) {
        if (!all && (key === 'top' || key === 'bottom')) {
          const pageIndex = key === 'top' ? 0 : this.pagesLength - 1
          resizeUtils.resizeBleeds(pageIndex, {
            top: key === 'top' ? this.bleeds.top : 0,
            bottom: key === 'bottom' ? this.bleeds.bottom : 0,
            left: this.bleeds.left,
            right: this.bleeds.right
          })
        } else {
          for (let pageIndex = 0; pageIndex < this.pagesLength; pageIndex++) {
            resizeUtils.resizeBleeds(pageIndex, {
              top: pageIndex === 0 ? this.bleeds.top : 0,
              bottom: pageIndex === this.pagesLength - 1 ? this.bleeds.bottom : 0,
              left: this.bleeds.left,
              right: this.bleeds.right
            })
          }
        }
      } else resizeUtils.resizeBleeds(pageUtils.currFocusPageIndex, this.bleeds)
    },
    handleBleedSubmit(evt?: KeyboardEvent) {
      if (!evt || evt.key === 'Enter') {
        Object.keys(this.bleeds).forEach(key => {
          if (isNaN(this.bleeds[key])) {
            this.bleeds[key] = 0
            this.bleedsToShow[key].value = '0'
          }
        })
        stepsUtils.record()
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.page-setting {
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
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    padding: 9px 10px;
    border-radius: 4px;
    &__box {
      width: 64px;
      height: 22px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      text-align: center;
      & span {
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
      }
    }
  }
  &__apply {
    height: 36px;
    border-radius: 3px;
    text-align: center;
    margin-top: 19px;
    width: 90%;
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
  &__bleed {
    margin-top: 19px;
    &__title {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    &__content {
      margin-top: 10px;
      display: grid;
      grid-template-columns: 1fr 1fr 24px;
      gap: 8px;
      &__item {
        &__label {
          height: 22px;
          display: flex;
          align-items: center;
        }
        &__input {
          border: 1px solid setColor(gray-4);
          border-radius: 4px;
          display: grid;
          grid-template-columns: 30px auto;
          overflow: hidden;
          &__icon {
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-right: 1px solid setColor(gray-4);
            &:active {
              background: setColor(blue-4);
            }
          }
          &__value {
            padding: 6px;
            grid-row: 1 / span 2;
            grid-column: 2;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
        }
      }
      &__lock-icon {
        grid-row: 1 / span 2;
        grid-column: 3;
        display: flex;
        align-items: center;
        padding-top: 22px;
        &__box {
          box-sizing: border-box;
          width: 24px;
          height: 24px;
          border: 1px solid setColor(gray-4);
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
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
    color: white;
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
          }
        }
      }
      &__hr {
        margin-top: 31px;
        margin-bottom: 31px;
      }
      &__recently {
        width: 88%;
      }
      &__typical-name {
        width: 37%;
      }
      &__typical-size {
        width: 45%;
        white-space: nowrap;
        transform: scale(0.85);
      }
    }
  }

  &__footer {
    height: 20px;
  }
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

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
