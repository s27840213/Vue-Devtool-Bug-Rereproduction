<template lang="pug">
div(class="settings-account")
  avatar(class="mt-30 settings-account__avatar"
    :textSize="30" :avatarSize="75")
  div(class="settings-account__buttons")
    nubtn(v-if="hasAvatar && !isMobile"
        theme="secondary"
        @click="onRemoveAvatarClicked()") {{$t('NN0170')}}
    nubtn(theme="secondary" @click="chooseAvatar()")
      span(v-if="!isMobile") {{$t('NN0171')}}
      span(v-else) {{$t('NN0309')}}
  div(class="settings-account__info")
    div(class="settings-account__label space-between my-10")
      span {{$t('NN0172')}}
      span(v-if="isAdmin"
        class="text-gray-1"
        @click="copyText(userId)") {{userId}}
    property-bar(:class="{'input-invalid': !nameValid}")
      input(class="body-2 text-gray-2"
        v-model="inputName" type="text"
        :placeholder="$t('NN0163', {term: $t('NN0172')})")
    div(v-if="!nameValid"
      class="invalid-message")
      span {{ $t('NN0163', {term: $t('NN0172')}) }}
    div(class="settings-account__label my-10") {{$tc('NN0173', 1)}}
    property-bar(:class="{'input-invalid': !mailValid}")
      input(class="body-2 text-gray-2"
        v-model="inputAccount"
        @input="onUpdate"
        type="email" name="email"
        :placeholder="$t('NN0163', {term: $tc('NN0173', 2)})")
    div(v-if="!mailValid"
      class="invalid-message")
      span {{ accountErrorMessage }}
    div(class="settings-account__label my-10") {{$t('NN0174')}}
    select(class="locale-select" v-model="inputLocale")
      option(v-for="locale in localeOptions" :key="locale.name" :value="locale.name") {{locale.name}}
    div(class="settings-account__subscribe mt-40 mb-10")
      div(class="settings-account__subscribe__wrapper"
        @click="onSubscribeClicked()")
        input(type="checkbox"
          v-model="inputSubscribe"
          class="settings-account__subscribe__checkbox")
        div(class="settings-account__subscribe__switch")
        div(class="settings-account__subscribe__circle")
      div(class="settings-account__subscribe__text") {{$t('NN0175')}}
    div(class="settings-account__save-button mt-10")
      nubtn(:disabled="!isChanged" @click="onConfirmClicked()") {{$t('NN0176')}}
  div(v-if="showVerifyPopup"
    class="settings-account__popup popup-window")
    popup-verify(type="vcode"
      :account="inputAccount"
      @close="closePopup()"
      @isVerified="verifyEmail()")
  div(v-if="showRemovePopup"
    class="settings-account__popup popup-window")
    popup-verify(type="removeAvatar"
      @close="closePopup()")
  spinner(v-if="isLoading")
</template>

