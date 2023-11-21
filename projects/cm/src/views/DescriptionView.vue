<template lang="pug">
div(class="description-page w-full h-full text-app-text-secondary px-24")
  headerbar
    template(#left)
      back-btn(:customCallback="router.back")
    template(#middle)
      span(class="typo-h5") {{ title }}
    template(#right)
  div(class="w-full h-[90%] flex flex-col gap-16 items-center box-border py-16")
    div(class="h-[75%] aspect-[9/16] overflow-hidden rounded-lg relative")
      transition(name="fade-in")
        // update key to trigger vue transition
        // eslint-disable-next-line vue/require-toggle-inside-transition
        img(
          :key="idxCurrImg"
          :src="imgs[idxCurrImg]"
          class="w-full h-full object-cover object-center absolute top-0 left-0")
      div(class="w-6 h-full bg-app-tab-active absolute top-0 left-0")
    div(class="flex justify-center gap-16")
      img(
        v-for="(img, idx) in imgs"
        :key="img"
        :src="img"
        class="w-32 h-32 overflow-hidden rounded object-cover object-center"
        :class="{ 'outline-solid outline-2 -outline-offset-2 outline-app-tab-active': idx === idxCurrImg }"
        @click="idxCurrImg = idx")
    div(class="typo-body-md") {{ description }}
    nubtn(
      size="mid-full"
      @click="handleNext") {{ $t('CM0055') }}
</template>
<script setup lang="ts">
import i18n from '@/i18n'
import { useEditorStore } from '@/stores/editor'
import type { EditorType } from '@/types/editor'
import colorUtils from '@nu/vivi-lib/utils/colorUtils';
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const target: Ref<EditorType> = ref(route.query.target as EditorType)
const imgs: Ref<string[]> = ref(
  Array.from(Array(3), (_, index) => require(`demo/${target.value}-demo-${index}.png`)),
)
const idxCurrImg = ref(0)

const title = ref('')
const description = ref('')

switch (target.value) {
  case 'hidden-message':
    title.value = 'Hidden Message'
    description.value = i18n.global.t('CM0079')
    break
}

const { startEditing, setPageSize, setImgAspectRatio } = useEditorStore()
const handleNext = () => {
  startEditing(target.value)
  setImgAspectRatio(9/16)
  setPageSize(900, 1600)
  switch (target.value) {
    case 'hidden-message':
      colorUtils.setCurrPageBackgroundColor('#2B2B2B')
      break
  }
  router.push({ name: 'Editor' })
}
</script>
<style lang="scss">
.feature-card {
  background-repeat: no-repeat;
  background-size: cover;
  height: 230px;
}
</style>
