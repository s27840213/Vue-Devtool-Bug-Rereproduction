<template lang="pug">
  div(class="modal-card" :style="modalInfo.cardStyle")
    div(v-if="modalInfo.title" class="modal-card__row modal-card__title text-H6 text-gray-2")
      span {{modalInfo.title}}
    div(v-if="modalInfo.imgSrc" class="modal-card__image")
      div(v-if="modalInfo.imgSrc" class="modal-card__image__container")
        img(v-show="isImgLoaded" :src="modalInfo.imgSrc" @load="handleImgLoad")
        svg-icon(v-if="!isImgLoaded"
          :iconName="'photo'"
          :iconColor="'white'"
          :iconWidth="'48px'")
    div(v-if="modalInfo.content" class="modal-card__text body-SM text-gray-2")
      template(v-if="!pending")
        span(v-for="text in modalInfo.content"
        @keydown.ctrl.67.exact.stop
        @keydown.meta.67.exact.stop
        v-html="text")
        div(v-if="modalInfo.checkboxText !== ''" class="modal-card__checkbox-container")
          div(class="modal-card__checkbox"
              :class="{checked: modalInfo.checked}"
              @click="handleToggleChecked")
            svg-icon(v-if="modalInfo.checked" iconName="done" iconColor="white" iconWidth="20.7px")
          span {{ $t('STK0010') }}
      svg-icon(v-if="pending"
        :iconName="'loading'"
        :iconColor="'gray-2'"
        :iconWidth="'60px'")
    template(v-if='!pending')
      div(class="modal-card__row modal-card__button")
        button(class="btn-primary-mid full-width"
          :class="modalInfo.confirmButton.class"
          :style="modalInfo.confirmButton.style"
          @click="confirmAction()") {{ modalInfo.confirmButton.msg || $t('NN0358') }}
        button(v-if="modalInfo.cancelButton.msg"
          class="btn-primary-mid full-width"
          :class="modalInfo.cancelButton.class"
          :style="modalInfo.cancelButton.style"
          @click="cancelAction()") {{ modalInfo.cancelButton.msg || $t('NN0359') }}
      div(v-if="!modalInfo.noClose && !modalInfo.noCloseIcon" class="modal-card__close")
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
  data: () => {
    return {
      isImgLoaded: false
    }
  },
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
      if (!this.modalInfo.noClose) this.closePopup()
    },
    cancelAction() {
      const { action } = this.modalInfo.cancelButton
      action && action()
      this.closePopup()
    },
    handleImgLoad() {
      this.isImgLoaded = true
    },
    handleToggleChecked() {
      const target = !this.modalInfo.checked
      modalUtils.updateModalInfo({ checked: target })
      this.modalInfo.onCheckedChange(target)
    }
  }
})
</script>

<style lang="scss" scoped>
.modal-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  background-color: white;
  width: 100%;
  max-width: min(calc(100% - 80px), 500px);
  max-height: calc(100% - 80px);
  padding-bottom: 16px;
  border-radius: 10px;
  overflow-y: auto;
  &__close {
    position: absolute;
    top: 16px;
    right: 14px;
    height: 20px;
    background-color: setColor(gray-4);
    border-radius: 100px;
  }

  &__row {
    box-sizing: border-box;
    width: 100%;
    padding: 0px 30px;
  }

  &__title {
    margin-top: 16px;
  }

  &__image {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background-color: #C9C9C9;
    &__container {
      width: 100%;
      height: 0;
      padding-bottom: 100%;
      position: relative;
      > img, > svg{
        position: absolute;
        left: 50%;
        right: 0;
        bottom: 0;
        top: 50%;
        transform: translate(-50%, -50%);
        width: calc(100% + 1px);
      }
    }
  }

  &__text {
    padding: 0px 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &__checkbox-container {
    position: relative;
    margin-top: 24px;
    color: setColor(black-5);
    display: flex;
    align-items: flex-start;
    > span {
      display: block;
      @include body-XS;
      line-height: 22px;
    }
  }

  &__checkbox {
    margin-top: 2px;
    margin-right: 12px;
    @include size(18px);
    border: 1px solid setColor(black-5);
    border-radius: 2px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    &.checked {
      background: setColor(black-3);
      border: none;
      border-radius: 2px;
    }
  }

  &__button {
    width: 100%;
    display: flex;
    justify-content: center;
    > button {
      @include btn-LG;
      transition: background-color 0.3s;
      border-radius: 10px;
      max-width: 200px;
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
