<template lang="pug">
div(v-show="modalInfo.imgSrc ? isImgLoaded : show"
  class="modal-card"
  :class="classes.bg"
  :style="modalInfo.cardStyle")
  div(v-if="modalInfo.title"
    class="modal-card__row modal-card__title"
    :class="classes.title")
    span {{modalInfo.title}}
  div(v-if="modalInfo.imgSrc" class="modal-card__image")
    div(v-if="modalInfo.imgSrc" class="modal-card__image__container")
      img(v-show="isImgLoaded" :src="modalInfo.imgSrc" @load="handleImgLoad")
      svg-icon(v-if="!isImgLoaded"
        :iconName="'photo'"
        :iconColor="'white'"
        :iconWidth="'48px'")
  div(v-if="modalInfo.content" class="modal-card__text" :class="classes.desc")
    template(v-if="!pending")
      span(v-for="text in modalInfo.content"
      :key="text"
      @keydown.ctrl.c.exact.stop
        @keydown.meta.c.exact.stop
        v-html="text")
      div(v-if="modalInfo.checkboxText !== ''" class="modal-card__checkbox-container")
        div(class="modal-card__checkbox"
            :class="{checked: modalInfo.checked}"
            @click="handleToggleChecked")
          svg-icon(v-if="modalInfo.checked" iconName="done" iconColor="white" iconWidth="20.7px")
        span {{ modalInfo.checkboxText || $t('STK0010') }}
    svg-icon(v-if="pending"
      :iconName="'loading'"
      :iconColor="'gray-2'"
      :iconWidth="'60px'")
  template(v-if='!pending')
    div(class="modal-card__row modal-card__button")
      button(class="full-width"
        :class="`${classes.btn} ${modalInfo.confirmButton.class ?? ''}`"
        :style="modalInfo.confirmButton.style"
        @click="confirmAction()") {{ modalInfo.confirmButton.msg || $t('NN0358') }}
      button(v-if="modalInfo.cancelButton.msg"
        class="full-width"
        :class="`${classes.btn} ${modalInfo.cancelButton.class ?? ''}`"
        :style="modalInfo.cancelButton.style"
        @click="cancelAction()") {{ modalInfo.cancelButton.msg || $t('NN0359') }}
    div(v-if="!$isCm && !modalInfo.noClose && !modalInfo.noCloseIcon" class="modal-card__close")
      svg-icon(class="pointer" :iconName="'close'" :iconWidth="'20px'"
              :iconColor="$isPic ? 'gray-2' : 'gray-3'" @click="closePopup()")
</template>

<script lang="ts">
import { IModalInfo } from '@/interfaces/modal'
import modalUtils from '@/utils/modalUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  emits: ['update:show'],
  name: 'ModalCard',
  props: {
    show: {
      type: Boolean,
      default: true
    },
    initModalInfo: {
      type: Object as PropType<IModalInfo>
    }
  },
  data: () => {
    return {
      isImgLoaded: false,
    }
  },
  computed: {
    ...mapGetters({
      _modalInfo: 'modal/getModalInfo',
      pending: 'modal/getIsPending'
    }),
    classes() {
      if (this.$isCm) return {
        bg: 'bg-dark-3',
        title: 'text-H4 text-yellow-cm',
        desc: 'body-MD text-white',
        btn: 'bg-yellow-cm text-dark rounded-50',
      }

      return {
        bg: 'bg-white',
        title: 'text-H6 text-gray-2',
        desc: 'body-SM text-gray-2',
        btn: 'btn-primary-mid',
      }
    },
    modalInfo(): IModalInfo {
      return this.initModalInfo || this._modalInfo
    }
  },
  methods: {
    closePopup(): void {
      if (this.initModalInfo) {
        this.$emit('update:show', false)
        return
      }
      modalUtils.setIsModalOpen(false)
      modalUtils.clearModalInfo()
    },
    confirmAction() {
      this.modalInfo.confirmButton.action?.()
      if (!this.modalInfo.noClose) this.closePopup()
    },
    cancelAction() {
      this.modalInfo.cancelButton.action?.()
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
  // dont't apply left and right padding to img
  @include not(cm) {
    padding: 16px 0px;
    border-radius: 10px;
    &__row, &__text {
      padding: 0px 30px;
    }
  }
  @include cm {
    padding: 24px 0px;
    border-radius: 20px;
    &__row, &__text {
      padding: 0px 24px;
    }
  }
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  max-width: min(calc(100% - 80px), 500px);
  max-height: calc(100% - 80px);
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
      @include not(cm) {
        border-radius: 10px;
        max-width: 200px;
      }
      @include app(cm) {
        border-radius: 50px;
      }
      transition: background-color 0.3s;
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
