<template lang="pug">
div(class="box-border h-full w-full px-16 pt-12\ grid gap-16 overflow-scroll scrollbar-hide")
  highlight-section(
    :title="$t('CM0001')"
    :description="$t('CM0002')"
    :btnText="$t('CM0003')"
    :theme="'powerful-fill'"
    iconName="brush"
    @clickBtn="openImgSelecotr({ targetEditorType: 'powerful-fill' })")
  //- nubtn(
  //-   icon="crown"
  //-   @click="testNotify") Test Img Selector
  nubtn(
    icon="crown"
    @click="exportVedio") Test video Selector
  template(
    v-for="(cate, i) in featureCategories"
    :key="i")
    div(class="w-full typo-h4 text-yellow-cm text-left") {{ cate.category }}
    div(class="feature-section")
      feature-card(
        v-for="feature in cate.content"
        :key="feature.title"
        :bgImg="feature.bgImg"
        :title="feature.title"
        @click="feature.action && feature.action()")
  highlight-section(
    :title="$t('CM0001')"
    :description="$t('CM0002')"
    :btnText="$t('CM0003')"
    :btnIconName="'instagram'"
    :theme="'ig'"
    iconName="ig-3d")
  highlight-section(
    :title="$t('CM0001')"
    :description="$t('CM0002')"
    :btnText="$t('CM0003')"
    :btnIconName="'tiktok'"
    :theme="'tiktok'"
    iconName="tiktok-3d")
</template>
<script setup lang="ts">
import i18n from '@/i18n'
import router from '@/router'
import { useImgSelectorStore } from '@/stores/imgSelector'
import PixiRecorder from '@/utils/pixiRecorder'

const { openImgSelecotr } = useImgSelectorStore()

// #region feature card
type FeatureCard = {
  bgImg: string
  title: string
  action?: () => void
}
const quickStartFeatures: FeatureCard[] = [
  {
    bgImg: 'bg-replace',
    title: i18n.global.t('CM0005'),
  },
  {
    bgImg: 'tmp',
    title: i18n.global.t('CM0006'),
  },
  {
    bgImg: 'tmp',
    title: i18n.global.t('CM0007'),
  },
  {
    bgImg: 'tmp',
    title: i18n.global.t('CM0008'),
    action: () => {
      openImgSelecotr({ targetEditorType: 'magic-combined' })
    },
  },
]
const aiArtFeatures: FeatureCard[] = [
  {
    bgImg: 'surreal',
    title: i18n.global.t('CM0009'),
  },
  {
    bgImg: 'reflection',
    title: i18n.global.t('CM0010'),
  },
  {
    bgImg: 'hidden-message',
    title: i18n.global.t('CM0078'),
    action() {
      router.push('/description?target=hidden-message')
    },
  },
  {
    bgImg: 'tmp',
    title: i18n.global.t('CM0011'),
  },
]
const featureCategories = [
  {
    category: i18n.global.t('CM0004'),
    content: quickStartFeatures,
  },
  {
    category: i18n.global.t('CM0009'),
    content: aiArtFeatures,
  },
]
// #endregion

// const testNotify = () => {
//   notify({
//     group: 'success',
//     text: 'Test notification',
//   })
// }
const exportVedio = () => {
  const pixiRecorder = new PixiRecorder()
  pixiRecorder.genVideo().then((res) => {
    console.log('gen vedio finished', res)
  })
}
</script>
<style scoped lang="scss">
.feature-section {
  @apply w-full grid grid-cols-2 gap-20;
}
</style>
