<template lang="pug">
  div(class="popup-verify"
    v-click-outside="closePopup")
    div(v-if="currentPage === 'vcode'")
      div(class="popup-verify__close")
        svg-icon(class="pointer" iconName="page-close"
          :iconWidth="'10px'" iconColor="gray-0"
          @click.native="closePopup()")
      div(class="text-blue-1 heading-5 pb-20 text-center") 驗 證 碼 已 傳 送
      div(class="pb-20 px-20")
        span(class="body-2") 請在 10 分鐘內輸入我們傳送到 {{ account }} 的驗證碼。
      div
        property-bar(:class="{'input-invalid': !vcodeValid}")
          input(class="body-2 text-gray-2"
            v-model="vcode" type="text" name="vcode"
            placeholder="請輸入驗證碼")
        div(v-if="!vcodeValid"
          class="invalid-message")
          span {{ vcodeErrorMessage }}
        div(class="my-10")
          div(class="popup-verify__btn btn-blue full-width"
            @click="onEnterCodeDoneClicked()") 完 成
        div(v-if="resendAvailable"
          class="popup-verify__vcode-bottom")
          span 沒有收到驗證碼嗎？
          btn(:type="'icon'"
            class="text-blue-1"
            @click.native="onResendClicked()") 重新傳送驗證碼
        div(v-else
          class="popup-verify__vcode-bottom text-gray-3")
          span {{ leftTimeText }}
    div(v-if="currentPage === 'oldPass'")
      div(class="popup-verify__close")
        svg-icon(class="pointer" iconName="page-close"
          :iconWidth="'10px'" iconColor="gray-0"
          @click.native="closePopup()")
      div(class="label-lg pb-20 text-center") 確 認 原 始 密 碼
      div(class="pb-10 body-2 text-gray-3 text-center") 更新帳號前，請確認原始密碼。
      div
        property-bar(:class="{'input-invalid': !oldPassValid}")
          input(class="body-2 text-gray-2"
            v-model="oldPass" type="password" name="oldPass"
            placeholder="請輸入原始密碼")
        div(class="popup-verify__forgot-pwd")
          div(class="invalid-message")
            span(v-if="!oldPassValid") {{ oldPassErrorMessage }}
          btn(:type="'icon'"
            class="pt-5 body-2"
            @click.native="onForgotClicked()") 忘記密碼
        div(class="popup-verify__btns my-15")
          div(class="popup-verify__btn btn-gray"
            @click="closePopup()") 取 消
          div(class="popup-verify__btn btn-blue"
            @click="onCheckPasswordClicked()") 確 認 密 碼
    div(v-if="currentPage === 'newPass'")
      div(class="popup-verify__close")
        svg-icon(class="pointer" iconName="page-close"
          :iconWidth="'10px'" iconColor="gray-0"
          @click.native="closePopup()")
      div(class="label-lg pb-20 text-center") 設 定 新 密 碼
      div
        property-bar(:class="{'input-invalid': !resetPasswordValid}")
          input(class="body-2 text-gray-2"
            v-model="newPass" type="password" name="newPass"
            placeholder="請輸入新密碼"
            :type="togglePeerPasswordInput")
          button(@click="isPeerPassword = !isPeerPassword")
            svg-icon(class="pointer"
            :iconName="togglePeerPasswordIcon" :iconWidth="'20px'" :iconColor="'gray-2'")
        div(v-if="emptyPassword || isResponseError"
          class="body-3 pt-15 pb-40 pl-5"
          :style="`${resetPasswordValid && !isResponseError ? '' : 'color: #EB5757;'}`")
            span {{ passwordHint }}
        div(v-else
          class="invalid-message mt-10")
          div(class="flex align-center")
            svg-icon(class="pointer"
              :iconName="`${passwordLengthValid ? '' : 'un'}check`" :iconWidth="'20px'"
              :iconColor="`${passwordLengthValid ? 'green-1' : 'red'}`")
            span(class="ml-5 body-3"
              :class="{'text-green-1': passwordLengthValid}") 密碼長度至少8個字元
          div(class="flex align-center")
            svg-icon(class="pointer"
              :iconName="`${passwordContainEng ? '' : 'un'}check`" :iconWidth="'20px'"
              :iconColor="`${passwordContainEng ? 'green-1' : 'red'}`")
            span(class="ml-5 body-3"
              :class="{'text-green-1': passwordContainEng}") 密碼包含英文字母
          div(class="flex align-center")
            svg-icon(class="pointer"
              :iconName="`${passwordContainNum ? '' : 'un'}check`" :iconWidth="'20px'"
              :iconColor="`${passwordContainNum ? 'green-1' : 'red'}`")
            span(class="ml-5 body-3"
              :class="{'text-green-1': passwordContainNum}") 密碼包含數字
        div(class="popup-verify__btns my-15")
          div(class="popup-verify__btn btn-gray"
            @click="closePopup()") 取 消
          div(class="popup-verify__btn btn-blue"
            @click="onConfirmPasswordClicked()") 確 認
    spinner(v-if="isLoading")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import vClickOutside from 'v-click-outside'
