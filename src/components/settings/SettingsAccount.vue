<template lang="pug">
div(class="settings-account")
  div(class="settings-account__profile")
    div(class="profile-img text-white") {{shortName}}
  div(class="settings-account__button mt-20 mb-50 pointer"
    @click="onConfirmClicked()") 變更照片
  div(class="settings-account__info")
    div(class="settings-account__label my-10") 名稱
    property-bar
      input(class="body-2 text-gray-2"
        v-model="inputName" type="text"
        placeholder="請輸入暱稱")
    div(class="settings-account__label my-10") 信箱
    property-bar(:class="{'input-invalid': !mailValid}")
      input(class="body-2 text-gray-2"
        v-model="inputAccount"
        @input="onUpdate"
        type="email" name="email"
        placeholder="請輸入信箱")
    div(v-if="!mailValid"
      class="invalid-message")
      span {{ accountErrorMessage }}
    div(class="settings-account__label my-10") 語系
    select(class="locale-select" v-model="inputLocale")
      option(v-for="locale in localeOptions" :value="locale.text") {{locale.text}}
    div(class="settings-account__subscribe mt-40 mb-10")
      div(class="settings-account__subscribe__wrapper"
        @click="onSubscribeClicked()")
        input(type="checkbox"
          v-model="inputSubscribe"
          class="settings-account__subscribe__checkbox")
        div(class="settings-account__subscribe__switch")
        div(class="settings-account__subscribe__circle")
      div(class="settings-account__subscribe__text") {{subscribeText}}
    div(class="settings-account__buttons mt-10")
      btn(class="pointer"
        :disabled="!isChanged"
        @click.native="onConfirmClicked()") 修 改 並 儲 存
  div(v-if="showVerifyPopup"
    class="settings-account__popup-verify")
    popup-verify(type="vcode"
      :account="inputAccount"
      @close="closePopup()"
      @isVerified="verifyEmail()")
  spinner(v-if="isLoading")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapState, mapGetters } from 'vuex'
import PopupVerify from '@/components/popup/PopupVerify.vue'
import store from '@/store'

export default Vue.extend({
  components: {
    PopupVerify
  },
  data() {
    return {
      inputName: '',
      inputAccount: '',
      inputLocale: '',
      inputSubscribe: true,
      subscribeText: '我願意收到來自 Vivipic 的設計技巧、熱門模板、電商趨勢、促銷訊息等電子信。',
      localeOptions: [
        {
          value: 'tw',
          text: '繁體中文(台灣)'
        },
        {
          value: 'us',
          text: '英文'
        },
        {
          value: 'jp',
          text: '日文'
        }],
      accountErrorMessage: 'Email 格式錯誤',
      isLoading: false,
      isConfirmClicked: false as boolean,
      isEmailVerified: false,
      showVerifyPopup: false,
      responseError: false
    }
  },
  watch: {
    inputAccount() {
      if (this.inputAccount.length === 0) {
        this.accountErrorMessage = '請輸入 Email'
      } else if (!this.mailValid) {
        this.accountErrorMessage = 'Email 格式錯誤'
      }
    }
  },
  computed: {
    ...mapState('user', [
      'shortName', 'uname']),
    ...mapGetters('user', {
      token: 'getToken',
      isLogin: 'isLogin',
      account: 'getAccount',
      locale: 'getLocale',
      subscribe: 'getSubscribe'
    }),
    mailValid(): boolean {
      if (!this.isConfirmClicked) {
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
          this.inputLocale === this.getLocaleText(this.locale) &&
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
    this.inputLocale = this.getLocaleText(this.locale) as string
    this.inputSubscribe = this.subscribe === 1
  },
  methods: {
    onSubscribeClicked() {
      this.inputSubscribe = !this.inputSubscribe
    },
    onUpdate () {
      this.responseError = false
    },
    async onConfirmClicked() {
      this.isLoading = true
      this.responseError = false
      this.isConfirmClicked = true
      if (!this.mailValid) {
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
            type: 1
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
      if (this.inputLocale !== this.getLocaleText(this.locale)) {
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
          locale: data.data.locale,
          subscribe: data.data.subscribe
        })
        this.isConfirmClicked = false
        this.isEmailVerified = false
      }

      this.isLoading = false
    },
    getLocaleText(value: string) {
      return this.localeOptions.find(x => x.value === value)?.text
    },
    getLocaleValue(text: string) {
      return this.localeOptions.find(x => x.text === text)?.value
    },
    verifyEmail() {
      this.isEmailVerified = true
      this.closePopup()
      this.onConfirmClicked()
    },
    closePopup() {
      this.showVerifyPopup = false
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
  &__profile {
    display: flex;
    padding-top: 50px;
    .profile-img {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 75px;
      height: 75px;
      font-size: 30px;
      font-weight: 700;
      background: #61aac2;
      border-radius: 50%;
    }
  }
  &__button {
    color: setColor(gray-2);
    border-radius: 5px;
    border: 2px solid setColor(gray-3);
    padding: 5px 20px;
    &:hover {
      background: setColor(gray-5);
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
  }
  &__subscribe {
    display: flex;
    justify-content: space-between;
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
      &:checked~.settings-account__subscribe__switch {
        background-color: setColor(blue-1);
      }
      &:checked~.settings-account__subscribe__circle {
        transform: translateX(20px);
      }
    }
    &__switch {
      background-color: #d6d7d9;
      height: 100%;
      transition: .3s;
      width: 100%;
    }
    &__circle {
      background-color: #fff;
      border-radius: 50%;
      height: 16px;
      left: 2px;
      position: absolute;
      top: 2px;
      transition: .3s;
      width: 16px;
    }
    &__text {
      width: 80%;
      font-size: 15px;
      line-height: 22px;
      font-weight: 400;
    }
  }
  &__buttons {
    display: flex;
    justify-content: end;
    > button {
      color: setColor(white);
      border-radius: 5px;
      background: setColor(blue-1);
      padding: 5px 50px;
      @media (max-width: 650px) {
        width: 100%;
        padding: 5px 0;
      }
      &:disabled {
        background: setColor(gray-4);
      }
    }
  }
  &__popup-verify {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000000a1;
    z-index: 999999;
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
