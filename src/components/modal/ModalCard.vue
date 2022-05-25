<template lang="pug">
  div(class="modal-card")
    div(class="text-H6 text-gray-1 mb-20")
      span {{modalInfo.title}}
    div(class="modal-card__content body-MD text-gray-2 mb-20")
      template(v-if="!pending")
        span(v-for="text in modalInfo.content"
        @keydown.ctrl.67.exact.stop
        @keydown.meta.67.exact.stop) {{text}}
      svg-icon(v-if="pending"
        :iconName="'loading'"
        :iconColor="'gray-2'"
        :iconWidth="'60px'")
    template(v-if='!pending')
      div(class="modal-card__button")
        button(class="btn-primary-mid full-width"
          :class="modalInfo.confirmButton.class"
          :style="modalInfo.confirmButton.style"
          @click="confirmAction()") {{ modalInfo.confirmButton.msg || $t('NN0358') }}
        button(v-if="modalInfo.cancelButton.msg"
          class="ml-10 btn-primary-mid full-width"
          :class="modalInfo.cancelButton.class"
          :style="modalInfo.cancelButton.style"
          @click="cancelAction()") {{ modalInfo.cancelButton.msg || $t('NN0359') }}
      div(class="modal-card__close")
        svg-icon(class="pointer" :iconName="'close'" :iconWidth="'30px'"  @click.native="closePopup()")
</template>

<script lang="ts">
import Vue from 'vue'
import { IModalInfo } from '@/interfaces/modal'
import { mapGetters, mapMutations } from 'vuex'
import modalUtils from '@/utils/modalUtils'

export default Vue.extend({
  name: 'ModalCard',
  computed: {
    ...mapGetters({
      _modalInfo: 'modal/getModalInfo',
      pending: 'modal/getIsPending'
    }),
    modalInfo(): IModalInfo {
      return this._modalInfo
    }
  },
  methods: {
    closePopup(): void {
      modalUtils.setIsModalOpen(false)
      modalUtils.clearModalInfo()
    },
    confirmAction() {
      this.modalInfo.confirmButton.action()
      this.closePopup()
    },
    cancelAction() {
      this.modalInfo.cancelButton.action()
      this.closePopup()
    }
  }
})
</script>

<style lang="scss" scoped>
.modal-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  min-width: 350px;
  padding-top: 45px;
  padding-bottom: 35px;
  padding-left: 30px;
  padding-right: 30px;
  border-radius: 10px;
  &__close {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 30px;
    height: 30px;
  }

  &__content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    // align-items: flex-start;
  }

  &__button {
    width: 100%;
    display: flex;
    justify-content: center;
    > button {
      transition: background-color 0.3s;
      border-radius: 5px;
    }
  }
}
</style>
