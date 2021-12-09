<template lang="pug">
div(style="position:relative;")
  div(class="signup-wrapper")
    div(v-if="currentPageIndex === 0"
      class="signup signup-p0")
      div
        img(:src="require('@/assets/img/svg/signup.svg')"
          style="width: 180px; height: 133px;")
      div(class="text-center")
        span(class="text-blue-1 heading-5") 開始使用 Vivipic
      div
        div 在電商這條路上，讓 Vivipic 成為你的設計好助手！
        div 馬上註冊，即可免費享用無數電商模板
      div
        btn(@click.native="onFacebookClicked()"
          :type="'icon-mid-body'")
        img(:src="require('@/assets/img/png/facebook.png')")
        span(class="body-2") 使用 Facebook 帳號註冊
      div
        btn(@click.native="onGoogleClicked()" :type="'icon-mid-body'")
        img(:src="require('@/assets/img/png/google.png')")
        span(class="body-2") 使用 Google 帳號註冊
      div
        btn(@click.native="onEmailClicked()" :type="'icon-mid-body text-white'") 使用電子郵件註冊
      div
        span 已是會員?
        btn(:type="'icon'"
          class="h-link"
          @click.native="onLoginClicked()") 立即登入
      div
        button(@click="onCloseClicked")
              svg-icon(class="pointer"
              iconName="page-close" :iconWidth="'15px'" :iconColor="'gray-3'")
    div(v-if="currentPageIndex === 1" class="signup signup-p1")
      div
        button(@click="onBackClicked")
              svg-icon(class="pointer"
              iconName="page-back" :iconWidth="'15px'" :iconColor="'gray-3'")
        span(class="text-blue-1") 建立您的帳號
        button(@click="onCloseClicked")
              svg-icon(class="pointer"
                iconName="page-close" :iconWidth="'15px'" :iconColor="'gray-3'")
      div
        div
          span(class="label-mid") 暱稱
          property-bar(class="mt-5"
            :class="{'input-invalid': !nameValid}")
            input(class="body-2 text-gray-2"
              v-model="name" type="text" name="name"
              placeholder="您的暱稱")
          div(v-if="!nameValid" class="invalid-message")
            span 請輸入您的暱稱
        div
          span(class="label-mid") 電子郵件
          property-bar(class="mt-5"
            :class="{'input-invalid': !mailValid}")
            input(class="body-2 text-gray-2"
              v-model="email" type="email" name="email"
              placeholder="請輸入常用 Email")
          div(v-if="!mailValid"
            class="invalid-message")
            span {{ mailErrorMessage }}
        div
          span(class="label-mid") 密碼
          property-bar(class="mt-5"
            :class="{'input-invalid': !passwordValid}")
            input(class="body-2 text-gray-2"
              v-model="password" type="number"
              placeholder="請輸入密碼"
              :type="togglePeerPasswordInput")
            button(@click="isPeerPassword = !isPeerPassword")
              svg-icon(class="pointer"
                :iconName="togglePeerPasswordIcon"
                :iconWidth="'20px'" :iconColor="'gray-2'")
          div(v-if="emptyPassword || emailResponseError"
            class="password-hint"
            :style="`${passwordValid && !emailResponseError ? '' : 'color: #EB5757;'}`")
            span {{ passwordHint }}
          div(v-else class="invalid-message")
            div
              svg-icon(class="pointer"
                :iconName="`${passwordLengthValid ? '' : 'un'}check`" :iconWidth="'25px'"
                :iconColor="`${passwordLengthValid ? 'green-1' : 'red'}`")
              span(class="ml-5 mt-2"
                :class="{'text-green-1': passwordLengthValid}") 密碼長度至少8個字元
            div
              svg-icon(class="pointer"
                :iconName="`${passwordContainEng ? '' : 'un'}check`" :iconWidth="'25px'"
                :iconColor="`${passwordContainEng ? 'green-1' : 'red'}`")
              span(class="ml-5 mt-2"
                :class="{'text-green-1': passwordContainEng}") 密碼包含英文字母
            div
              svg-icon(class="pointer"
                :iconName="`${passwordContainNum ? '' : 'un'}check`" :iconWidth="'25px'"
                :iconColor="`${passwordContainNum ? 'green-1' : 'red'}`")
              span(class="ml-5 mt-2"
                :class="{'text-green-1': passwordContainNum}") 密碼包含數字
      div
        btn(:type="'primary-mid'"
          class="bg-gray-2 text-white btn-shadow"
          @click.native="onSignUpClicked()") 送出
      div
        span 註冊即代表你同意 Vivipic 的
        a(class="h-link") 使用條款
        span 與
        a(class="h-link") 隱私政策
        span 。
      div
        span 已是會員?
        btn(:type="'icon'"
          class="h-link"
          @click.native="onLoginClicked()") 立即登入
    div(v-if="currentPageIndex === 2"
      class="signup")
      div(class="text-center")
        span(class="text-blue-1 heading-5") 驗 證 碼 已 傳 送
      div
        span(class="body-2") 請在 10 分鐘內輸入我們傳送到 {{ email }} 的驗證碼。
      div
        property-bar(:class="{'input-invalid': !vcodeValid}")
          input(class="body-2 text-gray-2"
            v-model="vcode" type="text" name="vcode"
            placeholder="Enter code")
        div(v-if="!vcodeValid"
          class="invalid-message")
          span {{ vcodeErrorMessage }}
      div(style="margin-bottom: 15px;")
        btn(:type="'primary-mid'"
          class="btn-shadow full-width"
          @click.native="onEnterCodeDoneClicked()") {{$t('NN0133')}}
      div(class="page-close")
        button(@click="onCloseClicked")
          svg-icon(class="pointer"
            iconName="page-close" :iconWidth="'15px'" :iconColor="'gray-3'")
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
  spinner(v-if="isLoading")
