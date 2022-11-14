<template lang="pug">
  div(class="slide-user-settings")
    div(class="slide-user-settings__header")
      div(class="slide-user-settings__header__icon"
          @click.prevent.stop="handleClose")
        svg-icon(iconName="chevron-left"
                  iconWidth="24px"
                  iconColor="white")
      div(class="slide-user-settings__header__title") {{ $t('NN0649') }}
    div(class="slide-user-settings__list")
      div(v-for="key in userSettingKeys" class="slide-user-settings__setting")
        div(class="slide-user-settings__setting__description") {{ getDescription(key) }}
        div(class="slide-user-settings__setting__checkbox"
            :class="{checked: getChecked(key)}"
            @click.prevent.stop="handleToggle(key)")
          div(class="slide-user-settings__setting__checkbox-circle")
</template>

<script lang="ts">
import vivistickerUtils from '@/utils/vivistickerUtils'
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  computed: {
    ...mapGetters({
      userSettings: 'vivisticker/getUserSettings'
    }),
    userSettingKeys(): string[] {
      return Object.keys(vivistickerUtils.getDefaultUserSettings())
    }
  },
  methods: {
    ...mapMutations({
      setSlideType: 'vivisticker/SET_slideType'
    }),
    ...mapActions({
      updateUserSettings: 'vivisticker/updateUserSettings'
    }),
    getDescription(key: string) {
      return this.$t(vivistickerUtils.getUserSettingDescription(key))
    },
    getChecked(key: string) {
      return this.userSettings[key]
    },
    handleClose() {
      this.setSlideType('none')
    },
    handleToggle(key: string) {
      const setting = {
        [key]: !this.getChecked(key)
      }
      this.updateUserSettings(setting)
    }
  }
})
</script>

<style lang="scss" scoped>
.slide-user-settings {
  background: setColor(black-1);
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  &__header {
    position: relative;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    &__icon {
      position: absolute;
      @include size(24px);
      display: flex;
      align-items: center;
      justify-content: center;
      top: 50%;
      left: 16.5px;
      transform: translateY(-50%);
    }
    &__title {
      font-weight: 600;
      font-size: 18px;
      line-height: 140%;
      color: white;
    }
  }
  &__list {
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  &__setting {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    &__description {
      @include body-MD;
      color: white;
      text-align: left;
    }
    &__checkbox {
      @include size(42px, 24px);
      background: setColor(black-3);
      border-radius: 47px;
      padding: 2px;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      transition: background 0.2s ease-in-out;
      &.checked {
        background: setColor(black-5);
        & > div {
          transform: translateX(18px);
        }
      }
    }
    &__checkbox-circle {
      @include size(20px);
      background: setColor(gray-6);
      border-radius: 50%;
      transition: transform 0.2s ease-in-out;
    }
  }
}
</style>
