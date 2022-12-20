<template lang="pug">
div(class="spinner popup-window")
  div
    img(:src="'src/assets/img/gif/rocket-loading.gif'")
    span {{textContent}}...
</template>

<script lang="ts">

import i18n from '@/i18n'
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  props: {
    textContent: {
      type: String,
      default: `${i18n.global.t('NN0454')}`
    }
  }
})
</script>

<style lang="scss" scoped>
.spinner {
  div {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 20vh;
    height: 23vh;

    img {
      width: 15vh;
      height: 15vh;
      padding: 0px 10px;
    }
    span {
      color: #fff;
      font-size: 22px;
      font-weight: 700;
      padding-top: 2vh;
    }
  }
}
</style>
