<template lang="pug">
div(class="slide-user-settings")
  div(class="slide-user-settings__header")
    div(class="slide-user-settings__header__icon"
        @click.prevent.stop="handleClose")
      svg-icon(iconName="chevron-left"
                iconWidth="24px"
                iconColor="white")
    div(v-if="inInitialState" class="slide-user-settings__header__title") {{ $t('NN0649') }}
    div(v-else class="slide-user-settings__header__title") {{ getDescription(state) }}
  div(class="slide-user-settings__list")
    template(v-if="inInitialState")
      template(v-for="key in userSettingKeys" :key="key")
        div(v-if="getIsList(key)" class="slide-user-settings__setting has-active"
            @click.prevent.stop="handleEnterList(key)")
          div(class="slide-user-settings__setting__description") {{ getDescription(key) }}
          div(class="slide-user-settings__setting__side-menu")
            div(class="slide-user-settings__setting__current") {{ getOptionDescription(key, userSettings[key])  }}
            div(class="slide-user-settings__setting__icon")
              svg-icon(iconName="chevron-right"
                        iconWidth="24px"
                        iconColor="white")
        div(v-else class="slide-user-settings__setting")
          div(class="slide-user-settings__setting__description") {{ getDescription(key) }}
          div(class="slide-user-settings__setting__checkbox"
              :class="{checked: userSettings[key]}"
              @click.prevent.stop="handleToggle(key)")
            div(class="slide-user-settings__setting__checkbox-circle")
    template(v-else)
        div(v-for="option in getListOptions(state)" class="slide-user-settings__setting has-active" :key="option.val"
            @click.prevent.stop="handleSelect(state, option.val)")
            div(class="slide-user-settings__setting__side-menu")
              div(class="slide-user-settings__setting__icon")
                svg-icon(v-if="option.icon"
                          :iconName="option.icon"
                          iconWidth="24px"
                          iconColor="white")
              div(class="slide-user-settings__setting__description") {{ transformText(option.description) }}
            div(class="slide-user-settings__setting__icon")
              svg-icon(v-if="userSettings[state] === option.val"
                        iconName="vivisticker-check"
                        iconWidth="24px"
                        iconColor="white")
</template>

<script lang="ts">
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  data() {
    return {
      state: 'initial'
    }
  },
  computed: {
    ...mapGetters({
      userSettings: 'vivisticker/getUserSettings'
    }),
    userSettingKeys(): string[] {
      return Object.keys(vivistickerUtils.getDefaultUserSettings())
    },
    inInitialState(): boolean {
      return this.state === 'initial'
    },
  },
  methods: {
    ...mapMutations({
      setSlideType: 'vivisticker/SET_slideType'
    }),
    ...mapActions({
      updateUserSettings: 'vivisticker/updateUserSettings'
    }),
    transformText(text: string) {
      if (text.startsWith('<P>')) {
        return text.replace('<P>', '')
      } else {
        return this.$t(text)
      }
    },
    getDescription(key: string) {
      return this.transformText(vivistickerUtils.getUserSettingDescription(key))
    },
    getIsList(key: string) {
      return vivistickerUtils.getUserSettingIsList(key)
    },
    getListOptions(key: string) {
      return vivistickerUtils.getUserSettingOptions(key)
    },
    getOptionDescription(key: string, option: string) {
      return this.transformText(this.getListOptions(key).find(o => o.val === option)?.description ?? '<P>')
    },
    handleClose() {
      if (this.inInitialState) {
        this.setSlideType('none')
      } else {
        this.state = 'initial'
      }
    },
    handleToggle(key: string) {
      const setting = {
        [key]: !this.userSettings[key]
      }
      this.updateUserSettings(setting)
    },
    handleEnterList(key: string) {
      this.state = key
    },
    handleSelect(key: string, val: any) {
      this.updateUserSettings({ [key]: val })
      if (key === 'emojiSetting') {
        vivistickerUtils.addFontForEmoji()
      }
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
      padding: 4px;
      border-radius: 3px;
      top: 50%;
      left: 12.5px;
      transform: translateY(-50%);
      transition: background-color 0.1s;
      &:active {
        background-color: setColor(gray-2);
      }
    }
    &__title {
      font-weight: 600;
      font-size: 18px;
      line-height: 140%;
      color: white;
    }
  }
  &__list {
    padding: 24px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  &__setting {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 24px;
    box-sizing: border-box;
    &.has-active:active {
      background: rgba(255, 255, 255, 0.2);
    }
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
    &__side-menu {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    &__current {
      @include body-MD;
      color: setColor(black-5);
    }
    &__icon {
      @include size(24px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
