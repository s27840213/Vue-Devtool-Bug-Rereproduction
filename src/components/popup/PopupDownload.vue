<template lang="pug">
  div(class="popup-download text-left"
    v-click-outside="handleClose")
    div(class="body-3 mb-10") 檔案類型
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
          label="透明背景"
          @change="({ checked }) => handleUpdate('omitBackground', checked ? 1 : 0)")
      div(v-if="'scale' in selected"
        class="flex items-center mb-10")
        span 尺寸 x
        dropdown(class="mx-5 popup-download__size-scale"
          :options="scaleOptions"
          @select="option => handleUpdate('scale', option)") {{ selected.scale }}
        span 倍
      div(v-if="'quality' in selected"
        class="flex flex-column items-center mb-10")
        div(class="flex items-center full-width mb-5")
          span 品質
          property-bar(class="popup-download__size-scale ml-15")
            input(class="px-0"
              type="text"
              v-model.number="selectedTypeQuality")
        input(class="popup-download__range-input"
          v-model.number="selected.quality"
          max="100"
          min="1"
          v-ratio-change
          type="range")
      div(class="mb-10 pt-5") 選擇頁面
      div
        download-check-button(type="radio"
          class="mb-10"
          group-name="range"
          :label="`目前頁面（第${currentPageIndex + 1}頁）`"
          value="current"
          :default-checked="rangeType === 'current'"
          @change="handleRangeType")
        download-check-button(type="radio"
          class="mb-10"
          group-name="range"
          label="所有頁面"
          value="all"
          :default-checked="rangeType === 'all'"
          @change="handleRangeType")
        div(class="flex items-center")
          download-check-button(type="radio"
            group-name="range"
            value="spec"
            label="範圍"
            :default-checked="rangeType === 'spec'"
            @change="handleRangeType")
          download-page-selection(class="ml-5 w-75"
            @confirm="handleRangeConfirm")
      hr(class="popup-download__hr my-15")
      download-check-button(type="checkbox"
        class="mb-20"
        label="儲存以上設定"
        :default-checked="saveSubmission"
        @change="({ checked }) => handleSubmission(checked)")
    div
      btn(class="full-width body-3 rounded"
        :disabled="isButtonDisabled"
        @click.native="handleSubmit")
        svg-icon(v-if="polling"
          class="align-middle"
          iconName="loading"
          iconColor="white"
          iconWidth="20px")
        span(v-else) 下載
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import { ITypeOption } from '@/interfaces/download'
import DownloadUtil from '@/utils/downloadUtil'
import DownloadCheckButton from '@/components/download/DownloadCheckButton.vue'
import DownloadTypeOption from '@/components/download/DownloadTypeOption.vue'
import DownloadPageSelection from '@/components/download/DownloadPageSelection.vue'
import GeneralUtils from '@/utils/generalUtils'
import uploadUtils from '@/utils/uploadUtils'

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
    pageIndex: Number
  },
  data () {
    const { selectedTypeVal, ...prevSubmission } = JSON.parse(localStorage.getItem(submission) || '{}')
    const currentPageIndex = this.pageIndex || 0
    return {
      currentPageIndex,
      saveSubmission: !!selectedTypeVal,
      polling: false,
      functionQueue: [] as Array<() => void>,
      exportId: '',
      selected: selectedTypeVal ? prevSubmission : DownloadUtil.getTypeAttrs('png'),
      rangeType: 'current',
      pageRange: [] as number[],
      selectedTypeVal: selectedTypeVal || 'png',
      scaleOptions: [0.5, 1, 1.5, 2, 2.5, 3],
      typeOptions: [
        { value: 'png', name: 'PNG', desc: '品質影像：高 - 適用於透明底圖', tag: '建議' },
        { value: 'jpg', name: 'JPG', desc: '品質影像：一般。' }
        // { value: 'pdf_stardand', name: 'PDF 標準', desc: '檔案大小：小 - 適合多頁文件' }
        // { id: 'pdf_print', name: 'PDF 列印', desc: '檔案大小：高 - 適合多頁文件' },
        // { id: 'svg', name: 'SVG', desc: '各種尺寸的清晰向量檔' },
        // { id: 'mp4', name: 'MP4 影片', desc: '高畫質影片' },
        // { id: 'gif', name: 'GIF', desc: '短片' }
      ] as ITypeOption[]
    }
  },
  computed: {
    selectedType (): ITypeOption {
      const { selectedTypeVal, typeOptions } = this
      return typeOptions.find(typeOptions => typeOptions.value === selectedTypeVal) || typeOptions[0]
    },
    selectedTypeQuality: {
      get (): number {
        return this.selected.quality || 80
      },
      set (curr: string) {
        if (!Number.isNaN(+curr) && +curr > 0 && +curr <= 100) {
          this.selected.quality = +curr
        }
      }
    },
    isButtonDisabled (): boolean {
      const { rangeType, pageRange } = this
      const noPagesSelected = rangeType === 'spec' && pageRange.length === 0
      return this.polling || noPagesSelected
    }
  },
  mounted () {
    if (this.useExternelJSON) return
    const id = GeneralUtils.generateAssetId()
    uploadUtils.uploadExportJSON(id)
      .then(() => {
        this.exportId = id
      })
  },
  watch: {
    selectedType (type) {
      type && (this.selected = DownloadUtil.getTypeAttrs(type.value))
    },
    exportId (id) {
      if (id) {
        const func = this.functionQueue.shift()
        typeof func === 'function' && func()
      }
    }
  },
  methods: {
    handleClose () {
      if (!this.polling) {
        this.$emit('close')
      }
    },
    handleSelectType (type: ITypeOption) {
      this.selectedTypeVal = type.value
    },
    handleRangeType (data: { [key: string]: any }) {
      const { value } = data
      this.rangeType = value
    },
    handleUpdate (field: string, option: string | number) {
      Object.assign(this.selected, { [field]: option })
    },
    handleRangeConfirm (range: boolean[]) {
      this.rangeType = 'spec'
      this.pageRange = range
        .map((status: boolean, idx: number) => status ? idx : -1)
        .filter(idx => idx >= 0)
    },
    handleSubmission (checked: boolean) {
      this.saveSubmission = checked
    },
    handleSubmit () {
      this.polling = true
      this.exportId ? this.handleDownload() : (this.functionQueue = [this.handleDownload])
    },
    async handleDownload () {
      this.polling = true
      const {
        exportId,
        selected,
        pageRange,
        rangeType,
        selectedTypeVal,
        saveSubmission
      } = this
      saveSubmission
        ? localStorage.setItem(submission, JSON.stringify({ ...selected, selectedTypeVal }))
        : localStorage.removeItem(submission)

      const fileInfo = {
        exportId,
        teamId: '',
        format: selectedTypeVal,
        ...selected
      }

      if (['spec', 'current'].includes(rangeType)) {
        fileInfo.pageIndex = rangeType === 'current' ? `${this.currentPageIndex}` : pageRange.join(',')
      }

      DownloadUtil
        .getFileUrl(fileInfo)
        .then(this.handleDownloadProgress)
    },
    handleDownloadProgress (response: any) {
      const { flag, url, msg, progress } = response
      switch (flag) {
        case 0:
          DownloadUtil.downloadByUrl(url)
          this.$emit('close')
          break
        case 1:
          this.$notify({ group: 'error', text: `下載失敗，請重新下載 (${msg})` })
          this.$emit('close')
          break
        case 2:
          console.log('progress: ', progress)
          setTimeout(() => {
            DownloadUtil
              .getFileStatus(url)
              .then(this.handleDownloadProgress)
          }, 2000)
          break
      }
    }
  }
})
</script>

<style lang="scss" scoped>
  .popup-download {
    padding: 18px;
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    box-sizing: border-box;
    border-radius: 5px;
    box-shadow: 0px 4px 13px rgba(0, 0, 0, 0.25);
    background-color: setColor(white);
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
      white-space: nowrap;
      transform: scale(0.5);
      transform-origin: left;
      width: 0;
    }
    &__hr {
      border: none;
      border-top: 1px solid setColor(gray-4);
    }
    &__range-input {
      appearance: none;
      outline: none;
      background: none;
      flex: 1;
      &::-webkit-slider-runnable-track {
        height: 2px;
        background-color: setColor(gray-4);
      }
      &::-webkit-slider-thumb {
        appearance: none;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background-color: setColor(white);
        border: 2px solid #3c64b1;
        transition: 0.2s;
        margin-top: -6.5px;
        position: relative;
        cursor: pointer;
      }
    }
    &__size-scale {
      width: 65px;
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
      font-family: 'Mulish';
      font-size: 12px;
      line-height: 22px;
    }
    input {
      padding: 0;
    }
  }
</style>