<script lang="ts">
import Avatar from '@/components/Avatar.vue'
import PopupVerify from '@/components/popup/PopupVerify.vue'
import store from '@/store'
import GeneralUtils from '@/utils/generalUtils'
import localeUtils, { ILocale } from '@/utils/localeUtils'
import uploadUtils from '@/utils/uploadUtils'
import { notify } from '@kyvg/vue3-notification'
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    PopupVerify,
    Avatar
  },
  data() {
    return {
      inputName: '',
      inputAccount: '',
      inputLocale: '',
      inputSubscribe: true,
      localeOptions: [] as Array<ILocale>,
      accountErrorMessage: this.$t('NN0297') as string,
      isLoading: false,
      isConfirmClicked: false as boolean,
      isEmailVerified: false,
      showVerifyPopup: false,
      showRemovePopup: false,
      responseError: false
    }
  },
  computed: {
    ...mapState({
      isMobile: 'isMobile'
    }),
    ...mapState('user', [
      'uname']),
    ...mapGetters('user', {
      token: 'getToken',
      hasAvatar: 'hasAvatar',
      account: 'getAccount',
      subscribe: 'getSubscribe',
      isAdmin: 'isAdmin',
      userId: 'getUserId'
    }),
    currLocale(): string {
      return this.$i18n.locale
    },
    nameValid(): boolean {
      if (!this.isConfirmClicked) {
        return true
      } else if (this.inputName.length === 0) {
        return false
      } else {
        return true
      }
    },
    mailValid(): boolean {
      if (!this.isConfirmClicked) {
        return true
      } else if (this.account.length === 0 && this.inputAccount.length === 0) {
        // no account and needn't add case
        return true
      } else if (this.responseError) {
        return false
      } else if (this.inputAccount.length > 0) {
        return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(this.inputAccount)
      } else {
        return false
      }
    },
    isChanged() {
      if (this.inputName.trim() === this.uname.trim() &&
        this.inputAccount.trim() === this.account.trim() &&
        this.inputLocale === this.getLocaleText(this.currLocale) &&
        this.inputSubscribe === (this.subscribe === 1)) {
        return false
      } else {
        return true
      }
    }
  },
  mounted() {
    this.inputName = this.uname
    this.inputAccount = this.account
    this.localeOptions = localeUtils.SUPPORTED_LOCALES
    this.inputLocale = this.getLocaleText(this.currLocale) as string
    this.inputSubscribe = this.subscribe === 1
  },
  methods: {
    onSubscribeClicked() {
      this.inputSubscribe = !this.inputSubscribe
    },
    onUpdate() {
      this.responseError = false
    },
    async onConfirmClicked() {
      this.isLoading = true
      this.responseError = false
      this.isConfirmClicked = true
      if (!this.mailValid) {
        if (this.inputAccount.length === 0) {
          this.accountErrorMessage = this.$t('NN0163', { term: this.$tc('NN0173', 2) }) as string
        } else {
          this.accountErrorMessage = this.$t('NN0297') as string
        }
        this.isLoading = false
        return
      }
      if (!this.nameValid) {
        this.isLoading = false
        return
      }
      const updateValue = {} as any
      updateValue.token = this.token
      if (this.inputName.trim() !== this.uname.trim()) {
        updateValue.uname = this.inputName.trim()
      }
      if (this.inputAccount.trim() !== this.account.trim()) {
        if (!this.isEmailVerified) {
          const parameter = {
            token: this.token,
            account: this.inputAccount,
            register: '0',
            vcode_only: '1',
            type: 1,
            locale: this.currLocale
          }
          const data = await store.dispatch('user/sendVcode', parameter)
          if (data.flag === 0) {
            this.showVerifyPopup = true
          } else {
            this.responseError = true
            this.accountErrorMessage = data.msg
          }

          this.isLoading = false
          return
        } else {
          updateValue.account = this.inputAccount.trim()
        }
      }
      if (this.inputLocale !== this.getLocaleText(this.currLocale)) {
        updateValue.locale = this.getLocaleValue(this.inputLocale)
      }
      if (this.inputSubscribe !== (this.subscribe === 1)) {
        updateValue.subscribe = this.inputSubscribe ? 1 : 0
      }

      const data = await store.dispatch('user/updateUser', updateValue)
      if (data.flag === 0) {
        store.commit('user/SET_STATE', {
          uname: data.data.uname,
          account: data.data.account,
          subscribe: data.data.subscribe
        })

        if (this.inputLocale !== this.getLocaleText(this.currLocale)) {
          const newLocale = this.getLocaleValue(this.inputLocale) as string
          localStorage.setItem('locale', newLocale)
          this.$router.go(0)
        }
        this.isConfirmClicked = false
        this.isEmailVerified = false
      }

      this.isLoading = false
    },
    getLocaleText(value: string) {
      return this.localeOptions.find(x => x.code === value)?.name
    },
    getLocaleValue(text: string) {
      return this.localeOptions.find(x => x.name === text)?.code
    },
    verifyEmail() {
      this.isEmailVerified = true
      this.closePopup()
      this.onConfirmClicked()
    },
    closePopup() {
      this.showVerifyPopup = false
      this.showRemovePopup = false
    },
    chooseAvatar() {
      uploadUtils.chooseAssets('avatar')
    },
    onRemoveAvatarClicked() {
      this.showRemovePopup = true
      // uploadUtils.chooseAssets('avatar')
    },
    copyText(text: string) {
      if (text.length === 0) {
        return
      }
      GeneralUtils.copyText(text)
        .then(() => {
          notify({ group: 'copy', text: `${text} 已複製` })
        })
    }
  }
})
</script>

<style lang="scss" scoped>
.settings-account {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
  &__avatar {
    min-height: 75px;
  }
  &__buttons {
    display: flex;
    justify-content: center;
    gap: 30px;
    .nubtn {
      margin: 20px 0 50px 0;
      @include layout-mobile {
        margin-bottom: 20px;
      }
    }
  }
  &__info {
    display: flex;
    flex-direction: column;
    text-align: left;
    width: 350px;
    @media (max-width: 650px) {
      width: 80%;
    }
    .locale-select {
      width: 100%;
      height: 30px;
      font-size: 14px;
      color: setColor(gray-2);
      border-radius: 3px;
      border: 1px setColor(gray-4) solid;
      background: white;
      padding-left: 8px;
      padding-right: 5px;
    }
    .property-bar:focus-within {
      border: 1px solid setColor(blue-1);
    }
  }
  &__label {
    color: setColor(gray-3);
    font-size: 14px;
    &.space-between {
      display: flex;
      justify-content: space-between;
    }
  }
  &__subscribe {
    display: flex;
    justify-content: space-between;
    // @include layout-mobile {
    //   align-items: center;
    // }
    &__wrapper {
      border-radius: 10px;
      cursor: pointer;
      height: 20px;
      overflow: hidden;
      position: relative;
      width: 40px;
    }
    &__checkbox {
      display: none;
      box-sizing: border-box;
      padding: 0;
      &:checked ~ .settings-account__subscribe__switch {
        background-color: setColor(blue-1);
      }
      &:checked ~ .settings-account__subscribe__circle {
        transform: translateX(20px);
      }
    }
    &__switch {
      background-color: #d6d7d9;
      height: 100%;
      transition: 0.3s;
      width: 100%;
    }
    &__circle {
      background-color: #fff;
      border-radius: 50%;
      height: 16px;
      left: 2px;
      position: absolute;
      top: 2px;
      transition: 0.3s;
      width: 16px;
    }
    &__text {
      width: 80%;
      font-size: 14px;
      line-height: 20px;
      font-weight: 400;
      @include layout-mobile {
        width: 85%;
      }
    }
  }
  &__save-button {
    display: flex;
    justify-content: flex-end;
    @include layout-mobile {
      padding-bottom: 30px;
    }
    > div.nubtn {
      @media (max-width: 650px) {
        width: 100%;
      }
    }
  }
  &__popup {
    &-remove {
      position: relative;
      width: 250px;
      text-align: left;
      box-sizing: border-box;
      border-radius: 5px;
      box-shadow: 0px 4px 13px rgba(0, 0, 0, 0.25);
      background-color: setColor(white);
      padding: 20px 40px;
    }
  }
}
.input-invalid {
  border: 1px solid setColor(red) !important;
}
.invalid-message {
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 14px;
  color: setColor(red);
  padding-top: 5px;
}
</style>
