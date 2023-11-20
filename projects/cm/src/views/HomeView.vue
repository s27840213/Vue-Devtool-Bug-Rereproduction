<template lang="pug">
div(class="box-border px-16 h-full w-full overflow-scroll scrollbar-hide pt-12")
  highlight-section(
    :title="$t('CM0001')"
    :description="$t('CM0002')"
    :btnText="$t('CM0003')"
    :theme="'powerful-fill'"
    iconName="brush"
    @clickBtn="openImgSelecotr(1)")
  //- nubtn(
  //-   class="my-10"
  //-   icon="crown"
  //-   @click="openImgSelecotr") Test Img Selector
  nubtn(
    class="my-10"
    icon="crown"
    @click="exportVedio") Test video Selector
  div(class="w-full my-20 typo-h4 text-app-btn-primary-bg text-left") {{ $t('CM0004') }}
  div(class="feature-section")
    feature-card(
      v-for="feature in quickStartFeatures"
      :key="feature.title"
      :bgImg="feature.bgImg"
      :title="feature.title"
      :target="feature.target")
  div(class="w-full my-20 typo-h4 text-app-btn-primary-bg text-left") {{ $t('CM0009') }}
  div(class="feature-section mb-20")
    feature-card(
      v-for="feature in aiArtFeatures"
      :key="feature.title"
      :bgImg="feature.bgImg"
      :title="feature.title"
      :target="feature.target")
  highlight-section(
    class="mb-20"
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
import i18n from '@/i18n';
import { useImgSelectorStore } from '@/stores/imgSelector';
import type { EditorType } from '@/types/editor';
import PixiRecorder from '@/utils/pixiRecorder';
import vuex from '@/vuex';
import { useRouter } from 'vue-router';

const router = useRouter()
const inBrowserMode = computed(() => vuex.getters['webView/getInBrowserMode'])
const { setRequireImgNum } = useImgSelectorStore()
const goToEditor = () => {
  router.push('/editor')
}

const openImgSelecotr = (requireImgNum: number) => {
  setRequireImgNum(requireImgNum)
  /**
   * @Note below codes is used to test in the browser
   */
  // const src = require('test.jpg')
  // console.log(src)
  // goToEditor()
  // assetUtils.addImage(
  //   require('test.jpg'),
  //   1,
  //   {
  //     previewSrc: require('test.jpg'),
  //     isPreview: true,
  //   }
  // )
}
const exportVedio = () => {
  const pixiRecorder = new PixiRecorder()
  pixiRecorder.genVideo().then((res) => {
    console.log('gen vedio', res)
  })
}

// #region feature card
type FeatureCard = {
  bgImg: string,
  title: string,
  target?: EditorType
}
const quickStartFeatures: FeatureCard[] = [
  {
    bgImg: 'bg-replace',
    title: i18n.global.t('CM0005')
  },
  {
    bgImg: 'tmp',
    title: i18n.global.t('CM0006')
  },
  {
    bgImg: 'tmp',
    title: i18n.global.t('CM0007')
  },
  {
    bgImg: 'tmp',
    title: i18n.global.t('CM0008')
  }
]
const aiArtFeatures: FeatureCard[] = [
  {
    bgImg: 'surreal',
    title: i18n.global.t('CM0009')
  },
  {
    bgImg: 'reflection',
    title: i18n.global.t('CM0010')
  },
  {
    bgImg: 'hidden-message',
    title: i18n.global.t('CM0078'),
    target: 'hidden-message'
  },
  {
    bgImg: 'tmp',
    title: i18n.global.t('CM0011')
  }
]
// #endregion
</script>
<style scoped lang="scss">
.feature-section {
  @apply w-full grid grid-cols-2 gap-20;
}
</style>
