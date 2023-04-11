<template lang="pug">
div(v-show="imgLoaded" class="welcome")
  img(:src="require(`@/assets/img/png/pricing/${$i18n.locale}/vivisticker_welcome.png`)" :load="imgLoaded = true")
  div(class="welcome__text body-MD text-white") {{ $t('STK0054') }}
  div(class="welcome__btn-start" @click.prevent.stop="handleClose")
    span {{ $t('STK0055') }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapMutations } from 'vuex'
import Payment from './Payment.vue'

export default defineComponent({
  components: {
    Payment
  },
  data() {
    return {
      imgLoaded: false
    }
  },
  methods: {
    ...mapMutations({
      clearFullPageConfig: 'vivisticker/UPDATE_clearFullPageConfig'
    }),
    handleClose() {
      this.clearFullPageConfig()
    }
  }
})
</script>

<style lang="scss" scoped>
.welcome {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  >img {
    position: relative;
    top: 10%;
    width: 100%;
    max-height: 50%;
    object-fit: contain;
  }
  &__text {
    position: relative;
    top: 15%;
    margin: 0 24px;
  }
  &__btn-start {
    margin: 0 auto;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 38px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 4px 16px;
    background: #FFFFFF;
    border-radius: 10px;
    font-weight: 600;
    font-size: 16px;
    line-height: 24px;
  }
}
</style>
