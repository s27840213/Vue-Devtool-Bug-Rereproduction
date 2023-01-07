<template lang="pug">
  div(class="popup-download text-left"
    :style="containerStyles"
    v-click-outside="handleClose")
    div(v-if="polling" class="popup-download__form popup-download__form--polling")
      div(class="body-3 text-gray-3") {{ name || `${$t('NN0079')}` }}
      div(class="flex flex-between text-gray-2 items-center")
        span(class="body-2") {{$t('NN0216')}}
        svg-icon(class="pointer"
          iconName="close"
          iconWidth="16px"
          iconColor="gray-2"
          @click.native="$emit('close')")
      div(class="popup-download__progress mt-5")
        div(class="popup-download__progress-value" :style="{ width: `${progress}%`}")
    div(v-else class="popup-download__form")
      div(class="body-3 mb-10") {{$t('NN0121')}}
      dropdown(class="mb-10"
        :options="typeOptions"
        @select="handleSelectType")
        download-type-option(:name="selectedType.name" :tag="selectedType.tag")
        template(v-slot:option="{ data }")
          div(class="popup-download__type")
            download-type-option(:name="data.name" :tag="data.tag")
            div(class="popup-download__type-desc") {{ data.desc }}
      div(class="body-3")
        div(v-if="'omitBackground' in selected")
          download-check-button(type="checkbox"
            class="mb-10"
            :label="`${$t('NN0215')}`"
            :default-checked="selected.omitBackground === 1"
            @change="({ checked }) => handleUpdate('omitBackground', checked ? 1 : 0)")
        div(v-if="'scale' in selected"
          class="flex items-center mb-10")
          span {{`${$t('NN0122')} x`}}
          dropdown(class="mx-5 popup-download__size-scale"
            :options="scaleOptions"
            @select="option => handleUpdate('scale', option)") {{ selected.scale }}
          span {{$t('NN0123')}}
        div(v-if="'quality' in selected"
          class="flex flex-column items-center mb-10")
          div(class="flex items-center full-width mb-5")
            span {{$t('NN0132')}}
            property-bar(class="popup-download__size-scale ml-15")
              input(class="px-0"
                type="text"
                v-model.number="selectedTypeQuality")
          input(class="popup-download__range-input input__slider--range"
            v-model.number="selected.quality"
            max="100"
            min="1"
            v-ratio-change
            type="range")
        div(v-if="'trim' in selected")
          download-check-button(type="checkbox"
            class="mb-10"
            :label="`${$t('NN0774')}`"
            :default-checked="!!selected.trim"
            @change="({ checked }) => {handleUpdate('trim', checked ? 1 : 0); if('bleed' in selected && checked && selected.bleed === 0) handleUpdate('bleed', 1)}")
        div(v-if="'bleed' in selected")
          download-check-button(type="checkbox"
            class="mb-10"
            :label="`${$t('NN0775')}`"
            :default-checked="!!selected.bleed"
            @change="({ checked }) => {handleUpdate('bleed', checked ? 1 : 0); if('trim' in selected && !checked && selected.trim === 1) handleUpdate('trim', 0)}")
        div(v-if="'outline' in selected")
          download-check-button(type="checkbox"
            class="mb-10"
            :label="`${$t('NN0794')}`"
            :default-checked="!!selected.outline"
            @change="({ checked }) => handleUpdate('outline', checked ? 1 : 0)")
        div(v-if="selectedTypeVal.includes('pdf')"
          class="flex items-center mb-10")
          span {{$t('NN0777')}}
          dropdown(v-if="colorFormats[selectedTypeVal].length > 1" class="mx-5 popup-download__color-format"
            :options="colorFormats[selectedTypeVal]"
            @select="option => handleUpdate('cmyk', option === 'CMYK' ? 1 : 0)") {{ colorFormats[selectedTypeVal][selected.cmyk ? 1 : 0] }}
          div(v-if="colorFormats[selectedTypeVal].length === 1" class="popup-download__color-format fixed")
            span(class="body-XS") {{ colorFormats[selectedTypeVal][selected.cmyk ? 1 : 0] }}
        div(v-if="isDetailPage" class="mb-10 pt-5") {{ $t('NN0344') }}
          dropdown(class="mt-5"
            :options="detailPageDownloadOptions"
            @select="handleDetailPageOption") {{ detailPageOptionLabel }}
          div(v-if="selectedDetailPage.option === 'splice' && !selectedTypeVal.includes('pdf')"
            class="mt-10")
            download-check-button(type="radio"
              class="mb-10"
              group-name="product_page"
              :label="$t('NN0345')"
              :default-checked="selectedDetailPage.noLimit"
              @change="handleDetailPageIsLimited"
              value="no-limit")
            div
              download-check-button(type="radio"
                class="mb-5"
                group-name="product_page"
                :label="$t('NN0346')"
                :default-checked="!selectedDetailPage.noLimit"
                @change="handleDetailPageIsLimited"
                value="height-limit")
              div(class="flex items-center")
                property-bar(class="popup-download__size-scale ml-20 mr-5")
                  input(type="text"
                    v-model.number="selectedDetailPage.height"
                    :disabled="selectedDetailPage.noLimit"
                    @blur="handleMaxHeight")
                span px
        div(class="mb-10 pt-5") {{$t('NN0124')}}
        div
          download-check-button(type="radio"
            class="mb-10"
            group-name="range"
            :label="`${$t('NN0125')}（${$t('NN0134', { num:`${currentPageIndex + 1}` })}）`"
            value="current"
            :default-checked="rangeType === 'current'"
            @change="handleRangeType")
          download-check-button(type="radio"
            class="mb-10"
            group-name="range"
            :label="`${$t('NN0126')}`"
            value="all"
            :default-checked="rangeType === 'all'"
            @change="handleRangeType")
          div(class="flex items-center")
            download-check-button(type="radio"
              group-name="range"
              value="spec"
              :label="`${$t('NN0127')}`"
              :default-checked="rangeType === 'spec'"
              @change="handleRangeType")
            download-page-selection(class="ml-5 w-75"
              :defaultSelected="pageRange"
              @confirm="handleRangeConfirm")
        template(v-if="isAdmin || onDev")
          hr(class="popup-download__hr my-15")
          div(class="dev-selector mb-10")
            dropdown(class="body-3 full-width"
                    :options="devs"
                    @select="handleDevSelect") {{ selectedDevLabel }}
          div
            btn(class="full-width body-3 rounded"
              :disabled="isButtonDisabled"
              @click.native="handleSubmit(true)")
              svg-icon(v-if="polling"
                class="align-middle"
                iconName="loading"
                iconColor="white"
                iconWidth="20px")
              span(v-else) {{`${$t('NN0010')} (${$t('NN0460')})`}}
        hr(class="popup-download__hr my-15")
        download-check-button(type="checkbox"
          class="mb-20"
          :label="`${$t('NN0129')}`"
          :default-checked="saveSubmission"
          @change="({ checked }) => handleSubmission(checked)")
      div
        btn(class="full-width body-3 rounded"
          :disabled="isButtonDisabled"
          @click.native="handleSubmit()")
          svg-icon(v-if="polling"
            class="align-middle"
            iconName="loading"
            iconColor="white"
            iconWidth="20px")
          span(v-else) {{$t('NN0010')}}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import vClickOutside from 'v-click-outside'
