<template lang="pug">
  div(class="mobile-design-empty")
      img(class="mobile-design-empty__img" :src="require('@/assets/img/png/mydesign/empty-folder.png')")
      span
        slot {{$t('NN0766')}}
      btn-new-design(v-slot="slotProps")
        button(class="btn-primary-sm pointer" @click="slotProps.openPopup")
          span(class="header-sort") {{$tc('NN0072')}}
</template>

<script lang="ts">
import Vue from 'vue'
import BtnNewDesign from '@/components/new-design/BtnNewDesign.vue'

export default Vue.extend({
  components: {
    BtnNewDesign
  }
})
</script>

<style lang="scss" scoped>
.mobile-design-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  &__img {
    width: 186px;
    height: 165px;
  }
  > span {
    padding: 12px 0px 32px 0px;
    height: 28px;
    font-size: 14px;
    font-weight: 600;
    line-height: 140%;
    color: setColor(gray-2)
  }
  .btn-primary-sm {
    padding: 11px 24px;
    font-weight: 600;
    line-height: 140%;
  }
}
</style>
