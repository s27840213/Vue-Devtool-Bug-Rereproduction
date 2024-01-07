<template lang="pug">
div(class="px-16 pt-16 flex-center flex-col gap-16 relative")
  svg-icon(
    class="absolute top-10 right-16"
    iconName="close"
    iconColor="yellow-0"
    iconWidth="24px"
    @click="close")
  div(class="typo-h5 text-white") {{ title }}
  div(class="flex-between-center px-8 w-full box-border")
    div(class="flex items-center gap-8")
      div(class="flex-center rounded-full bg-yellow-cm aspect-square p-4")
        svg-icon(
          iconName="crown"
          :iconColor="'dark-6'"
          iconWidth="20px")
      span(class="typo-h5 text-white") {{ $t('CM0071') }}
    slide-toggle(
      v-model="removeWatermark"
      :options="[ { value: false, label: '' }, { value: true, label: '' }, ]"
      margin="2px"
      optionWidth="22px"
      optionHeight="22px"
      :bgColor="removeWatermark ? 'yellow-cm' : 'lighter'"
      :toggleMode="true"
      :overlapSize="'8px'")
  div(v-if="containsPhoto" class="p-8 w-full box-border bg-lighter/20 rounded-24 flex-center flex-col gap-16")
    div(class="flex-between-center py-8 w-full box-border")
      div(class="flex items-center gap-8")
        div(class="flex-center rounded-full bg-yellow-cm aspect-square p-4")
          svg-icon(
            iconName="crown"
            :iconColor="'dark-6'"
            iconWidth="20px")
        span(class="typo-h5 text-white") {{ $t('CM0072') }}
      slide-toggle(
        v-model="highResolutionPhoto"
        :options="[ { value: false, label: '' }, { value: true, label: '' }, ]"
        margin="2px"
        optionWidth="22px"
        optionHeight="22px"
        :bgColor="highResolutionPhoto ? 'yellow-cm' : 'lighter'"
        :toggleMode="true"
        :overlapSize="'8px'")
    div(class="relative w-[342px] h-[198px]")
      compare-image(
        class="absolute top-0 left-0 rounded-16"
        :srcA="require('high_res_before.png')"
        :srcB="require('high_res_after.png')")
  div(class="px-8 w-full box-border")
    nubtn(
      size="mid-full"
      @click="confirm") {{ isSave ? t('STK0004') : t('NN0214') }}
</template>

<script setup lang="ts">
import useActionSheetCm from '@/composable/useActionSheetCm'
import { useMediaStore } from '@/stores/media'
import { useUserStore } from '@/stores/user'
import { notify } from '@kyvg/vue3-notification'
import SlideToggle from '@nu/vivi-lib/components/global/SlideToggle.vue'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'

const { t } = useI18n()

const mediaStore = useMediaStore()
const { mediaParams } = storeToRefs(mediaStore)
const { setInMediaOptions } = mediaStore

const isSave = computed(() => mediaParams.value.action === 'save')
const containsPhoto = computed(() => mediaParams.value.media.includes('photo'))

// #region options
const userStore = useUserStore()
const { removeWatermark, highResolutionPhoto } = storeToRefs(userStore)
const { setRemoveWatermark, setHighResolutionPhoto } = userStore

cmWVUtils.getState('save_high_res').then((data) => {
  setHighResolutionPhoto(data?.value ?? false)
})

cmWVUtils.getState('save_rm_watermark').then((data) => {
  setRemoveWatermark(data?.value ?? false)
})

watch(highResolutionPhoto, (newVal) => {
  if (!cmWVUtils.checkPro({ plan: 1 })) {
    setHighResolutionPhoto(false)
    newVal && cmWVUtils.setState('save_high_res', { value: false })
    return
  }
  cmWVUtils.setState('save_high_res', { value: newVal })
})

