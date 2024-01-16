<template lang="pug">
div(class="box-border h-full w-full px-16 pt-12 grid gap-16 overflow-scroll scrollbar-hide")
  div(v-if="isPhaseOne" class="flex flex-col gap-16 px-8")
    feature-card(
      v-for="(feature, idx) in phaseOneFeatures"
      :key="idx"
      :bgImg="feature.bgImg"
      :bgImgB="feature.bgImgB"
      :title="feature.title"
      :subTitle="feature.subTitle"
      theme="lg"
      @click="feature.action && feature.action()")
  template(v-else)
    highlight-section(
      :title="$t('CM0001')"
      :description="$t('CM0002')"
      :btnText="$t('CM0003')"
      :theme="'powerful-fill'"
      iconName="brush"
      @clickBtn="openImgSelecotr({ targetEditorType: 'powerful-fill' })")
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

const { openImgSelecotr } = useImgSelectorStore()

// #region feature card
type FeatureCard = {
  bgImg: string
  bgImgB?: string
  title: string
  subTitle?: string
  action?: () => void
}
const quickStartFeatures: FeatureCard[] = [
  {
    bgImg: 'bg-replace.png',
    title: i18n.global.t('CM0005'),
  },
  {
    bgImg: 'tmp.png',
    title: i18n.global.t('CM0006'),
  },
  {
    bgImg: 'tmp.png',
    title: i18n.global.t('CM0007'),
  },
  {
    bgImg: 'tmp.png',
    title: i18n.global.t('CM0008'),
    action: () => {
      openImgSelecotr({ targetEditorType: 'magic-combined' })
    },
  },
]
const aiArtFeatures: FeatureCard[] = [
  {
    bgImg: 'surreal.png',
    title: i18n.global.t('CM0009'),
  },
  {
    bgImg: 'reflection.png',
    title: i18n.global.t('CM0010'),
  },
  {
    bgImg: 'hidden-message.png',
    title: i18n.global.t('CM0078'),
    action() {
      router.push('/description?target=hidden-message')
    },
  },
  {
    bgImg: 'tmp.png',
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

// #region phase one
const isPhaseOne = true
const phaseOneFeatures: FeatureCard[] = [
  {
    bgImg: 'demo/powerful-fill/cover-a.jpg',
    bgImgB: 'demo/powerful-fill/cover-b.jpg',
    title: i18n.global.t('CM0001'),
    subTitle: i18n.global.t('CM0002'),
    action() {
      openImgSelecotr({ targetEditorType: 'powerful-fill' })
    },
  },
  {
    bgImg: 'demo/hidden-message/cover-a.png',
    bgImgB: 'demo/hidden-message/cover-b.jpg',
    title: i18n.global.t('CM0078'),
    subTitle: i18n.global.t('CM0002'),
    action() {
      router.push('/description?target=hidden-message')
    },
  },
]
// #endregion
</script>
<style scoped lang="scss">
.feature-section {
  @apply w-full grid grid-cols-2 gap-20;
}
</style>
