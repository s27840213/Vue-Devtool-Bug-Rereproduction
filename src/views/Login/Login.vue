<template lang="pug">
div(style="position:relative;")
  div(class="login-wrapper")
    div(v-if="currentPageIndex === 0" class="login login-p0")
      div
        img(:src="require('@/assets/img/svg/signup.svg')" style="width: 180px; height: 133px;")
      div(class="text-center")
        span(class="text-blue-1 h-5") LOG IN
      div
        img(:src="require('@/assets/img/png/facebook.png')")
        btn(@click.native="onFacebookClicked()" :type="'icon-mid-body'") Log in with Facebook
      div
        img(:src="require('@/assets/img/png/google.png')")
        btn(@click.native="onGoogleClicked()" :type="'icon-mid-body'") Log in with Google
      div
        span or
      div
        div
          span(class="label-mid") Email
          property-bar(class="mt-5" :class="{'input-invalid': !mailValid}")
            input(class="body-2 text-gray-2" v-model="email" type="email" name="email" min="0" placeholder="Your email")
          div(v-if="!mailValid" class="invalid-message")
            span {{ mailErrorMessage }}
        div
          div(class="disp-flex flex-between")
            span(class="label-mid") Password
            btn(:type="'icon'" class="text-gray-3 body-2 forgot-pwd" @click.native="onForgotClicked()") Forgot your password
          property-bar(class="mt-5" :class="{'input-invalid': !passwordValid}")
            input(class="body-2 text-gray-2" v-model="password" type="number" min="0" placeholder="Your password" :type="togglePeerPasswordInput")
            button(@click="isPeerPassword = !isPeerPassword")
              svg-icon(class="pointer"
              :iconName="togglePeerPasswordIcon" :iconWidth="'20px'" :iconColor="'gray-2'")
          div(v-if="!passwordValid" class="invalid-message")
            span {{ passwordErrorMessage }}
      div
        btn(:type="'icon-mid'" class="bg-gray-2 text-white btn-shadow"
        @click.native="onLogInClicked()") Log in
      div
        span New to Here?
        btn(:type="'icon'" class="h-link" @click.native="onSignupClicked()") Sign up
    div(v-if="currentPageIndex === 1" class="login")
      div(class="text-center")
        span(class="text-blue-1 h-5") Forgot you password?
      div
        span(class="body-2") Don't worry, please enter your email.<br> We will send an email to help you reset the password.
      div
        property-bar(class="mt-5" :class="{'input-invalid': !mailValid || emailResponseError}")
          input(class="body-2 text-gray-2" v-model="email" type="email" name="email" min="0" placeholder="Your Email")
        div(v-if="!mailValid || emailResponseError" class="invalid-message")
          span {{ mailErrorMessage }}
      div(class="disp-flex" style="justify-content: center;")
        btn(:type="'primary-mid'" class="btn-shadow body-1" style="width: 50%;"
        @click.native="onSendEmailClicked()") Send email
      div(class="disp-flex" style="justify-content: center;")
        btn(:type="'icon-mid'" class="bg-gray-3 text-white btn-shadow" style="width: 50%;"
        @click.native="onBackClicked()") Back to login
    div(v-if="currentPageIndex === 2" class="login")
      div(class="text-center")
        span(class="text-blue-1 h-5") Verification code is sent
      div
        span(class="body-2") We sent an email to {{ email }}. Please enter the code in the email within 10 minutes.
      div
        property-bar(:class="{'input-invalid': !vcodeValid}")
          input(class="body-2 text-gray-2" v-model="vcode" type="text" name="vcode" placeholder="Enter code")
        div(v-if="!vcodeValid" class="invalid-message")
          span {{ vcodeErrorMessage }}
      div(style="margin-bottom: 15px;")
        btn(:type="'primary-mid'" class="btn-shadow full-width" @click.native="onEnterCodeDoneClicked()") Done
      div(v-if="resendAvailable" class="disp-flex flex-between align-center"
      style="height:30px; margin-bottom: 0;")
        span didn't receive email?
        btn(:type="'icon'" class="text-blue-1 body-1" @click.native="onResendClicked()") resend email
      div(v-else class="disp-flex align-center text-gray-3"
      style="height:30px; margin-bottom: 0;")
        span {{ leftTimeText }}
    div(v-if="currentPageIndex === 3" class="login")
      div(class="text-center")
        span(class="text-blue-1 h-5") Choose a new password
      div
        div
          span(class="label-mid") New password
        property-bar(class="mt-5" :class="{'input-invalid': !resetPasswordValid}")
          input(class="body-2 text-gray-2" v-model="password" type="number" min="0" placeholder="Your password" :type="togglePeerPasswordInput")
          button(@click="isPeerPassword = !isPeerPassword")
            svg-icon(class="pointer"
            :iconName="togglePeerPasswordIcon" :iconWidth="'20px'" :iconColor="'gray-2'")
        div(class="invalid-message")
          div(class="disp-flex align-center")
            svg-icon(class="pointer"
            :iconName="`${passwordLengthValid ? '' : 'un'}check`" :iconWidth="'25px'"
            :iconColor="`${passwordLengthValid ? 'green-1' : 'red'}`")
            span(class="ml-5" :class="{'text-green-1': passwordLengthValid}") password length of 8 to 18 characters.
          div(class="disp-flex align-center")
            svg-icon(class="pointer"
            :iconName="`${passwordContainEng ? '' : 'un'}check`" :iconWidth="'25px'"
            :iconColor="`${passwordContainEng ? 'green-1' : 'red'}`")
            span(class="ml-5" :class="{'text-green-1': passwordContainEng}") password contains english letters.
          div(class="disp-flex align-center")
            svg-icon(class="pointer"
            :iconName="`${passwordContainNum ? '' : 'un'}check`" :iconWidth="'25px'"
            :iconColor="`${passwordContainNum ? 'green-1' : 'red'}`")
            span(class="ml-5" :class="{'text-green-1': passwordContainNum}") password contains numbers.
        div(class="mt-20")
          span(class="label-mid") Confirm new password
        property-bar(class="mt-5" :class="{'input-invalid': !confirmPasswordValid}")
          input(class="body-2 text-gray-2" v-model="confirmPassword" type="number" min="0" placeholder="Confirm password" :type="togglePeerPasswordInput")
          button(@click="isPeerPassword = !isPeerPassword")
            svg-icon(class="pointer"
            :iconName="togglePeerPasswordIcon" :iconWidth="'20px'" :iconColor="'gray-2'")
        div(v-if="!confirmPasswordValid" class="invalid-message")
            span {{ confirmErrorMessage }}
        div(class="mt-20 disp-flex" style="justify-content: center;")
          btn(:type="'primary-mid'" class="btn-shadow"  style="width: 50%;"
          @click.native="onResetDoneClicked()") Done
  spinner(v-if="isLoading")