import { IDownloadServiceParams, ITypeOption } from '@/interfaces/download'
import DownloadUtil from '@/utils/downloadUtil'
import DownloadCheckButton from '@/components/download/DownloadCheckButton.vue'
import DownloadTypeOption from '@/components/download/DownloadTypeOption.vue'
import DownloadPageSelection from '@/components/download/DownloadPageSelection.vue'
import GeneralUtils from '@/utils/generalUtils'
import uploadUtils from '@/utils/uploadUtils'
import pageUtils from '@/utils/pageUtils'
import gtmUtils from '@/utils/gtmUtils'

const submission = `${process.env.VUE_APP_VERSION}::download_submission`

export default Vue.extend({
  components: {
    DownloadCheckButton,
    DownloadTypeOption,
    DownloadPageSelection
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    useExternelJSON: Boolean,
    pageIndex: Number,
    hideContainer: {
      default: false,
      type: Boolean
    }
  },
  data() {
    const {
      selectedTypeVal,
      rangeType = 'current',
      pageRange = [],
      selectedDetailPage,
      selectedDev = 1,
      ...prevSubmission
    } = JSON.parse(localStorage.getItem(submission) || '{}')

    const prevInfo = {
      saveSubmission: true,
      // saveSubmission: !!selectedTypeVal,
      selected: selectedTypeVal ? prevSubmission : DownloadUtil.getTypeAttrs('jpg'),
      selectedTypeVal: selectedTypeVal || 'jpg',
      rangeType,
      pageRange: rangeType === 'spec' ? pageRange : [],
      selectedDev
    }
    const currentPageIndex = this.pageIndex || 0
    const host = window.location.hostname
    return {
      ...prevInfo,
      currentPageIndex,
      polling: false,
      progress: -1,
      exportId: '',
      functionQueue: [] as Array<() => void>,
      scaleOptions: [0.5, 0.75, 1, 1.5, 2, 2.5, 3],
      colorFormats: {
        pdf_standard: ['RGB'],
        pdf_print: ['RGB', 'CMYK']
      },
      detailPageDownloadOptions: [
        { value: 'whole', label: this.$t('NN0347') as string },
        { value: 'splice', label: this.$t('NN0348') as string }
      ],
      selectedDetailPage: selectedDetailPage || {
        option: 'splice',
        noLimit: false,
        height: 1500
      },
      typeOptions: [
        { value: 'png', name: 'PNG', desc: `${this.$t('NN0217')}`, tag: `${this.$t('NN0131')}` },
        { value: 'jpg', name: 'JPG', desc: `${this.$t('NN0218')}` },
        { value: 'pdf_standard', name: `${this.$t('NN0770')}`, desc: `${this.$t('NN0772')}` },
        { value: 'pdf_print', name: `${this.$t('NN0771')}`, desc: `${this.$t('NN0773')}` }
        // { id: 'svg', name: 'SVG', desc: '各種尺寸的清晰向量檔' },
        // { id: 'mp4', name: 'MP4 影片', desc: '高畫質影片' },
        // { id: 'gif', name: 'GIF', desc: '短片' }
      ] as ITypeOption[],
      devs: [
        { value: 1, label: 'dev0' },
        { value: 2, label: 'dev1' },
        { value: 3, label: 'dev2' },
        { value: 4, label: 'dev3' },
        { value: 5, label: 'dev4' },
        { value: 6, label: 'dev5' },
        { value: 998, label: 'qa' },
        { value: 999, label: 'rd' }
      ],
      onDev: host.startsWith('qa') || host.startsWith('rd') || host.startsWith('dev') || host.startsWith('localhost')
    }
  },
  computed: {
    ...mapState(['name', 'groupType', 'exportIds']),
    ...mapGetters('user', {
      isAdmin: 'isAdmin'
    }),
    selectedType(): ITypeOption {
      const { selectedTypeVal, typeOptions } = this
      return typeOptions.find(typeOptions => typeOptions.value === selectedTypeVal) || typeOptions[0]
    },
    selectedTypeQuality: {
      get(): number {
        return this.selected.quality || 80
      },
      set(curr: string) {
        if (!Number.isNaN(+curr) && +curr > 0 && +curr <= 100) {
          this.selected.quality = +curr
        }
      }
    },
    isButtonDisabled(): boolean {
      const { rangeType, pageRange } = this
      const noPagesSelected = rangeType === 'spec' && pageRange.length === 0
      return this.polling || noPagesSelected
    },
    isDetailPage(): boolean {
      return this.groupType === 1
    },
    detailPageOptionLabel(): string {
      const { selectedDetailPage, detailPageDownloadOptions = [] } = this
      return detailPageDownloadOptions.find(option => option.value === selectedDetailPage.option)?.label ?? ''
    },
    selectedDevLabel(): string {
      const { selectedDev, devs } = this
      return devs.find(option => option.value === selectedDev)?.label ?? ''
    },
    containerStyles(): { [index: string]: string } {
      return this.hideContainer ? {
      } : {
        padding: '18px',
        'border-radius': '5px',
        'box-shadow': '0px 4px 13px rgba(0, 0, 0, 0.25)',
        'background-color': 'white'
      }
    }
  },
  mounted() {
    if (this.useExternelJSON) return
    const id = GeneralUtils.generateAssetId()
    this.handleUploadJSON(id)
  },
  watch: {
    selectedType(type) {
      type && (this.selected = DownloadUtil.getTypeAttrs(type.value))
    },
    exportId(id) {
      if (id) {
        const func = this.functionQueue.shift()
        typeof func === 'function' && func()
      }
    }
  },
  methods: {
    ...mapMutations({
      addExportId: 'ADD_exportIds'
    }),
    handleUploadJSON(id: string) {
      /**
       * @Todo check the upload design function
       */
      return uploadUtils.uploadExportJSON(id)
        .then((res: any) => {
          const { status } = res?.target
          if (status === 204) {
            this.addExportId(id)
            this.exportId = id
            this.$router.replace({ query: Object.assign({}, this.$router.currentRoute.query, { export_ids: this.exportIds }) })
            uploadUtils.uploadDesign()
          } else {
            this.$notify({ group: 'error', text: `${this.$t('NN0461')} (status: ${status})` })
            this.$emit('close')
          }
        })
    },
    handleClose() {
      if (!this.polling && !this.hideContainer) {
        this.$emit('close')
      }
    },
    handleSelectType(type: ITypeOption) {
      this.selectedTypeVal = type.value
    },
    handleRangeType(data: { [key: string]: any }) {
      const { value } = data
      this.rangeType = value
    },
    handleDetailPageOption(data: { [key: string]: any }) {
      this.selectedDetailPage.option = data.value
    },
    handleDetailPageIsLimited(data: { [key: string]: any }) {
      this.selectedDetailPage.noLimit = data.value === 'no-limit'
    },
    handleDevSelect(data: { value: number }) {
      this.selectedDev = data.value
    },
    handleMaxHeight(e: Event) {
      const value = +(e.target as HTMLInputElement).value
      if (Number.isNaN(value)) {
        this.selectedDetailPage.height = 400
      } else {
        this.selectedDetailPage.height = value < 400 ? 400 : value
      }
      (e.target as HTMLInputElement).value = `${this.selectedDetailPage.height}`
    },
    handleUpdate(field: string, option: string | number) {
      Object.assign(this.selected, { [field]: option })
    },
    handleRangeConfirm(range: boolean[]) {
      this.rangeType = 'spec'
      this.pageRange = range
        .map((status: boolean, idx: number) => status ? idx : -1)
        .filter(idx => idx >= 0)
    },
    handleSubmission(checked: boolean) {
      this.saveSubmission = checked
    },
    handleSubmit(useDev = false) {
      this.polling = true
      this.exportId ? this.handleDownload(useDev) : (this.functionQueue = [() => this.handleDownload(useDev)])
    },
    handleSubmissionInfo() {
      const pageLimit = pageUtils.getPages.length - 1
      this.pageRange = this.pageRange.filter((pageIndex: number) => pageIndex <= pageLimit)
      const { selectedDetailPage, saveSubmission, selected, selectedTypeVal, rangeType, pageRange, selectedDev } = this

      const info = {
        ...selected,
        selectedTypeVal,
        rangeType,
        pageRange,
        selectedDetailPage,
        selectedDev
      }

      saveSubmission
        ? localStorage.setItem(submission, JSON.stringify(info))
        : localStorage.removeItem(submission)
    },
    async handleDownload(useDev = false) {
      this.polling = true
      const {
        exportId,
        selected,
        rangeType,
        selectedTypeVal
      } = this
      this.handleSubmissionInfo()

      const fileInfo = Object.assign({}, {
        exportId,
        teamId: '',
        format: selectedTypeVal.includes('pdf') ? 'pdf' : selectedTypeVal,
        ...selected
      }, selectedTypeVal.includes('pdf') && {
        pdfQuality: selectedTypeVal === 'pdf_standard' ? 0
          : selectedTypeVal === 'pdf_print' ? 1
            : undefined
      }) as IDownloadServiceParams

      if (this.isDetailPage) {
        this.selectedDetailPage.option === 'whole' && (fileInfo.merge = 1)
        if (this.selectedDetailPage.option === 'splice') {
          fileInfo.merge = 0
          if (!this.selectedDetailPage.noLimit && !selectedTypeVal.includes('pdf')) fileInfo.splitSize = this.selectedDetailPage.height
        }
      }

      if (['spec', 'current'].includes(rangeType)) {
        fileInfo.pageIndex = rangeType === 'current' ? `${this.currentPageIndex}` : this.pageRange.join(',')
      }
      this.$emit('inprogress', true)
      DownloadUtil
        .getFileUrl(fileInfo, ((this.isAdmin || this.onDev) && useDev) ? this.selectedDev : 0)
        .then(this.handleDownloadProgress)
    },
    handleDownloadProgress(response: any) {
      const { flag, url, msg, progress } = response
      if ((this as any)._isDestroyed) return
      switch (flag) {
        case 0:
          this.progress = 100
          setTimeout(() => {
            DownloadUtil.downloadByUrl(url)
            const { rangeType } = this

            switch (rangeType) {
              case 'all': {
                pageUtils.getPages.map((page, index) => {
                  if (pageUtils.hasDesignId(index)) {
                    gtmUtils.trackPageDownload(page.designId)
                  }
                })
                break
              }
              case 'spec': {
                this.pageRange.map((index: number) => {
                  if (pageUtils.hasDesignId(index)) {
                    gtmUtils.trackPageDownload(pageUtils.getPage(index).designId)
                  }
                })
                break
              }
              case 'current': {
                if (pageUtils.hasDesignId(this.currentPageIndex)) {
                  gtmUtils.trackPageDownload(pageUtils.getPage(this.currentPageIndex).designId)
                }
                break
              }
            }
            this.$emit('close')
          }, 1000)
          break
        case 1:
          this.$notify({ group: 'error', text: `${this.$t('NN0462')} (${msg})` })
          this.$emit('close')
          break
        case 2:
          this.progress = progress
          setTimeout(() => {
            DownloadUtil
              .getFileStatus(url)
              .then(this.handleDownloadProgress)
          }, 500)
          break
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-download {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  box-sizing: border-box;
  &__form {
    min-height: 340px;
    transition: 0.3s;
    &--polling {
      min-height: 50px;
    }
  }
  &__type {
    padding: 5px 10px 0;
    line-height: 18px;
    cursor: pointer;
    &:hover {
      background-color: setColor(gray-5);
    }
  }
  &__type-desc {
    font-size: 18px;
    color: setColor(gray-3);
    transform: scale(0.5);
    transform-origin: left;
    width: 200%;
  }
  &__hr {
    border: none;
    border-top: 1px solid setColor(gray-4);
  }
  &__size-scale {
    width: 65px;
  }
  &__color-format {
    width: 65px;
    &.fixed {
      width: auto;
      margin-left: 8px;
      padding: 0px 8px;
      border: 1px solid setColor(gray-4);
      border-radius: 4px;
    }
  }
  &__progress {
    width: 100%;
    height: 8px;
    position: relative;
    border-radius: 4px;
    overflow: hidden;
    background-color: #f1f1f1;
  }
  &__progress-value {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    transition: 0.3s;
    border-radius: 4px;
    background-color: setColor(blue-1);
  }
  .property-bar,
  .btn {
    padding: 3px 10px;
  }
  .property-bar {
    box-sizing: border-box;
  }
  .btn,
  .property-bar,
  input {
    font-size: 12px;
    line-height: 22px;
  }
  input {
    padding: 0;
  }
  .dev-selector {
    display: flex;
  }
}
</style>
