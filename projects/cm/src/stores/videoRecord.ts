import { useEditorStore } from '@/stores/editor'
import PixiRecorder from '@/utils/pixiRecorder'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import { defineStore } from 'pinia'

export interface IVideoRecordState {
  genVideoCb: null | (() => void)
  geningIdentifier: string
  isExportingVideo: boolean
}

const defaultState = {
  genVideoCb: null,
  geningIdentifier: '',
  isExportingVideo: false,
} as IVideoRecordState

const pixi = new PixiRecorder()

export const useVideoRcordStore = defineStore('videoRecord', {
  state: (): IVideoRecordState => ({ ...defaultState }),
  getters: {
    isGeningVideo: (state) => {
      return !!state.geningIdentifier
    },
  },
  actions: {
    addImage(img1: string, img2: string) {
      const editorStore = useEditorStore()
      const { updateGenResult } = editorStore
      const { currGeneratedResult } = storeToRefs(editorStore)
      return pixi.addImage(img1, img2).then(() => {
        if (currGeneratedResult.value && currGeneratedResult.value.id) {
          updateGenResult(currGeneratedResult.value.id, { videoSize: { ...pixi.videoSize } })
        }
      })
    },
    genVideo() {
      if (!pixi) throw new Error('pixi is undefined in genVideo')

      const currGeningId = generalUtils.generateRandomString(6)
      this.geningIdentifier = currGeningId
      const editorStore = useEditorStore()
      const { updateGenResult } = editorStore
      const { currGeneratedResult } = storeToRefs(editorStore)

      return pixi.genVideo().then((res) => {
        if (currGeningId !== this.geningIdentifier) return
        this.geningIdentifier = ''
        console.warn('genVideo done')
        if (res) {
          if (currGeneratedResult.value && currGeneratedResult.value.id) {
            updateGenResult(currGeneratedResult.value.id, { video: { ...pixi.video } })
          }
          if (this.genVideoCb) {
            this.genVideoCb()
            this.genVideoCb = null
          }
        }
        return res
      })
    },
    saveToDevice(data?: { url?: string; path?: string; revokeUrl?: boolean }) {
      if (!pixi) throw new Error('pixi is undefined in saveToDevice')
      const { url, path, revokeUrl } = data || {}

      return pixi.saveToDevice({ url, path, revokeUrl }).finally(() => {
        this.setIsExportVideo(false)
      })
    },
    setGenVideoCb(cb: () => void) {
      this.genVideoCb = cb
    },
    setIsExportVideo(bool: boolean) {
      this.isExportingVideo = bool
    },
  },
})
