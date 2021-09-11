<template lang="pug">
  div(class="modal-card")
    div(class="h-5 text-gray-1 mb-12")
      span {{modalInfo.title}}
    div(class="modal-card__content f-h5 text-gray-1 mb-20")
      span(v-for="text  in modalInfo.content") {{text}}
      svg-icon(:iconName="'loading'"
        :iconColor="'gray-2'"
        :iconWidth="'60px'")
    div(class="modal-card__button")
      button(class="btn-primary-mid full-width" @click="confirmAction()") 確認
      button(class="ml-10 btn-primary-mid full-width" @click="cancelAction()") 關閉
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
      _modalInfo: 'modal/getModalInfo'
    }),
    modalInfo(): IModalInfo {
      return this._modalInfo
    }
  },
  methods: {
    ...mapMutations({
      setModalOpen: 'modal/SET_MODAL_OPEN'
    }),
    closePopup(): void {
      this.setModalOpen(false)
      modalUtils.clearModalInfo()
    },
    confirmAction() {
      this.modalInfo.comfirmButton.action()
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
  padding: 30px;
  &__close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 30px;
    height: 30px;
  }

  &__content {
    width: 100%;
    display: flex;
    flex-direction: column;
    // align-items: flex-start;
    > span:nth-child(n + 1) {
      margin-bottom: 4px;
    }
  }

  &__button {
    width: 100%;
    display: flex;
    justify-content: center;
    > button {
      max-width: 180px;
    }
  }
}
</style>
