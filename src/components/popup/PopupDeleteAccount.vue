<template lang="pug">
div(class="popup-window")
  div(class="popup-del-acc" v-click-outside="closePopup")
    svg-icon(class="popup-del-acc__close"
      iconName="close" iconWidth="20px"
      iconColor="gray-2" @click="closePopup")
    span(class="popup-del-acc__title") {{ $t('NN0828') }}
    div(class="popup-del-acc__desc")
      div(v-html="$t('NN0829')")
      div {{ $t('NN0830') }}
      div(class="popup-del-acc__desc--bold") {{ $t('NN0831') }}
      div(class="popup-del-acc__desc--bold") {{ $t('NN0832') }}
      div {{ $t('NN0833', {delete: $t('NN0034')}) }}
    input(class="popup-del-acc__input" v-model="userInput")
    div(class="popup-del-acc__buttons")
      nubtn(theme="secondary" size="sm-full" @click="closePopup") {{$t('NN0203')}}
      nubtn(theme="danger" size="sm-full" @click="deleteAccount"
            :status="allowDelete ? 'default' : 'disabled'") {{$t('NN0317')}}
</template>

<script lang="ts">
import user from '@/apis/user'
import i18n from '@/i18n'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'

export default defineComponent({
  directives: {
    clickOutside: vClickOutside.directive
  },
  emits: ['close'],
  data() {
    return {
      userInput: '',
    }
  },
  computed: {
    allowDelete() {
      return this.userInput === i18n.global.t('NN0034')
    }
  },
  methods: {
    async deleteAccount() {
      await user.deleteAccount()
      window.location.href = '/'
    },
    closePopup() {
      this.$emit('close')
    },
  }
})
</script>

<style lang="scss" scoped>
.popup-del-acc {
  @include body-SM;
  display: grid;
  gap: 20px;
  position: relative;
  min-width: 30%;
  padding: 44px 24px;
  background-color: setColor(white);
  border-radius: 10px;
  &__close {
    position: absolute;
    right: 10px;
    top: 10px;
    cursor: pointer;
  }
  &__title {
    @include text-H6;
  }
  &__desc {
    text-align: left;
    &--bold {
      font-weight: bold;
    }
  }
  &__input {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 16px;
    border: 1px solid setColor(gray-3);;
    border-radius: 4px;
  }
  &__buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }
}

@include layout-mobile { // Setting page mobile RWD
  .popup-del-acc {
    width: auto;
  }
}
</style>
