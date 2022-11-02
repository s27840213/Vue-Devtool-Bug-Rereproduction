<template lang="pug">
  div(cless="btn-new-design")
    div(class="btn-primary-sm" @click="openPopup()")
      span(class="header-sort") {{$t('NN0072')}}
    div(v-if="isShowPopup"
      class="popup-window")
      popup-size(@close="closePopup()")
</template>

<script lang="ts">
import Vue from 'vue'
import PopupSize from '@/components/popup/PopupSize.vue'

export default Vue.extend({
  components: {
    PopupSize
  },
  data() {
    return {
      isShowPopup: false
    }
  },
  methods: {
    openPopup() {
      this.isShowPopup = true
    },
    closePopup() {
      this.isShowPopup = false
    }
  }
})
</script>

<style lang="scss" scoped>
.btn-primary-sm {
  cursor: pointer;
}
</style>
