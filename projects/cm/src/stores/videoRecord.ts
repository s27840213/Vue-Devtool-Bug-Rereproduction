import { useEditorStore } from '@/stores/editor'
import PixiRecorder from '@/utils/pixiRecorder'
import { defineStore } from 'pinia'

export interface IVideoRecordState {
  genVideoCb: null | (() => void),
  isGeningVideo: boolean
}

const defaultState = {
  genVideoCb: null,
  isGeningVideo: false
} as IVideoRecordState

const pixi = new PixiRecorder()

export const useVideoRcordStore = defineStore('videoRecord', {
  state: (): IVideoRecordState => ({ ...defaultState }),
  // getters: {
  // },
  actions: {
    addImage(img1: string, img2: string) {
      return pixi.addImage(img1, img2)
    },
    genVideo() {
      this.isGeningVideo = true
      const editorStore = useEditorStore()
      const { updateGenResult, currGeneratedResult } = editorStore

      return pixi.genVideo()
        .then((res) => {
          this.isGeningVideo = false
          if (res && this.genVideoCb) {
            updateGenResult(currGeneratedResult.id, { video: res })
            this.genVideoCb()
            this.genVideoCb = null
          }
          return res
        })
    },
    saveToCameraRoll(url?: string) {
      return pixi.saveToCameraRoll(url)
    },
    setGenVideoCb(cb: () => void) {
      this.genVideoCb = cb
    }
  }
})