</template>

<script lang="ts">
import Vue from 'vue'
import store from '@/store'
import userApis from '@/apis/user'
import Facebook from '@/utils/facebook'

export default Vue.extend({
  name: 'SignUp',
  props: {
    redirect: {
      type: String,
      default: undefined
    }
  },
  data() {
    return {
      name: '' as string,
      email: '' as string,
      password: '' as string,
      vcode: '' as string,
      currentPageIndex: 0 as number,
      leftTime: 60 as number,
      leftTimeText: '' as string,
      resendAvailable: true as boolean,
      isSignUpClicked: false as boolean,
      emailResponseError: false as boolean,
      passwordHint: '密碼需包含大小寫英文字母、數字８碼以上。' as string,
      vcodeErrorMessage: '驗證碼錯誤' as string,
      isVcodeClicked: false as boolean,
      isPeerPassword: false as boolean,
      isRollbackByGoogleSignIn: window.location.href.indexOf('googleapi') > -1 as boolean,
      isLoading: false
    }
  },
  created() {
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
    nameValid(): boolean {
      if (!this.isSignUpClicked) {
        return true
      } else if (this.name.length > 0) {
        return true
      } else {
        return false
      }
    },
    mailValid(): boolean {
      if (!this.isSignUpClicked) {
        return true
      } else if (this.email.length > 0) {
        return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(this.email)
      } else {
        return false
      }
    },
    mailErrorMessage(): string {
      if (this.email.length === 0) {
        return '請輸入您的 Email'
      } else {
        return 'Email 格式錯誤'
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
    emptyPassword(): boolean {
      return this.password.length === 0
    },
    passwordValid(): boolean {
      if (!this.isSignUpClicked) {
        return true
      } else if (this.passwordLengthValid && this.passwordContainEng && this.passwordContainNum) {
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
    onEmailClicked() {
      this.isLoading = true
      this.currentPageIndex = 1
      this.isLoading = false
    },
    onLoginClicked() {
      if (this.redirect) {
        this.$router.push({ name: 'Login', query: { redirect: this.redirect } })
      } else {
        this.$router.push({ name: 'Login' })
      }
    },
    onBackClicked() {
      this.isLoading = true
      this.currentPageIndex = 0
      this.isLoading = false
    },
    onCloseClicked() {
      if (this.redirect) {
        this.$router.push({ path: this.redirect })
      } else {
        this.$router.push({ name: 'Home' })
      }
    },
    async onSignUpClicked() {
      this.emailResponseError = false
      this.isSignUpClicked = true
      this.isLoading = true
      if (!this.nameValid || !this.mailValid || !this.passwordValid) {
        this.isLoading = false
        this.passwordHint = '密碼需包含大小寫英文字母、數字８碼以上。'
        return
      }
      const response = await store.dispatch('user/register', { uname: this.name, account: this.email, upass: this.password })
      if (response.flag === 0) {
        this.currentPageIndex = 2
        this.isVcodeClicked = false
      } else {
        this.emailResponseError = true
        this.passwordHint = response.msg || '發生錯誤，請重試'
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
        register: '1',
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
      if (data.flag === 0) {
        await store.dispatch('user/login', { token: data.token })
        this.$router.push({ path: this.redirect || '/' })
        this.currentPageIndex = 0
      } else {
        this.vcode = ''
        this.vcodeErrorMessage = data.msg || '發生錯誤，請重試'
      }
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
.signup-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000000a1;
}
.signup {
  position: relative;
  margin: 0 auto;
  text-align: left;
  width: 360px;
  max-height: 100%;
  box-shadow: 0px 0px 32px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background-color: white;
  padding: 32px;
  > div {
    margin-bottom: 2vh;
    .property-bar:focus-within {
      border: 1px solid setColor(blue-1);
    }
  }
}
.signup-p0 {
  padding: 0 32px 32px 32px;
  > div {
    &:nth-child(1) {
      // img
      display: flex;
      justify-content: center;
      margin-bottom: 1vh;
    }
    &:nth-child(3) {
      // intro text
      margin: 0 auto;
      width: 90%;
      text-align: center;
      font-size: 14px;
      margin-bottom: 3vh;
      > div {
        margin-bottom: 0.5vh;
      }
    }
    &:nth-child(4),
    &:nth-child(5) {
      // fb/google buttons
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
    &:nth-child(6) {
      //email button
      margin: 0 auto;
      display: flex;
      justify-content: center;
      width: 80%;
      border-radius: 3px;
      background: linear-gradient(
        180deg,
        rgba(78, 171, 230, 0.817708) 0%,
        #3ea1e0 100%
      );
      margin-bottom: 2vh;
      &:hover {
        background: #4aa2da;
      }
      &:active {
        background: #4395c7;
      }
      > button {
        width: 100%;
        height: 100%;
      }
    }
    &:nth-child(7) {
      // login hint
      margin: 0 auto;
      width: 80%;
      font-size: 14px;
      margin-bottom: 2vh;
    }
    &:nth-child(8) {
      // close icon
      position: absolute;
      right: 15px;
      top: 15px;
    }
  }
}
.signup-p1 {
  padding: 32px;
  > div {
    &:nth-child(1) {
      // title
      display: flex;
      justify-content: space-between;
      margin-bottom: 5vh;
      > button {
        padding-top: 7px;
      }
      > span {
        font-size: 24px;
        line-height: 32px;
        font-weight: 600;
      }
    }
    &:nth-child(2) {
      // input fields
      margin-bottom: 3vh;
      > div {
        margin-bottom: 1vh;
      }
    }
    &:nth-child(3) {
      // sign up button
      display: flex;
      justify-content: center;
      margin-bottom: 2vh;
      button {
        width: 60%;
        height: 40px;
      }
    }
    &:nth-child(4),
    &:nth-child(5) {
      // terms of service & login hint
      font-size: 14px;
      margin-bottom: 1vh;
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
.password-hint {
  padding-top: 10px;
  font-size: 14px;
}
.invalid-message {
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 14px;
  color: setColor(red);
  padding-top: 10px;
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
