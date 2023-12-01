<template lang="pug">
div(class="box-border px-16 h-full w-full overflow-scroll scrollbar-hide pt-12")
  highlight-section(
    :title="$t('CM0001')"
    :description="$t('CM0002')"
    :btnText="$t('CM0003')"
    :theme="'powerful-fill'"
    iconName="brush"
    @clickBtn="openImgSelecotr(1)")
  nubtn(
    class="my-10"
    icon="crown"
    @click="testNotify") Test Img Selector
  //- nubtn(
  //-   class="my-10"
  //-   icon="crown"
  //-   @click="exportVedio") Test video Selector
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
import { notify } from '@kyvg/vue3-notification'

const { setRequireImgNum } = useImgSelectorStore()

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
// const exportVedio = () => {
//   const pixiRecorder = new PixiRecorder()
//   pixiRecorder.genVideo().then((res) => {
//     console.log('gen vedio', res)
//   })
// }

const testNotify = () => {
  notify({
    group: 'success',
    text: 'Test notification',
  })
}
</script>
<style scoped lang="scss">
.feature-section {
  @apply w-full grid grid-cols-2 gap-20;
}
</style>
