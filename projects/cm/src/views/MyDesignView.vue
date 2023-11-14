<template lang="pug">
div(class="my-design w-full h-full flex justify-center items-center py-20 px-16")
  div(v-if="myDesignRaw.length" class="grid grid-cols-2 gap-20 overflow-scroll h-full")
    div(v-for="col, i in myDesignCols" :key="i" class="grid gap-20 h-fit")
      div(v-for="design in col" :key="design.id" class="relative ")
        img(
          class="w-full rounded-[20px]"
          :src="`https://images.unsplash.com/${design.id}?cs=tinysrgb&q=80&w=320`"
          @click="selectDesign(design)")
        svg-icon(
          class="absolute right-10 top-10 bg-app-btn-primary-text rounded-[10px] m-1"
          iconName="more_horizontal"
          iconWidth="22px"
          @click="moreDesign(design)")
  div(v-else class="grid gap-32")
    img(src="@/assets/img/img-empty.png" class="w-240")
    span(class="text-app-tab-default typo-h4") {{ $t('CM0031') }}
    nubtn(size="sm-full" @click="init") 載入測試圖片
</template>

<script setup lang="ts">
import vuex from '@/vuex'
import useWaterfall from '@nu/vivi-lib/composable/useWaterfall'
import type { IPhotoItem } from '@nu/vivi-lib/interfaces/api'
import useActionSheetCm from '@/composable/useActionSheetCm'
import { useActionSheetStore } from '@/stores/actionSheet'
import useI18n from '@nu/vivi-lib/i18n/useI18n'

const myDesignRaw = computed(() => vuex.state.unsplash.content)
const myDesignCols = computed(
  () => useWaterfall(myDesignRaw.value, 2)
)

const init = () => { // Only for test, need to be removed.
  vuex.dispatch('unsplash/init')
}
const selectDesign = (design: IPhotoItem) => {
  console.log('select', design)
}
const { toggleActionSheet } = useActionSheetCm()
const { setPrimaryActions, setSecondaryActions } = useActionSheetStore()
const { t } = useI18n()
const moreDesign = (design: IPhotoItem) => {
  setPrimaryActions([{
    labels: [{
      label: t('NN0504'),
      labelColor: 'app-text-secondary',
      labelSize: 'typo-btn-lg',
    }],
    cb: () => {
      console.log('edit', design)
    }
  }, {
    labels: [{
      label: t('NN0034'),
      labelColor: 'app-text-secondary',
      labelSize: 'typo-btn-lg',
    }],
    cb: () => {
      console.log('del', design)
    }
  }])
  setSecondaryActions([{
    labels: [{
      label: t('NN0203'),
      labelColor: 'app-tab-active',
      labelSize: 'typo-btn-lg',
    }],
    cb: toggleActionSheet
  }])
  toggleActionSheet()
}
</script>

<style scoped lang="scss"></style>
