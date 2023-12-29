import PixiRecorder from '@/utils/pixiRecorder'
import { defineStore } from 'pinia'

export interface IVideoRecordState {
  genVideoCb: null | (() => void),
  isGenVideo: boolean
}

const defaultState = {
  genVideoCb: null,
  isGenVideo: false
} as IVideoRecordState

const pixi = new PixiRecorder()

export const useVideoRcordStore = defineStore('videoRecord', {
  state: (): IVideoRecordState => ({ ...defaultState }),
  getters: {
  },
  actions: {
    addImage(img1: string, img2: string) {
      return pixi.addImage(img1, img2)
    },
    genVideo() {
      this.isGenVideo = true

      return pixi.genVideo()
        .then((res) => {
          if (res && this.genVideoCb) {
            this.genVideoCb()
          }
          return res
        }).finally(() => {
          this.isGenVideo = false
        })
    },
    saveToCameraRoll() {
      return pixi.saveToCameraRoll()
    }
  }
})
