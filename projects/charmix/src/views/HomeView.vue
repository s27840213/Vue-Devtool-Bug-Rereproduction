<template lang="pug">
div(class="box-border px-16 h-full w-full overflow-scroll scrollbar-hide pt-24")
  div(class="w-full mb-20 flex justify-between items-center")
    img(src="@/assets/img/logo.png" class="w-44")
    cm-btn(
      :theme="'primary'"
      :hasIcon="true"
      iconName="crown") {{ `${$t('CM0030')}`.toUpperCase() }}
  highlight-section(
    :title="$t('CM0001')"
    :description="$t('CM0002')"
    :btnText="$t('CM0003')"
    :theme="'powerful-fill'"
    iconName="brush"
    @clickBtn="goToEditor")
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
import { useRouter } from 'vue-router'

const router = useRouter()
const goToEditor = () => {
  router.push('/editor')
}
</script>
<style scoped lang="scss">
.feature-section {
  @apply w-full grid grid-cols-2 gap-20;
}
</style>