</template>

<script lang="ts">
import Vue from 'vue'
import store from '@/store'
import userApis from '@/apis/user'
import Facebook from '@/utils/facebook'

export default Vue.extend({
  name: 'Login',
  data() {
    return {
      token: '',
      email: '' as string,
      password: '' as string,
      vcode: '' as string,
      currentPageIndex: 0 as number,
      isLoginClicked: false as boolean,
      passwordErrorMessage: 'Please enter your password.' as string,
      emailResponseError: false as boolean,
      mailErrorMessage: 'Invalid email address format.' as string,
      vcodeErrorMessage: 'Invalid verification code.' as string,
      leftTime: 60 as number,
      leftTimeText: '' as string,
      resendAvailable: true as boolean,
      isPeerPassword: false as boolean,
      isVcodeClicked: false as boolean,
      confirmPassword: '' as string,
      confirmErrorMessage: '' as string,
      isResetClicked: false as boolean,
      isRollbackByGoogleSignIn: window.location.href.indexOf('googleapi') > -1 as boolean,
      isRollbackByFacebookSignIn: window.location.href.indexOf('facebook') > -1 as boolean,
      isLoading: false
    }
  },
  created() {
    const code = this.$route.query.code as string
    // Facebook login status
    if (this.isRollbackByFacebookSignIn && !store.getters['user/isLogin']) {
      this.isLoading = true
      const redirectUri = window.location.href
      this.fbLogin(code, redirectUri)
    }
    // Google login status
    if (this.isRollbackByGoogleSignIn && !store.getters['user/isLogin'] && this.$route.query.state === 'state_parameter_vivipic') {
      this.isLoading = true
      const code = this.$route.query.code as string
      const redirectUri = window.location.href.split('?')[0]
      this.googleLogin(code, redirectUri)
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
      if (this.password.length >= 8 && this.password.length <= 18) {
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
    async fbLogin(code: string, redirectUri: string) {
      try {
        // code -> access_token
        const { data } = await userApis.fbLogin(code, redirectUri)
        if (data.flag === 0) {
          store.dispatch('user/loginSetup', { data: data })
          this.$router.push({ name: 'Editor' })
        } else {
          console.log('fb login failed')
        }
        this.isLoading = false
      } catch (error) {
      }
    },
    async googleLogin(code: string, redirectUri: string) {
      try {
        // idToken -> token
        const { data } = await userApis.googleLogin(code, redirectUri)
        if (data.flag === 0) {
          store.dispatch('user/loginSetup', { data: data })
          this.$router.push({ name: 'Editor' })
        } else {
          console.log('google login failed')
        }
        this.isLoading = false
      } catch (error) {
      }
    },
    onSignupClicked () {
      this.$router.push({ name: 'SignUp' })
    },
    async onLogInClicked() {
      this.isLoginClicked = true
      this.isLoading = true
      if (this.password.length === 0) {
        this.passwordErrorMessage = 'Please enter your password.'
        this.isLoading = false
        return
      }
      if (!this.mailValid || !this.passwordValid) {
        this.isLoading = false
        return
      }
      const data = await store.dispatch('user/login', { token: '', account: this.email, password: this.password })
      if (data.flag === 0) {
        this.$router.push({ name: 'Editor' })
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
    async onSendEmailClicked() {
      this.isLoginClicked = true
      this.emailResponseError = false
      this.isLoading = true
      if (this.email.length === 0) {
        this.isLoading = false
        this.mailErrorMessage = 'Please enter your email.'
        return
      }
      if (!this.mailValid) {
        this.isLoading = false
        this.mailErrorMessage = 'Invalid email address format.'
        return
      }
      const { data } = await userApis.sendVcode('', this.email, '', '0', '1') // uname, account, upass, register, vcode_only
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
      this.leftTimeText = 'Resend email in ' + this.leftTime + ' seconds.'
      const { data } = await userApis.sendVcode('', this.email, '', '0', '1') // uname, account, upass, register, vcode_only
      if (data.flag === 0) {
        this.isLoading = false
        const clock = window.setInterval(() => {
          this.leftTime--
          this.leftTimeText = 'Resend email in ' + this.leftTime + ' seconds.'
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
        this.vcodeErrorMessage = 'Please enter the verification code.'
        this.isLoading = false
        return
      }
      const { data } = await userApis.verifyVcode(this.email, this.vcode) // account, vcode
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
        this.confirmErrorMessage = 'Please enter the new password.'
        this.isLoading = false
        return
      } else if (!this.resetPasswordValid || !this.confirmPasswordValid) {
        this.confirmErrorMessage = 'Your confirmation password does not match the new password.'
        this.isLoading = false
        return
      }

      const { data } = await userApis.resetPassword(this.token, this.email, this.password) // token, account, upass
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
      this.isLoading = true
      if (this.$route.query.redirect) {
        const redirectStr = JSON.stringify({
          redirect: this.$route.query.redirect,
          hostId: 'facebook_parameter_vivipic'
        })
        window.location.href = Facebook.getDialogOAuthUrl(redirectStr, window.location.href)
      }
      const redirectStr = JSON.stringify({
        hostId: 'facebook_parameter_vivipic'
      })
      window.location.href = Facebook.getDialogOAuthUrl(redirectStr, window.location.href)
    },
    onGoogleClicked() {
      this.isLoading = true
      const redirectUri = window.location.href.split('?')[0]
      window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' +
      'scope=https://www.googleapis.com/auth/userinfo.profile+https://www.googleapis.com/auth/userinfo.email&' +
      'include_granted_scopes=true&' +
      'response_type=code&' +
      'prompt=select_account&' +
      'state=state_parameter_vivipic&' +
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

      > img {
        width: 25px;
        height: 25px;
        padding-left: 15%;
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
  font-family: Mulish;
  color: setColor(red);
  padding-top: 5px;
}

.btn-shadow {
  box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}
</style>