watch(removeWatermark, (newVal) => {
  if (!cmWVUtils.checkPro({ plan: 1 })) {
    setRemoveWatermark(false)
    newVal && cmWVUtils.setState('save_rm_watermark', { value: false })
    return
  }
  cmWVUtils.setState('save_rm_watermark', { value: newVal })
})
// #endregion

const title = computed(() => {
  const { action, media } = mediaParams.value
  switch (action) {
    case 'save':
      switch (media) {
        case 'photo':
          return `${t('CM0146')} ${t('STK0067').toLowerCase()}`
        case 'video':
          return `${t('CM0146')} ${t('CM0077').toLowerCase()}`
        case 'photo_video':
          return t('STK0004')
      }
      break
    case 'share':
      switch (media) {
        case 'photo':
          return `${t('CM0150')} ${t('STK0067').toLowerCase()}`
        case 'video':
          return `${t('CM0150')} ${t('CM0077').toLowerCase()}`
      }
      break
  }
  return ''
})

// #region actions
const confirm = () => {
  const { action, media } = mediaParams.value
  switch (action) {
    case 'save':
      saveMedia(media)
      break
    case 'share':
      shareMedia(media)
      break
  }
  setInMediaOptions(false)
}

const close = () => {
  setInMediaOptions(false)
}

const { photoCb, videoCb } = useActionSheetCm()

const saveMedia = (media: string) => {
  switch (media) {
    case 'photo':
      photoCb('save')
        .then((data) => {
          const { flag } = data
          if (flag === '1') {
            throw new Error(data.msg)
          }
          notify({
            group: 'success',
            text: `${t('NN0889')}`,
          })
          cmWVUtils.ratingRequest()
        })
        .catch((e: any) => {
          logUtils.setLogForError(e as Error)
          notify({
            group: 'error',
            text: 'error',
          })
        })
      break
    case 'video':
      videoCb('save')
        .then((data) => {
          data = data ?? { flag: '1', msg: 'data is undefined' }
          const { flag } = data
          if (flag === '1') {
            throw new Error(data.msg)
          }
          notify({
            group: 'success',
            text: `${t('NN0889')}`,
          })
          cmWVUtils.ratingRequest()
        })
        .catch((e: any) => {
          logUtils.setLogForError(e as Error)
          notify({
            group: 'error',
            text: 'error',
          })
        })
      break
    case 'photo_video':
      Promise.all([photoCb('save'), videoCb('save')])
        .then((dataList) => {
          let [data1, data2] = dataList
          if (data1.flag === '1') {
            throw new Error(data1.msg)
          }
          data2 = data2 ?? { flag: '1', msg: 'data is undefined' }
          if (data2.flag === '1') {
            throw new Error(data2.msg)
          }
          notify({
            group: 'success',
            text: `${t('NN0889')}`,
          })
          cmWVUtils.ratingRequest()
        })
        .catch((e: any) => {
          logUtils.setLogForError(e as Error)
          notify({
            group: 'error',
            text: 'error',
          })
        })
      break
  }
}

const shareMedia = (media: string) => {
  switch (media) {
    case 'photo':
      photoCb('share')
        .then((data) => {
          const { flag } = data
          if (flag === '1') {
            throw new Error(data.msg)
          }
        })
        .catch((e: any) => {
          logUtils.setLogForError(e as Error)
          notify({
            group: 'error',
            text: 'error',
          })
        })
      break
    case 'video':
      videoCb('share')
        .then((data) => {
          data = data ?? { flag: '1', msg: 'data is undefined' }
          const { flag } = data
          if (flag === '1') {
            throw new Error(data.msg)
          }
          notify({
            group: 'success',
            text: `${t('NN0889')}`,
          })
          cmWVUtils.ratingRequest()
        })
        .catch((e: any) => {
          logUtils.setLogForError(e as Error)
          notify({
            group: 'error',
            text: 'error',
          })
        })
      break
  }
}
// #endregion
</script>
