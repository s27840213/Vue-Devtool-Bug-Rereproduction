<template lang="pug">
  div(class="popup-save-design")
    div(class="popup-save-design__close"
        @click.prevent.stop="handleClose")
      svg-icon(iconName="close" iconColor="gray-3" iconWidth="20px")
    div(class="popup-save-design__title") {{ $t('STK0008') }}
    div(class="popup-save-design__description") {{ $t('STK0009') }}
    div(class="popup-save-design__auto-save")
      div(class="popup-save-design__auto-save-checkbox"
          :class="{checked: userSettings.autoSave}"
          @click="handleAutoSaveToggle")
        svg-icon(v-if="userSettings.autoSave" iconName="done" iconColor="white" iconWidth="20.7px")
      span {{ $t('STK0010') }}
    div(class="popup-save-design__buttons")
      div(class="popup-save-design__button confirm"
          @click.prevent.stop="handleSave") {{ $t('STK0004') }}
      div(class="popup-save-design__button cancel"
          :class="{disabled: userSettings.autoSave}"
          @click.prevent.stop="handleNotSave") {{ $t('STK0011') }}
</template>

<script lang="ts">
import vivistickerUtils from '@/utils/vivistickerUtils'
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      userSettings: 'vivisticker/getUserSettings'
    })
  },
  methods: {
    ...mapActions({
      updateUserSettings: 'vivisticker/updateUserSettings'
    }),
    handleClose() {
      vivistickerUtils.setShowSaveDesignPopup(false)
    },
    handleAutoSaveToggle() {
      this.updateUserSettings({
        autoSave: !this.userSettings.autoSave
      })
    },
    handleNotSave() {
      vivistickerUtils.setShowSaveDesignPopup(false)
      vivistickerUtils.endEditing()
    },
    handleSave() {
      vivistickerUtils.setShowSaveDesignPopup(false)
      vivistickerUtils.saveAsMyDesign().then(() => {
        vivistickerUtils.endEditing()
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-save-design {
  position: relative;
  width: 80vw;
  background: setColor(gray-6);
  border-radius: 10px;
  padding: 16px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  &__close {
    @include size(20px);
    position: absolute;
    top: 16px;
    right: 14px;
    border-radius: 50%;
    background: setColor(gray-4);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__title {
    @include text-H6;
    color: setColor(gray-2);
  }
  &__description {
    @include body-SM;
    margin-top: 24px;
    color: setColor(gray-2);
    line-break: anywhere;
  }
  &__auto-save {
    position: relative;
    margin-top: 24px;
    color: setColor(black-5);
    display: flex;
    align-items: flex-start;
    align-self: start;
    > span {
      display: block;
      @include body-XS;
      line-height: 22px;
    }
  }
  &__auto-save-checkbox {
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
  &__buttons {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }
  &__button {
    @include btn-SM;
    width: 200px;
    height: 32px;
    border-radius: 10px;
    padding: 0 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    &.cancel {
      color: setColor(gray-2);
      background-color: setColor(gray-4);
      &.disabled {
        pointer-events: none;
        color: setColor(black-5);
      }
    }
    &.confirm {
      color: setColor(gray-7);
      background-color: setColor(black-2);
    }
  }
}
</style>
