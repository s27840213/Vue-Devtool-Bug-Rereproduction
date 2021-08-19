<template lang="pug">
  div(class="popup-success")
    svg-icon(class="popup-success__icon mb-28" :iconName="'check'" :iconWidth="'30px'"  @click="closePopup()")
    div(class="f-h3 black-500--text mb-12")
      span {{$t('plan.sentSuccess')}}
    div(class="f-h5 black-500--text mb-40")
      span {{$t('plan.sendToYou')}}
    button(class="btn-primary-lg full-width" @click="closePopup()") {{$t('plan.understood')}}
    div(class="popup-success__close")
      svg-icon(class="pointer" :iconName="'close'" :iconWidth="'30px'"  @click="closePopup()")
</template>

<script lang="ts">
import Vue from 'vue'

import { mapMutations } from 'vuex'

export default Vue.extend({
  name: 'PopupSuccess',
  methods: {
    ...mapMutations({
      SET_isPopupOpen: 'SET_isPopupOpen'
    }),
    closePopup(): void {
      this.SET_isPopupOpen(false)
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-success {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: setColor(white);
  max-width: 350px;
  padding: 60px;
  &__icon {
    width: 40px;
  }

  &__close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 30px;
    height: 30px;
  }
}

.input-block {
  width: 100%;
  > input {
    width: 100%;
  }
}
</style>
