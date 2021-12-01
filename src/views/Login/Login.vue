<template lang="pug">
div(style="position: relative;")
  div(class="login-wrapper")
    div(v-if="currentPageIndex === 0"
      class="login login-p0")
      div
        img(:src="require('@/assets/img/svg/signup.svg')"
          style="width: 180px; height: 133px;")
      div(class="text-center")
        span(class="text-blue-1 heading-5") 登 入
      div
        btn(@click.native="onFacebookClicked()"
          :type="'icon-mid-body'")
        img(:src="require('@/assets/img/png/facebook.png')")
        span(class="body-2") 使用 Facebook 帳號登入
      div
        btn(@click.native="onGoogleClicked()"
          :type="'icon-mid-body'")
        img(:src="require('@/assets/img/png/google.png')")
        span(class="body-2") 使用 Google 帳號登入
      div
        span 或
      div
        div
          span(class="label-mid") 電子郵件
          property-bar(class="mt-5"
            :class="{'input-invalid': !mailValid}")
            input(class="body-2 text-gray-2"
              v-model="email"
              type="email" name="email"
              placeholder="請輸入 Email")
          div(v-if="!mailValid"
            class="invalid-message")
            span {{ mailErrorMessage }}
        div
          div(class="flex flex-between")
            span(class="label-mid") 密碼
            btn(:type="'icon'"
              class="text-gray-3 body-2 forgot-pwd"
              @click.native="onForgotClicked()") 忘記密碼
          property-bar(class="mt-5"
            :class="{'input-invalid': !passwordValid}")
            input(class="body-2 text-gray-2"
              v-model="password" type="number"
              placeholder="請輸入密碼" :type="togglePeerPasswordInput")
            button(@click="isPeerPassword = !isPeerPassword")
              svg-icon(class="pointer"
                :iconName="togglePeerPasswordIcon"
                :iconWidth="'20px'" :iconColor="'gray-2'")
          div(v-if="!passwordValid"
            class="invalid-message")
            span {{ passwordErrorMessage }}
      div
        btn(:type="'primary-mid'"
          class="bg-gray-2 text-white btn-shadow"
          @click.native="onLogInClicked()") 送 出
      div
        span 初次使用？
        btn(:type="'icon'"
          class="h-link"
          @click.native="onSignupClicked()") 立即註冊
      div(class="page-close")
        button(@click="onCloseClicked")
          svg-icon(class="pointer"
            iconName="page-close" :iconWidth="'15px'" :iconColor="'gray-3'")
    div(v-if="currentPageIndex === 1"
      class="login")
      div(class="text-center")
        span(class="text-blue-1 heading-5") 忘 記 密 碼？
      div
        span(class="body-2") 別擔心，請輸入Email<br>我們會傳送訊息給你，以協助你重設密碼。
      div
        property-bar(class="mt-5"
          :class="{'input-invalid': !mailValid || emailResponseError}")
          input(class="body-2 text-gray-2"
            v-model="email"
            type="email" name="email"
            placeholder="請輸入 Email")
        div(v-if="!mailValid || emailResponseError"
          class="invalid-message")
          span {{ mailErrorMessage }}
      div(class="flex"
        :class="hideBackButton ? 'pt-20' : ''"
        style="justify-content: center;")
        btn(:type="'primary-mid'"
          class="btn-shadow body-1"
          style="width: 50%;"
          @click.native="onSendEmailClicked()") 確 定 發 送
      div(v-if="!hideBackButton"
        class="flex"
        style="justify-content: center;")
        btn(:type="'icon-mid'"
          class="bg-gray-3 text-white btn-shadow"
          style="width: 50%;"
          @click.native="onBackClicked()") 返 回 登 入 頁
      div(class="page-close")
        button(@click="onCloseClicked")
          svg-icon(class="pointer"
            iconName="page-close" :iconWidth="'15px'" :iconColor="'gray-3'")
    div(v-if="currentPageIndex === 2"
      class="login")
      div(class="text-center")
        span(class="text-blue-1 heading-5") 驗 證 碼 已 傳 送
      div
        span(class="body-2") 請在 10 分鐘內輸入我們傳送到 {{ email }} 的驗證碼。
      div
        property-bar(:class="{'input-invalid': !vcodeValid}")
          input(class="body-2 text-gray-2"
            v-model="vcode" type="text" name="vcode"
            placeholder="請輸入驗證碼")
        div(v-if="!vcodeValid"
          class="invalid-message")
          span {{ vcodeErrorMessage }}
      div(style="margin-bottom: 15px;")
        btn(:type="'primary-mid'"
          class="btn-shadow full-width"
          @click.native="onEnterCodeDoneClicked()") 完 成
      div(v-if="resendAvailable"
        class="flex flex-between align-center"
        style="height:30px; margin-bottom: 0;")
        span 沒有收到驗證碼嗎？
        btn(:type="'icon'"
          class="text-blue-1 body-1"
          @click.native="onResendClicked()") 重新傳送驗證碼
      div(v-else
        class="flex align-center text-gray-3"
        style="height:30px; margin-bottom: 0;")
        span {{ leftTimeText }}
      div(class="page-close")
        button(@click="onCloseClicked")
          svg-icon(class="pointer"
            iconName="page-close" :iconWidth="'15px'" :iconColor="'gray-3'")
    div(v-if="currentPageIndex === 3"
      class="login")
      div(class="text-center")
        span(class="text-blue-1 heading-5") 重 設 新 密 碼
      div
        div
          span(class="label-mid") 新密碼
        property-bar(class="mt-5"
          :class="{'input-invalid': !resetPasswordValid}")
          input(class="body-2 text-gray-2"
            v-model="password" type="number"
            placeholder="新密碼"
            :type="togglePeerPasswordInput")
          button(@click="isPeerPassword = !isPeerPassword")
            svg-icon(class="pointer"
              :iconName="togglePeerPasswordIcon" :iconWidth="'20px'" :iconColor="'gray-2'")
        div(class="invalid-message")
          div
            svg-icon(class="pointer"
              :iconName="`${passwordLengthValid ? '' : 'un'}check`" :iconWidth="'25px'"
              :iconColor="`${passwordLengthValid ? 'green-1' : 'red'}`")
            span(class="ml-5"
              :class="{'text-green-1': passwordLengthValid}") 密碼長度至少8個字元
          div
            svg-icon(class="pointer"
              :iconName="`${passwordContainEng ? '' : 'un'}check`" :iconWidth="'25px'"
              :iconColor="`${passwordContainEng ? 'green-1' : 'red'}`")
            span(class="ml-5"
              :class="{'text-green-1': passwordContainEng}") 密碼包含英文字母
          div
            svg-icon(class="pointer"
              :iconName="`${passwordContainNum ? '' : 'un'}check`" :iconWidth="'25px'"
              :iconColor="`${passwordContainNum ? 'green-1' : 'red'}`")
            span(class="ml-5"
              :class="{'text-green-1': passwordContainNum}") 密碼包含數字
        div(class="mt-20")
          span(class="label-mid") 確認新密碼
        property-bar(class="mt-5"
          :class="{'input-invalid': !confirmPasswordValid}")
          input(class="body-2 text-gray-2"
            v-model="confirmPassword" type="number"
            placeholder="確認新密碼"
            :type="togglePeerPasswordInput")
          button(@click="isPeerPassword = !isPeerPassword")
            svg-icon(class="pointer"
            :iconName="togglePeerPasswordIcon" :iconWidth="'20px'" :iconColor="'gray-2'")
        div(v-if="!confirmPasswordValid"
          class="invalid-message")
            span {{ confirmErrorMessage }}
        div(class="mt-20 flex"
          style="justify-content: center;")
          btn(:type="'primary-mid'"
            class="btn-shadow"
            style="width: 50%;"
            @click.native="onResetDoneClicked()") 完 成
        div(class="page-close")
          button(@click="onCloseClicked")
            svg-icon(class="pointer"
              iconName="page-close" :iconWidth="'15px'" :iconColor="'gray-3'")
  spinner(v-if="isLoading")
