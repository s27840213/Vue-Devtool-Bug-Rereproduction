import { UploadMap } from '@/types/api'
import { defineStore } from 'pinia'

export const useUploadStore = defineStore('upload', () => {
  const uploadMap = ref(undefined as UploadMap | undefined)
  const useUsBucket = ref(false)

  const setUploadMap = (value: UploadMap) => {
    uploadMap.value = value
  }

  const setUseUsBucket = (value: boolean) => {
    useUsBucket.value = value
  }

  return { uploadMap, useUsBucket, setUploadMap, setUseUsBucket }
})
