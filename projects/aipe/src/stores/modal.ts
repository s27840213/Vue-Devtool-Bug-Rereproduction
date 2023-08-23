import { defineStore } from 'pinia'

export interface INormalModal {
  title: string
  content: string
  confirmText: string
  cancelText: string
  confirm: () => void
  cancel: () => void
}

export const useModalStore = defineStore('modal', () => {
  const isModalOpen = ref(false)
  const modalInfo = reactive<INormalModal>({
    title: 'Tmp',
    content: 'tmp tmp tmp tmp',
    confirmText: '1234',
    cancelText: '4567',
    confirm: () => {},
    cancel: () => {}
  })

  const setNormalModalInfo = (newModalInfo: INormalModal) => {
    Object.assign(modalInfo, newModalInfo)
  }
  const openModal = () => {
    isModalOpen.value = true
  }

  const closeModal = () => {
    reset()
  }

  const reset = () => {
    isModalOpen.value = false
    Object.assign(modalInfo, {
      title: '',
      content: '',
      confirmText: '',
      cancelText: '',
      confirm: () => {},
      cancel: () => {}
    })
  }
  return { isModalOpen, modalInfo, setNormalModalInfo, closeModal, openModal }
})
