<template lang="pug">
div(class="w-full flex-center gap-64 py-12 box-border")
  div(class="flex-center flex-col gap-4" @click="save")
    svg-icon(
      :iconName="'download'"
      :iconColor="'yellow-0'"
      :iconWidth="'24px'")
    span(class="text-yellow-0 typo-body-sm") {{ $t('STK0004') }}
  div(class="flex-center flex-col gap-4" @click="share")
    svg-icon(
      :iconName="'share'"
      :iconColor="'yellow-0'"
      :iconWidth="'24px'")
    span(class="text-yellow-0 typo-body-sm") {{ $t('NN0214') }}
  div(class="flex-center flex-col gap-4" @click="recreate")
    svg-icon(
      :iconName="'recreate'"
      :iconColor="'yellow-0'"
      :iconWidth="'24px'")
    span(class="text-yellow-0 typo-body-sm") {{ $t('CM0127') }}
  div(v-if="currOpenSubDesign?.type === 'powerful-fill'"
    class="flex-center flex-col gap-4" @click="edit")
    svg-icon(
      :iconName="'pencil'"
      :iconColor="'yellow-0'"
      :iconWidth="'24px'")
    span(class="text-yellow-0 typo-body-sm") {{ $t('NN0504') }}
</template>
<script setup lang="ts">
import useActionSheetCm from '@/composable/useActionSheetCm';
import { useMediaStore } from '@/stores/media';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore()
const { editSubDesignResult, initWithSubDesignConfig } = userStore
const { currOpenSubDesign } = storeToRefs(userStore)
const { setMediaParams, setInMediaOptions } = useMediaStore()

const {
  setSavingActions,
  setSharingActions,
  toggleActionSheet,
} = useActionSheetCm()

const save = () => {
  setSavingActions(
    () => {
      setMediaParams({
        action: 'save',
        media: 'photo'
      })
      setInMediaOptions(true)
      toggleActionSheet()
    },
    () => {
      setMediaParams({
        action: 'save',
        media: 'video'
      })
      setInMediaOptions(true)
      toggleActionSheet()
    },
    () => {
      setMediaParams({
        action: 'save',
        media: 'photo_video'
      })
      setInMediaOptions(true)
      toggleActionSheet()
    },
  )
  toggleActionSheet()
}

const share = () => {
  setSharingActions(
    () => {
      setMediaParams({
        action: 'share',
        media: 'photo'
      })
      setInMediaOptions(true)
      toggleActionSheet()
    },
    () => {
      setMediaParams({
        action: 'share',
        media: 'video'
      })
      setInMediaOptions(true)
      toggleActionSheet()
    }
  )
  toggleActionSheet()
}

const recreate = () => {
  if (!currOpenSubDesign.value) return
  initWithSubDesignConfig(currOpenSubDesign.value)
}

const edit = () => {
  editSubDesignResult()
}
</script>
<style lang="scss"></style>
