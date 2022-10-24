<template lang="pug">
  div(class="popup-save-design")
    div(class="popup-save-design__close"
        @click.prevent.stop="handleClose")
      svg-icon(iconName="close" iconColor="gray-3" iconWidth="20px")
    div(class="popup-save-design__title") {{ $t('STK0008') }}
    div(class="popup-save-design__description") {{ $t('STK0009') }}
    div(class="popup-save-design__auto-save")
      span {{ $t('STK0010') }}
      div(class="popup-save-design__auto-save-checkbox"
          :class="{checked: userSettings.autoSave}"
          @click="handleAutoSaveToggle")
        svg-icon(iconName="done" iconColor="white" iconWidth="20.7px")
</template>

<script lang="ts">
import vivistickerUtils from '@/utils/vivistickerUtils'
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'

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
    ...mapMutations({
      updateUserSettings: 'vivisticker/UPDATE_userSettings'
    }),
    handleClose() {
      vivistickerUtils.setShowSaveDesignPopup(false)
      vivistickerUtils.endEditing()
    },
    handleAutoSaveToggle() {
      this.updateUserSettings({
        autoSave: !this.userSettings.autoSave
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
  padding: 16px 0;
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
    width: calc(100% - 60px);
    margin-top: 24px;
    color: setColor(gray-2);
  }
  &__auto-save {
    position: relative;
    @include body-XS;
    margin-top: 24px;
    color: setColor(black-5);
    > span {
      display: block;
    }
  }
  &__auto-save-checkbox {
    position: absolute;
    top: calc(50% - 1px);
    right: calc(100% + 12px);
    transform: translateY(-50%);
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
}
</style>
