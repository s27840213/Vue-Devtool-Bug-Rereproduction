import { UploadMap } from '@/types/api'
import { defineStore } from 'pinia'

export const useUploadStore = defineStore('upload', () => {
  const uploadMap = ref(undefined as UploadMap | undefined)
  const setUploadMap = (value: UploadMap) => {
    uploadMap.value = value
  }
  return { uploadMap, setUploadMap }
})
