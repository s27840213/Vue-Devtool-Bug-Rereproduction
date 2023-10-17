<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[auto,minmax(0,1fr)]")
  headerbar
  div(class="grid grid-cols-1 grid-rows-[auto,minmax(0,1fr)] px-24 py-10")
    div(
      class="w-full box-border p-24 rounded-[20px] flex flex-col items-center justify-between gap-16 gradient--yellow")
      div(class="w-full h-full flex items-center justify-between")
        div(class="flex flex-col items-start justify-between gap-12")
          div(class="typo-h1") {{ $t('CM0030').toUpperCase() }}
          div(class="typo-body-md") {{ $t('CM0033') }}
          div(class="typo-body-md") {{ $t('CM0034') }}
          div(class="typo-body-md") {{ $t('CM0035') }}
        img(src="src/assets/img/crown-3d.png" class="w-128 h-128")
      cm-btn(
        theme="primary"
        :hasIcon="true"
        iconName="crown"
        :full="true") {{ $t('CM0032') }}
    div
</template>
<script setup lang="ts"></script>
<style scoped lang="scss">
.gradient--yellow {
  background: linear-gradient(100deg, #ffd004 0.75%, #fff2a7 52.64%, #fff 105.53%);
  background: linear-gradient(
    100deg,
    color(display-p3 0.9922 0.8235 0.2824) 0.75%,
    color(display-p3 1 0.9529 0.6902) 52.64%,
    color(display-p3 1 1 1) 105.53%
  );
}
</style>
