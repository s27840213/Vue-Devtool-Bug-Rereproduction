<template lang="pug">
div(class="spinner popup-window")
  div
    img(v-if="$isPic" :src="require('@img/gif/rocket-loading.gif')")
    cube-loading(v-if="$isCm")
    span {{textContent}}{{ '.'.repeat(pointAmount + 1) }}
</template>

<script lang="ts">
import i18n from '@/i18n'
import { defineComponent } from 'vue'
import CubeLoading from '@/components/global/CubeLoading.vue'
import component from '@/components/global/Spinner.vue'

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    spinner: typeof component
  }
}

export default defineComponent({
  emits: [],
  components: {
    CubeLoading,
  },
  props: {
    textContent: {
      type: String,
      default: () => i18n.global.t('NN0454')
    }
  },
  data() {
    return {
      pointAmount: 0
    }
  },
  mounted() {
    setInterval(() => {
      this.pointAmount = (this.pointAmount + 1) % 3
    }, 1000)
  },
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

    img, .cube-loading {
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
