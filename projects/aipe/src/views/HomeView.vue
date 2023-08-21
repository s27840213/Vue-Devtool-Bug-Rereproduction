<template lang="pug">
div(class="box-border px-16 bg-app-bg h-full w-full overflow-scroll")
  router-link(
    custom
    v-slot="{ navigate }"
    to="/")
    div(
      class="btn btn__powerful-fill w-full box-border p-24 rounded-[20px] flex items-center justify-between"
      @click="navigate")
      div(class="flex gap-10 items-start justify-between flex-col")
        div(class="typo-h4") {{ $t('NN0001') }}
        div(class="typo-body-md") {{ $t('NN0002') }}
        nu-btn(
          theme="primary"
          :full="true") {{ $t('NN0003') }}
      img(src="@/assets/img/brush.png")
  div(class="w-full my-20 typo-h4 text-app-btn-primary-bg text-left") {{ $t('NN0004') }}
  div(class="feature-section")
    feature-card(
      :bgImg="'bg-replace'"
      :title="$t('NN0005')")
    feature-card(
      :bgImg="'tmp'"
      :title="$t('NN0005')")
    feature-card(
      :bgImg="'tmp'"
      :title="$t('NN0005')")
    feature-card(
      :bgImg="'tmp'"
      :title="$t('NN0005')")
  div(class="w-full my-20 typo-h4 text-app-btn-primary-bg text-left") {{ $t('NN0009') }}
  div(class="feature-section")
    feature-card(
      :bgImg="'bg-replace'"
      :title="$t('NN0005')")
    feature-card(
      :bgImg="'tmp'"
      :title="$t('NN0005')")
    feature-card(
      :bgImg="'tmp'"
      :title="$t('NN0005')")

//- router-link(
//-   to="/"
//-   tag="div")
//-   img(src="@/assets/img/tmp.png")
//- router-link(
//-   to="/"
//-   tag="div")rr
//-   img(src="@/assets/img/tmp.png")
//- router-link(
//-   to="/"
//-   tag="div")
//-   img(src="@/assets/img/tmp.png")
//- router-link(
//-   to="/"
//-   tag="div")
//-   img(src="@/assets/img/tmp.png")
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
