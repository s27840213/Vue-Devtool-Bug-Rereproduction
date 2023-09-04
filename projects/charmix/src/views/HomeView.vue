<template lang="pug">
div(class="box-border px-16 h-full w-full overflow-scroll scrollbar-hide pt-24")
  highlight-section(:title="$t('CM0001')")
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
  div(class="feature-section")
    feature-card(
      :bgImg="'surreal'"
      :title="$t('CM0009')")
    feature-card(
      :bgImg="'reflection'"
      :title="$t('CM0010')")
    feature-card(
      :bgImg="'tmp'"
      :title="$t('CM0011')")
</template>
<script setup lang="ts"></script>
<style scoped lang="scss">
.btn__powerful-fill {
  background: linear-gradient(100.37deg, #ffd004 0.75%, #fff2a7 52.64%, #ffffff 105.53%);
}

.feature-section {
  @apply w-full grid grid-cols-2 gap-20;
}
</style>