import store from '@/store'

export default Vue.extend({
  props: {
    account: String,
    type: String
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data () {
    return {
      currentPage: 'vcode',
      vcode: '' as string,
      oldPass: '',
      newPass: '',
      vcodeErrorMessage: '驗證碼錯誤' as string,
      oldPassErrorMessage: '密碼錯誤' as string,
      passwordHint: '密碼需包含大小寫英文字母、數字８碼以上。' as string,
      leftTime: 60 as number,
      leftTimeText: '' as string,
      resendAvailable: true as boolean,
      isLoading: false,
      isResponseError: false,
      isPeerPassword: false as boolean,
      isVcodeClicked: false as boolean,
      isCheckPasswordClicked: false as boolean,
      isConfirmClicked: false as boolean
    }
  },
  created() {
    if (this.type) {
      this.currentPage = this.type
    }
  },
  computed: {
    ...mapGetters('user', {
      token: 'getToken'
    }),
    vcodeValid(): boolean {
      if (!this.isVcodeClicked) {
        return true
      } else if (this.vcode.length > 0) {
        return true
      } else {
        return false
      }
    },
    oldPassValid(): boolean {
      if (!this.isCheckPasswordClicked) {
        return true
      } else if (this.oldPass.length > 0) {
        return true
      } else {
        return false
      }
    },
    togglePeerPasswordIcon(): string {
      return `eye${this.isPeerPassword ? '-slash' : ''}`
    },
    togglePeerPasswordInput(): string {
      return `${this.isPeerPassword ? 'text' : 'password'}`
    },
    passwordLengthValid(): boolean {
      if (this.newPass.length >= 8) {
        return true
      } else {
        return false
      }
    },
    passwordContainEng(): boolean {
      if (this.newPass.match(/.*[a-zA-Z]+.*/)) {
        return true
      } else {
        return false
      }
    },
    passwordContainNum(): boolean {
      if (this.newPass.match(/.*[0-9]+.*/)) {
        return true
      } else {
        return false
      }
    },
    emptyPassword(): boolean {
      return this.newPass.length === 0
    },
    resetPasswordValid(): boolean {
      if (!this.isConfirmClicked) {
        return true
      } else if (this.passwordLengthValid && this.passwordContainEng && this.passwordContainNum) {
        return true
      } else {
        return false
      }
    },
    newPassValid(): boolean {
      if (!this.isConfirmClicked) {
        return true
      } else if (this.newPass.length > 0) {
        return true
      } else {
        return false
      }
    }
  },
  methods: {
    ...mapGetters({
      isLogin: 'user/isLogin'
    }),
    async onResendClicked() {
      this.isLoading = true
      if (this.account.length === 0) {
        this.isLoading = false
        return
      }
      this.resendAvailable = false
      this.leftTimeText = this.leftTime + '秒後可以重寄驗證碼'
      const parameter = {
        token: this.token,
        account: this.account,
        register: '0',
        vcode_only: '1',
        type: 1
      }
      const data = await store.dispatch('user/sendVcode', parameter)
      if (data.flag === 0) {
        this.isLoading = false
        const clock = window.setInterval(() => {
          this.leftTime--
          this.leftTimeText = this.leftTime + '秒後可以重寄驗證碼'
          if (this.leftTime === 0) {
            window.clearInterval(clock)
            this.resendAvailable = true
            this.leftTimeText = ''
            this.leftTime = 60
          }
        }, 1000)
      } else {
        // error
        this.isLoading = false
      }
    },
    async onEnterCodeDoneClicked() {
      this.isVcodeClicked = true
      this.isLoading = true
      if (this.account.length === 0) {
        this.isLoading = false
        return
      }
      if (!this.vcodeValid) {
        this.vcodeErrorMessage = '請輸入驗證碼'
        this.isLoading = false
        return
      }
      const parameter = {
        token: this.token,
        vcode: this.vcode
      }
      const data = await store.dispatch('user/verifyVcode', parameter)
      this.vcode = ''
      if (data.flag === 0) {
        this.$emit('isVerified')
      } else {
        this.vcodeErrorMessage = data.msg
        console.log(data.msg)
      }
      this.isLoading = false
    },
    async onCheckPasswordClicked() {
      this.isCheckPasswordClicked = true
      this.isLoading = true
      if (!this.oldPassValid) {
        this.oldPassErrorMessage = '請輸入密碼'
        this.isLoading = false
        return
      }
      const parameter = {
        token: this.token,
        account: this.account,
        upass: this.oldPass
      }
      const data = await store.dispatch('user/updateUser', parameter)
      if (data.flag === 0) {
        this.isConfirmClicked = false
        this.currentPage = 'newPass'
      } else {
        this.oldPassErrorMessage = data.msg
        console.log(data.msg)
      }
      this.isLoading = false
    },
    async onConfirmPasswordClicked() {
      this.isConfirmClicked = true
      this.isResponseError = false
      if (!this.resetPasswordValid) {
        this.passwordHint = '密碼需包含大小寫英文字母、數字８碼以上。'
        return
      }
      this.isLoading = true
      const parameter = {
        token: this.token,
        upass: this.newPass
      }
      const data = await store.dispatch('user/updateUser', parameter)
      if (data.flag === 0) {
        store.commit('user/SET_STATE', {
          upassUpdate: data.data.upass_update
        })
        this.closePopup()
      } else {
        this.isResponseError = true
        this.passwordHint = data.msg
        console.log(data.msg)
      }
      this.isLoading = false
    },
    onForgotClicked() {
      this.$router.push({
        name: 'Login',
        query: {
          type: 'forgot',
          redirect: this.$route.path
        }
      })
    },
    closePopup() {
      this.$emit('close')
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-verify {
  position: relative;
  width: 425px;
  text-align: left;
  box-sizing: border-box;
  border-radius: 5px;
  box-shadow: 0px 4px 13px rgba(0, 0, 0, 0.25);
  background-color: setColor(white);
  padding: 32px 75px;
  .property-bar:focus-within {
    border: 1px solid setColor(blue-1);
  }
  &__body {
    &-row {
      display: flex;
      justify-content: start;
      width: 87%;
      margin-left: auto;
      margin-top: 15px;
      margin-right: 10px;
      align-items: center;
      &-center {
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    &__custom {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      grid-template-rows: auto;
      column-gap: 5px;
      align-items: center;
      width: 85%;
      &__box {
        height: 26px;
        box-sizing: border-box;
        padding: 5px 5px;
        & input {
          line-height: 16px;
          background-color: transparent;
        }
        &.border-blue-1 {
          @extend .border-blue-1;
        }
        &.border-white {
          @extend .border-white;
        }
      }
    }
    &__hr {
      width: 100%;
      height: 1px;
      background: setColor(gray-4);
      margin-left: auto;
      margin-right: auto;
      margin-top: 20px;
      margin-bottom: 20px;
      padding: 0;
    }
    &__button {
      margin: 0 auto;
      width: 60%;
      padding-top: 30px;
    }
  }
  &__close {
    position: absolute;
    top: 20px;
    right: 20px;
  }
  &__forgot-pwd {
    display: flex;
    justify-content: space-between;
    > button {
      color: setColor(gray-3);
      text-decoration: underline;
      &:hover {
        color: setColor(blue-1);
      }
    }
  }
  &__vcode-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    height: 30px;
    margin-bottom: 0;
  }
  &__btns {
    display: flex;
    justify-content: space-between;
    > div {
      width: 45%;
    }
  }
  &__btn {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    font-size: 16px;
    font-weight: 700;
    box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    &.btn-blue {
      color: setColor(white);
      background-color: setColor(blue-1);
    }
    &.btn-gray {
      color: black;
      background-color: setColor(gray-4);
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
  > div {
    display: flex;
    align-items: center;
  }
}
</style>
