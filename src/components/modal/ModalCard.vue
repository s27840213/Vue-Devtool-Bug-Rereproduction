<template lang="pug">
  div(class="modal-card")
    div(class="modal-card__title text-H6 text-gray-2")
      span {{modalInfo.title}}
    div(class="modal-card__content body-SM text-gray-2")
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
          class="btn-primary-mid full-width"
          :class="modalInfo.cancelButton.class"
          :style="modalInfo.cancelButton.style"
          @click="cancelAction()") {{ modalInfo.cancelButton.msg || $t('NN0359') }}
      div(class="modal-card__close")
        svg-icon(class="pointer" :iconName="'close'" :iconWidth="'20px'"
                iconColor="gray-3" @click.native="closePopup()")
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
      const { action } = this.modalInfo.confirmButton
      action && action()
      this.closePopup()
    },
    cancelAction() {
      const { action } = this.modalInfo.cancelButton
      action && action()
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
  max-width: min(calc(100% - 40px), 500px);
  padding: 16px 30px;
  margin: 0 39px;
  border-radius: 10px;
  &__close {
    position: absolute;
    top: 16px;
    right: 14px;
    height: 20px;
    background-color: setColor(gray-4);
    border-radius: 100px;
  }

  &__title {
    margin-top: 2px;
    margin-bottom: 42px;
  }

  &__content {
    margin-bottom: 42px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &__button {
    width: 100%;
    display: flex;
    justify-content: center;
    > button {
      @include btn-LG;
      transition: background-color 0.3s;
      border-radius: 10px;
      width: 200px;
    }
    > button + button {
      margin-left: 20px;
    }
  }
}

@media screen and (max-width: 768px) {
  .modal-card__button {
    flex-direction: column;
    align-items: center;
    > button {
      @include btn-SM;
      height: 32px;
    }
    > button + button {
      margin: 20px 0 0 0;
    }
  }
}
</style>
