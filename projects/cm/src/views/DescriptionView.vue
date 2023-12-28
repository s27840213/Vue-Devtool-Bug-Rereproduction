<template lang="pug">
div(class="description-page w-full h-full text-white px-24")
  headerbar
    template(#left)
      back-btn(:customCallback="router.back")
    template(#middle)
      span(class="typo-h5") {{ title }}
    template(#right)
  div(class="w-full h-[90%] flex flex-col gap-16 items-center box-border py-16")
    div(class="h-[75%] aspect-[9/16] overflow-hidden rounded-8 relative")
      transition(name="fade-in")
        // update key to trigger vue transition
        // eslint-disable-next-line vue/require-toggle-inside-transition
        compare-image(
          :key="idxCurrImg"
          :srcA="getImgs(idxCurrImg).imgA"
          :srcB="getImgs(idxCurrImg).imgB"
        )
    div(class="flex justify-center gap-16")
      img(
        v-for="(n, idx) in 3"
        :key="idx"
        :src="getThumbImgs(idx)"
        class="w-40 h-40 overflow-hidden rounded-4 object-cover object-center"
        :class="{ 'thumb outline outline-2 -outline-offset-2 outline-yellow-cm': idx === idxCurrImg }"
        @click="idxCurrImg = idx"
        @error="(evt) => fallbackThumb(evt, idx)")
    div(class="typo-body-md") {{ description }}
    nubtn(
      size="mid-full"
      @click="handleNext") {{ $t('CM0055') }}
</template>
<script setup lang="ts">
import useImageUtils from '@/composable/useImageUtils';
import i18n from '@/i18n'
import { useEditorStore } from '@/stores/editor'
import type { EditorType } from '@/types/editor'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const editorStore = useEditorStore()
const target: Ref<EditorType> = ref(route.query.target as EditorType)
const idxCurrImg = ref(0)
const getImgs = (idx: number) => {
  return {
    imgA: require(`demo/${target.value}/description/${idx}a.png`),
    imgB: require(`demo/${target.value}/description/${idx}b.png`),
  }
}
const getThumbImgs = (idx: number) => {
  return require(`demo/${target.value}/description/${idx}b-thumb.png`)
}

const title = ref('')
const description = ref('')

switch (target.value) {
  case 'hidden-message':
    title.value = 'Hidden Message'
    description.value = i18n.global.t('CM0079')
    break
}

const handleNext = () => {
  editorStore.startEditing(target.value)
}

const fallbackThumb = (evt: Event, idx: number) => {
  const el = evt.target as HTMLImageElement
  if (el.src !== getImgs(idx).imgB) el.src = getImgs(idx).imgB
}

onMounted(() => {
  // preload images
  const imageUtils = useImageUtils()
  for (let i = 0; i < 3; i++) {
    imageUtils.imgLoadHandler(getImgs(i).imgA, () => { /* do nothing */ })
    imageUtils.imgLoadHandler(getImgs(i).imgB, () => { /* do nothing */ })
  }
})
</script>
<style lang="scss">
@keyframes zoom {
  0%,
  25% {
    transform: scale(1.2);
  }
  50%,
  75% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.2);
  }
}

@keyframes clip-path-scan-x {
  0%,
  25% {
    clip-path: inset(0 0 0 0);
  }
  50%,
  75% {
    clip-path: inset(0 0 0 100%);
  }
  100% {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes move-scan-x {
  0%,
  25% {
    left: 0;
  }
  50%,
  75% {
    left: calc(100% - 6px);
  }
  100% {
    left: 0;
  }
}
</style>