</template>

<script lang="ts">
import Vue from 'vue'
import store from '@/store'
import userApis from '@/apis/user'
import Facebook from '@/utils/facebook'

export default Vue.extend({
  name: 'Login',
  props: {
    redirect: {
      type: String,
      default: undefined
    }
  },
  data() {
    return {
      token: '',
      email: '' as string,
      password: '' as string,
      vcode: '' as string,
      currentPageIndex: 0 as number,
      isLoginClicked: false as boolean,
      passwordErrorMessage: '請輸入您的密碼' as string,
      emailResponseError: false as boolean,
      mailErrorMessage: 'Email 格式錯誤' as string,
      vcodeErrorMessage: '驗證碼錯誤' as string,
      leftTime: 60 as number,
      leftTimeText: '' as string,
      resendAvailable: true as boolean,
      isPeerPassword: false as boolean,
      isVcodeClicked: false as boolean,
      confirmPassword: '' as string,
      confirmErrorMessage: '' as string,
      isResetClicked: false as boolean,
      isRollbackByGoogleSignIn: window.location.href.indexOf('googleapi') > -1 as boolean,
      hideBackButton: false,
      isLoading: false
    }
  },
  created() {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('type')) {
      if (urlParams.get('type') === 'forgot') {
        this.currentPageIndex = 1
        this.hideBackButton = true
      }
    }
    if (this.$route.query.state) {
      const stateStr = this.$route.query.state as string
      const platform = JSON.parse(stateStr).platform
      const redirect = JSON.parse(stateStr).redirect

      // Google login status
      if (this.isRollbackByGoogleSignIn && !store.getters['user/isLogin'] && platform === 'google_vivipic') {
        this.isLoading = true
        const code = this.$route.query.code as string
        const redirectUri = window.location.href.split('?')[0]
        this.googleLogin(code, redirectUri, redirect)
      }

      // Facebook login status
      if (!store.getters['user/isLogin'] && platform === 'fb_vivipic') {
        this.isLoading = true
        if (this.$route.query.error) {
          this.isLoading = false
          console.log(`fb login error, reason: ${this.$route.query.error_reason}`)
          this.$router.push({ query: {} })
        } else {
          const code = this.$route.query.code as string
          const redirectUri = window.location.href
          this.fbLogin(code, redirectUri, redirect)
        }
      }
    }
  },
  computed: {
    mailValid(): boolean {
      if (!this.isLoginClicked) {
        return true
      } else if (this.email.length > 0) {
        return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(this.email)
      } else {
        return false
      }
    },
    passwordValid(): boolean {
      if (!this.isLoginClicked) {
        return true
      } else if (this.password.length > 0) {
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
    vcodeValid(): boolean {
      if (!this.isVcodeClicked) {
        return true
      } else if (this.vcode.length > 0) {
        return true
      } else {
        return false
      }
    },
    passwordLengthValid(): boolean {
      if (this.password.length >= 8) {
        return true
      } else {
        return false
      }
    },
    passwordContainEng(): boolean {
      if (this.password.match(/.*[a-zA-Z]+.*/)) {
        return true
      } else {
        return false
      }
    },
    passwordContainNum(): boolean {
      if (this.password.match(/.*[0-9]+.*/)) {
        return true
      } else {
        return false
      }
    },
    resetPasswordValid(): boolean {
      if (!this.isResetClicked) {
        return true
      } else if (this.passwordLengthValid && this.passwordContainEng && this.passwordContainNum) {
        return true
      } else {
        return false
      }
    },
    confirmPasswordValid(): boolean {
      if (!this.isResetClicked) {
        return true
      } else if (this.password === this.confirmPassword && this.password.length !== 0) {
        return true
      } else {
        return false
      }
    }
  },
  methods: {
    async fbLogin(code: string, redirectUri: string, redirect: string) {
      try {
        // code -> access_token
        const { data } = await userApis.fbLogin(code, redirectUri)
        if (data.flag === 0) {
          store.dispatch('user/loginSetup', { data: data })
          this.$router.push({ path: this.redirect || redirect || '/' })
        } else {
          console.log('fb login failed')
        }
        this.isLoading = false
      } catch (error) {
      }
    },
    async googleLogin(code: string, redirectUri: string, redirect: string) {
      try {
        // idToken -> token
        const { data } = await userApis.googleLogin(code, redirectUri)
        if (data.flag === 0) {
          store.dispatch('user/loginSetup', { data: data })
          this.$router.push({ path: this.redirect || redirect || '/' })
        } else {
          console.log('google login failed')
        }
        this.isLoading = false
      } catch (error) {
      }
    },
    onSignupClicked() {
      if (this.redirect) {
        this.$router.push({ name: 'SignUp', query: { redirect: this.redirect } })
      } else {
        this.$router.push({ name: 'SignUp' })
      }
    },
    async onLogInClicked() {
      this.isLoginClicked = true
      this.isLoading = true
      if (this.password.length === 0) {
        this.passwordErrorMessage = '請輸入您的密碼'
        this.isLoading = false
        return
      }
      if (!this.mailValid || !this.passwordValid) {
        this.isLoading = false
        return
      }
      const data = await store.dispatch('user/login', { token: '', account: this.email, password: this.password })
      if (data.flag === 0) {
        this.$router.push({ path: this.redirect || '/' })
      } else {
        this.password = ''
        this.passwordErrorMessage = data.msg
      }
      this.isLoading = false
    },
    onForgotClicked() {
      this.currentPageIndex = 1
      this.password = ''
      this.isPeerPassword = false
      this.isLoginClicked = false
    },
    onBackClicked() {
      this.currentPageIndex = 0
      this.isLoginClicked = false
    },
    onCloseClicked() {
      if (this.redirect) {
        this.$router.push({ path: this.redirect })
      } else {
        this.$router.push({ name: 'Home' })
      }
    },
    async onSendEmailClicked() {
      this.isLoginClicked = true
      this.emailResponseError = false
      this.isLoading = true
      if (this.email.length === 0) {
        this.isLoading = false
        this.mailErrorMessage = '請輸入您的 Email'
        return
      }
      if (!this.mailValid) {
        this.isLoading = false
        this.mailErrorMessage = 'Email 格式錯誤'
        return
      }
      const parameter = {
        account: this.email,
        register: '0',
        vcode_only: '1'
      }
      const data = await store.dispatch('user/sendVcode', parameter)
      if (data.flag === 0) {
        this.isVcodeClicked = false
        this.currentPageIndex = 2
      } else {
        this.emailResponseError = true
        this.mailErrorMessage = data.msg
      }
      this.isLoading = false
    },
    async onResendClicked() {
      this.isLoading = true
      if (this.email.length === 0) {
        this.currentPageIndex = 0
        this.isLoading = false
        return
      }
      this.resendAvailable = false
      this.leftTimeText = this.leftTime + '秒後可以重寄驗證碼'
      const parameter = {
        account: this.email,
        register: '0',
        vcode_only: '1'
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
        this.currentPageIndex = 0
        this.isLoading = false
      }
    },
    async onEnterCodeDoneClicked() {
      this.isVcodeClicked = true
      this.isLoading = true
      if (this.email.length === 0) {
        this.currentPageIndex = 0
        this.isLoading = false
        return
      }
      if (!this.vcodeValid) {
        this.vcodeErrorMessage = '請輸入驗證碼'
        this.isLoading = false
        return
      }
      const parameter = {
        account: this.email,
        vcode: this.vcode
      }
      const data = await store.dispatch('user/verifyVcode', parameter)
      this.vcode = ''
      if (data.flag === 0) {
        this.currentPageIndex = 3
        this.isResetClicked = false
        this.token = data.token
      } else {
        this.vcodeErrorMessage = data.msg
        console.log(data.msg)
      }
      this.isLoading = false
    },
    async onResetDoneClicked() {
      this.isResetClicked = true
      this.isLoading = true
      if (this.email.length === 0) {
        this.currentPageIndex = 0
        this.isLoading = false
        return
      }
      if (this.password.length === 0) {
        this.confirmErrorMessage = '請輸入新密碼'
        this.isLoading = false
        return
      } else if (!this.resetPasswordValid || !this.confirmPasswordValid) {
        this.confirmErrorMessage = '您的兩組密碼不相同'
        this.isLoading = false
        return
      }

      const data = await store.dispatch('user/updateUser', { token: this.token, upass: this.password })
      if (data.flag === 0) {
        this.email = ''
        this.currentPageIndex = 0
        this.isLoginClicked = false
      }
      this.password = ''
      this.confirmPassword = ''
      this.isLoading = false
    },
    onFacebookClicked() {
      const redirectUri = window.location.href.split('?')[0]
      if (this.redirect) {
        const redirectStr = JSON.stringify({
          redirect: this.redirect,
          platform: 'fb_vivipic'
        })
        window.location.href = Facebook.getDialogOAuthUrl(redirectStr, redirectUri)
      }
      const redirectStr = JSON.stringify({
        platform: 'fb_vivipic'
      })
      window.location.href = Facebook.getDialogOAuthUrl(redirectStr, redirectUri)
    },
    onGoogleClicked() {
      let stateStr
      if (this.redirect) {
        stateStr = JSON.stringify({
          redirect: this.redirect,
          platform: 'google_vivipic'
        })
      } else {
        stateStr = JSON.stringify({
          platform: 'google_vivipic'
        })
      }
      const redirectUri = window.location.href.split('?')[0]
      window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' +
        'scope=https://www.googleapis.com/auth/userinfo.profile+https://www.googleapis.com/auth/userinfo.email&' +
        'include_granted_scopes=true&' +
        'response_type=code&' +
        'prompt=select_account&' +
        `state=${stateStr}&` +
        `redirect_uri=${redirectUri}&` +
        'client_id=466177459396-dsb6mbvvea942on6miaqk8lerub0domq.apps.googleusercontent.com'
    }
  }
})
</script>

<style lang="scss" scoped>
.login-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.login {
  position: relative;
  margin: 0 auto;
  text-align: left;
  width: 360px;
  max-height: 100%;
  box-shadow: 0px 0px 32px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 32px;
  > div {
    margin-bottom: 2.5vh;
    .property-bar:focus-within {
      border: 1px solid setColor(blue-1);
    }
  }
}
.login-p0 {
  padding: 0 32px 20px 32px;
  > div {
    margin-bottom: 2vh;
    &:first-child {
      display: flex;
      justify-content: center;
      margin-bottom: 1vh;
    }
    &:nth-child(3),
    &:nth-child(4) {
      // Facebook and Google
      position: relative;
      margin: 0 auto;
      display: flex;
      align-items: center;
      height: 40px;
      width: 80%;
      background: linear-gradient(180deg, #ffffff 29.69%, #f9f9f9 100%);
      border: 1px solid #d9dbe1;
      border-radius: 3px;
      margin-bottom: 2vh;
      &:hover {
        cursor: pointer;
        background: setColor(gray-5);
      }
      &:active {
        background: setColor(gray-4);
      }
      > button {
        width: 100%;
        height: 100%;
      }
      > img {
        position: absolute;
        left: 15%;
        width: 25px;
        height: 25px;
        pointer-events: none;
      }
      > span {
        position: absolute;
        left: 30%;
        pointer-events: none;
      }
    }
    &:nth-child(5) {
      display: block;
      text-align: center;
      overflow: hidden;
      white-space: nowrap;
      > span {
        position: relative;
        display: inline-block;
      }
      > span:before,
      > span:after {
        content: "";
        position: absolute;
        top: 50%;
        width: 9999px;
        height: 1px;
        background: black;
      }
      > span:before {
        right: 100%;
        margin-right: 30px;
      }
      > span:after {
        left: 100%;
        margin-left: 30px;
      }
      margin-bottom: 2vh;
    }
    &:nth-child(6) {
      // input fields
      > div {
        margin-bottom: 1.5vh;
        .forgot-pwd {
          text-decoration: underline;
          &:hover {
            color: setColor(blue-1);
          }
        }
      }
    }
    &:nth-child(7) {
      // login button
      display: flex;
      justify-content: center;
      margin-bottom: 2vh;
      button {
        width: 60%;
        height: 40px;
      }
    }
    &:nth-child(8) {
      // signup hint
      font-size: 14px;
    }
  }
}
.input-invalid {
  border: 1px solid setColor(red) !important;
}
.h-link {
  color: setColor(blue-1);
  text-decoration: underline;
  font-size: 16px;
  padding-left: 4px;
  padding-right: 4px;
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
.btn-shadow {
  box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}
.page-close {
  position: absolute;
  right: 15px;
  top: 15px;
}
</style>
