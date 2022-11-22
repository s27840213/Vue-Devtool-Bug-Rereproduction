<template lang="pug">
  div(cless="btn-new-design")
    button(class="btn-primary-sm pointer" @click="openPopup()")
      span(class="header-sort") {{$tc('NN0072')}}
    div(v-if="isShowPopup"
      class="popup-window")
      popup-size(@close="closePopup()")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PopupSize from '@/components/popup/PopupSize.vue'

export default defineComponent({
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
  height: 36px;
  white-space: nowrap;
  // font-family: 'Poppins';
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
}
</style>
