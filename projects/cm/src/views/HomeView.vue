<template lang="pug">
div(class="box-border px-16 h-full w-full overflow-scroll scrollbar-hide pt-12")
  highlight-section(
    :title="$t('CM0001')"
    :description="$t('CM0002')"
    :btnText="$t('CM0003')"
    :theme="'powerful-fill'"
    iconName="brush"
    @clickBtn="openImgSelecotr")
  //- cm-btn(
  //-   class="my-10"
  //-   :theme="'primary'"
  //-   :hasIcon="true"
  //-   iconName="crown"
  //-   @click="openImgSelecotr") Test Img Selector
  cm-btn(
    class="my-10"
    :theme="'primary'"
    :hasIcon="true"
    iconName="crown"
    @click="exportVedio") Test video Selector
  div(class="w-full my-20 typo-h4 text-app-btn-primary-bg text-left") {{ $t('CM0004') }}
  div(class="feature-section")
    feature-card(
      :bgImg="'bg-replace'"
      :title="$t('CM0005')")
    feature-card(
      :bgImg="'tmp'"
      :title="$t('CM0006')")
    feature-card(
      :bgImg="'tmp'"
      :title="$t('CM0007')")
    feature-card(
      :bgImg="'tmp'"
      :title="$t('CM0008')")
  div(class="w-full my-20 typo-h4 text-app-btn-primary-bg text-left") {{ $t('CM0009') }}
  div(class="feature-section mb-20")
    feature-card(
      :bgImg="'surreal'"
      :title="$t('CM0009')")
    feature-card(
      :bgImg="'reflection'"
      :title="$t('CM0010')")
    feature-card(
      :bgImg="'tmp'"
      :title="$t('CM0011')")
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
import { useImgSelectorStore } from '@/stores/imgSelector'
import PixiRecorder from '@/utils/pixiRecorder'
import vuex from '@/vuex'
import { useRouter } from 'vue-router'

const router = useRouter()
const inBrowserMode = computed(() => vuex.getters['webView/getInBrowserMode'])
const { setShowImgSelector } = useImgSelectorStore()
const goToEditor = () => {
  router.push('/editor')
}

const openImgSelecotr = () => {

  setShowImgSelector(2)
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
  pixiRecorder.genVideo()
    .then(res => {
      console.log('gen vedio', res)
    })
}
</script>
<style scoped lang="scss">
.feature-section {
  @apply w-full grid grid-cols-2 gap-20;
}
</style>
