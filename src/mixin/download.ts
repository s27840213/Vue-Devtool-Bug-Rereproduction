import { IDownloadServiceParams, IOutputType, ITypeOption } from '@/interfaces/download'
import DownloadUtil from '@/utils/downloadUtil'
import generalUtils from '@/utils/generalUtils'
import gtmUtils from '@/utils/gtmUtils'
import pageUtils from '@/utils/pageUtils'
import paymentUtils from '@/utils/paymentUtils'
import webViewUtils from '@/utils/picWVUtils'
import uploadUtils from '@/utils/uploadUtils'
import { notify } from '@kyvg/vue3-notification'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

const submission = `${process.env.VUE_APP_VERSION}::download_submission`
export default defineComponent({
  props: {
    useExternelJSON: {
      type: Boolean,
      default: false
    },
    pageIndex: {
      type: Number,
      required: true
    },
    hideContainer: {
      default: false,
      type: Boolean
    }
  },
  emits: ['close', 'inprogress'],
  data() {
    const {
      selectedTypeVal,
      rangeType = 'current',
      pageRange = [],
      selectedDetailPage,
      selectedDev = 1,
      ...prevSubmission
    } = JSON.parse(this.$isTouchDevice() ? '{}' : localStorage.getItem(submission) || '{}')

    const typeOptions = [
      { value: 'png', name: 'PNG', desc: `${this.$t('NN0217')}`, tag: `${this.$t('NN0131')}` },
      { value: 'jpg', name: 'JPG', desc: `${this.$t('NN0218')}` },
      { value: 'pdf_standard', name: `${this.$t('NN0770')}`, desc: `${this.$t('NN0772')}` },
      { value: 'pdf_print', name: `${this.$t('NN0771')}`, desc: `${this.$t('NN0773')}`, tag: 'pro' }
      // { id: 'svg', name: 'SVG', desc: '各種尺寸的清晰向量檔' },
      // { id: 'mp4', name: 'MP4 影片', desc: '高畫質影片' },
      // { id: 'gif', name: 'GIF', desc: '短片' }
    ] as ITypeOption[]

    let defaultSelectedTypeVal = 'jpg'
    let defaultOptions = DownloadUtil.getTypeAttrs(defaultSelectedTypeVal)

    // apply saved options if exist
    if (typeOptions.map(v => v.value).includes(selectedTypeVal)) {
      defaultSelectedTypeVal = selectedTypeVal
      defaultOptions = DownloadUtil.getTypeAttrs(selectedTypeVal)
      Object.keys(defaultOptions).forEach(key => {
        defaultOptions[key] = (key in prevSubmission ? prevSubmission : defaultOptions)[key]
      })
    }

    const prevInfo = {
      saveSubmission: true,
      // saveSubmission: !!selectedTypeVal,
      selected: defaultOptions,
      selectedTypeVal: defaultSelectedTypeVal as IOutputType,
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
      downloaded: false,
      progress: -1,
      exportId: '',
      functionQueue: [] as Array<() => void>,
      scaleOptions: [0.5, 0.75, 1, 1.5, 2, 2.5, 3],
      colorFormats: {
        pdf_standard: [{ value: 0, label: 'RGB' }],
        pdf_print: [
          { value: 0, label: 'RGB' },
          { value: 1, label: 'CMYK' }
        ]
      } as {[key: string]: { value: number, label: string }[]},
      detailPageDownloadOptions: [
        { value: 'whole', label: this.$t('NN0347') as string },
        { value: 'splice', label: this.$t('NN0348') as string }
      ],
      selectedDetailPage: selectedDetailPage || {
        option: 'splice',
        noLimit: false,
        height: 1500
      },
      typeOptions,
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
    inReviewMode(): boolean {
      return webViewUtils.inReviewMode
    },
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
    selectedBleed: {
      get(): number {
        return this.selected.bleed ?? 0
      },
      set(curr: 0 | 1 | 2 | false | true) {
        this.selected.bleed = Number(curr) as 0 | 1
      }
    },
    selectedOmitBg: {
      get(): number {
        return this.selected.omitBackground ?? 0
      },
      set(curr: 0 | 1 | false | true) {
        this.selected.omitBackground = Number(curr) as 0 | 1
      }
    },
    selectedOutline: {
      get(): number {
        return this.selected.outline ?? 1
      },
      set(curr: 0 | 1 | 2 | false | true) {
        this.selected.outline = Number(curr) as 0 | 1
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
    rangeTypeText(): string {
      switch (this.rangeType) {
        case 'all':
          return `${this.$t('NN0126')}`
        case 'spec':
          return `${this.$t('NN0127')} ${this.selectedPageIndexText}`
        case 'current':
          return `${this.$t('NN0125')}（${this.$t('NN0134', { num: `${this.currentPageIndex + 1}` })}）`
        default:
          return ''
      }
    },
    selectedPageIndexText(): string {
      const tmp = [...this.pageRange]
      tmp.sort((a, b) => a - b)

      // covert array of boolean to [[1,2,3], [5,6], [8]]
      const pageSelectedGroup = tmp.reduce((prev, curr): Array<Array<number>> => {
        const lastIndex = prev.length - 1
        if (prev[lastIndex] && prev[lastIndex][prev[lastIndex].length - 1] + 1 === curr) {
          prev[lastIndex].push(curr)
        } else {
          prev.push([curr])
        }
        return prev
      }, [])
      // covert array of boolean to [[1,2,3], [5,6], [8]]
      // const pageSelectedGroup = preSelected
      //   .reduce((prev: Array<number[]>, curr: boolean, idx: number) => {
      //     const lastIndex = prev.length - 1
      //     curr ? (prev[lastIndex].push(idx + 1)) : (prev.push([]))
      //     return prev
      //   }, [[]] as Array<number[]>)

      const result = pageSelectedGroup
        .map((group: Array<number>) => group.length > 1 ? `${group[0] + 1}-${group.pop()! + 1}` : group[0] + 1)
        .join(',')

      return result
    }
  },
  mounted() {
    if (this.useExternelJSON) return
    const id = generalUtils.generateAssetId()
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
            this.$router.replace({ query: Object.assign({}, this.$router.currentRoute.value.query, { export_ids: this.exportIds }) })
            uploadUtils.uploadDesign()
          } else {
            notify({ group: 'error', text: `${this.$t('NN0461')} (status: ${status})` })
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
    handleColorModeSelect(data: { value: number }) {
      Object.assign(this.selected, { cmyk: data.value })
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
    handleSubmit(useDev = false, downloadMode = 'default' as 'default' | 'current' | 'all') {
      if (downloadMode !== 'default') {
        if (this.selectedTypeVal === 'pdf_print' && !paymentUtils.checkPro({ plan: 1 }, 'export-pdf-print')) return
      }
      this.polling = true
      this.exportId ? this.handleDownload(useDev, downloadMode) : (this.functionQueue = [() => this.handleDownload(useDev, downloadMode)])
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
    async handleDownload(useDev = false, downloadMode = 'default' as 'default' | 'current' | 'all') {
      this.polling = true
      const {
        exportId,
        selected,
        selectedTypeVal
      } = this
      this.handleSubmissionInfo()
      let fileInfo = {} as IDownloadServiceParams
      if (downloadMode === 'default') {
        fileInfo = Object.assign({}, {
          exportId,
          teamId: '',
          format: selectedTypeVal.includes('pdf') ? 'pdf' : selectedTypeVal,
          ...selected
        }, selectedTypeVal.includes('pdf') && {
          pdfQuality: selectedTypeVal === 'pdf_standard' ? 0
            : selectedTypeVal === 'pdf_print' ? 1
              : undefined
        }) as IDownloadServiceParams
      } else {
        fileInfo = Object.assign({}, {
          exportId,
          teamId: '',
          format: 'jpg',
          scale: 1,
          quality: 90,
          omitBackground: 0,
          bleed: 0
        }) as IDownloadServiceParams

        this.rangeType = downloadMode
      }

      if (this.isDetailPage) {
        this.selectedDetailPage.option === 'whole' && (fileInfo.merge = 1)
        if (this.selectedDetailPage.option === 'splice') {
          fileInfo.merge = 0
          if (!this.selectedDetailPage.noLimit && !selectedTypeVal.includes('pdf')) fileInfo.splitSize = this.selectedDetailPage.height
        }
      }

      if (['spec', 'current'].includes(this.rangeType)) {
        fileInfo.pageIndex = this.rangeType === 'current' ? `${this.currentPageIndex}` : this.pageRange.join(',')
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
                pageUtils.getPages.forEach((page, index) => {
                  if (pageUtils.hasDesignId(index)) {
                    gtmUtils.trackPageDownload(page.designId)
                  }
                })
                break
              }
              case 'spec': {
                this.pageRange.forEach((index: number) => {
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
            if (!this.$isTouchDevice()) {
              this.$emit('close')
            } else {
              this.polling = false
              this.progress = 0
              this.downloaded = true
            }
          }, 1000)
          break
        case 1:
          notify({ group: 'error', text: `${this.$t('NN0462')} (${msg})` })
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
