import type { GenImageParams } from '@/types/api';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  const prevGenParams = reactive({
    requestId: '',
    params: {} as GenImageParams,
  })

  const setPrevGenParams = (params: { requestId: string; params: GenImageParams }) => {
    Object.assign(prevGenParams, params)
  }

  return {
    prevGenParams,
    setPrevGenParams,
  }
})
