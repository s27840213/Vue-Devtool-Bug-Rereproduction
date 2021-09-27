<template lang="pug">
div(style="position:relative;")
  div(class="signup-wrapper")
    div(v-if="currentPageIndex === 0" class="signup signup-p0")
      div
        img(:src="require('@/assets/img/svg/signup.svg')" class="w-50")
      div(class="text-center")
        span(class="text-blue-1 h-5") Start with Vivipic
      div
        div Let Vivipic be your good design assistant in the E-commerce world!
        div Sign up now, enjoy unlimited templates for free!
      div
        img(:src="require('@/assets/img/png/facebook.png')")
        btn(@click.native="onFacebookClicked()" :type="'icon-mid-body'") Sign up with Facebook
      div
        img(:src="require('@/assets/img/png/google.png')")
        btn(@click.native="onGoogleClicked()" :type="'icon-mid-body'") Sign up with Google
      div
        btn(@click.native="onEmailClicked()" :type="'icon-mid-body text-white'") Sign up with Email
      div
        span Already sign up?
        btn(:type="'icon'" class="h-link" @click.native="onLoginClicked()") Log in
    div(v-if="currentPageIndex === 1" class="signup signup-p1")
      div
        button(@click="onBackClicked")
              svg-icon(class="pointer"
              iconName="page-back" :iconWidth="'15px'" :iconColor="'gray-2'")
        span(class="text-blue-1 h-5") Create your account
        button
              svg-icon(class="pointer"
              iconName="page-close" :iconWidth="'0px'" :iconColor="'gray-2'")
      div
        div
          span(class="label-mid") Name
          property-bar(class="mt-5" :class="{'input-invalid': !nameValid}")
            input(class="body-2 text-gray-2" v-model="name" type="text" name="name" placeholder="Your name")
          div(v-if="!nameValid" class="invalid-message")
            span Please enter your name.
        div
          span(class="label-mid") Email
          property-bar(class="mt-5" :class="{'input-invalid': !mailValid}")
            input(class="body-2 text-gray-2" v-model="email" type="email" name="email" placeholder="Your email")
          div(v-if="!mailValid" class="invalid-message")
            span {{ mailErrorMessage }}
        div
          span(class="label-mid") Password
          property-bar(class="mt-5" :class="{'input-invalid': !passwordValid}")
            input(class="body-2 text-gray-2" v-model="password" type="number" placeholder="Your password" :type="togglePeerPasswordInput")
            button(@click="isPeerPassword = !isPeerPassword")
              svg-icon(class="pointer"
              :iconName="togglePeerPasswordIcon" :iconWidth="'20px'" :iconColor="'gray-2'")
          div(v-if="emptyPassword" class="password-hint" :style="`${passwordValid ? '' : 'color: #EB5757;'}`")
            span {{ passwordHint }}
          div(v-else class="invalid-message")
            div(class="disp-flex align-center")
              svg-icon(class="pointer"
              :iconName="`${passwordLengthValid ? '' : 'un'}check`" :iconWidth="'25px'"
              :iconColor="`${passwordLengthValid ? 'green-1' : 'red'}`")
              span(class="ml-5" :class="{'text-green-1': passwordLengthValid}") password length of at least 8 characters.
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
      div
        btn(:type="'icon-mid'" class="bg-gray-2 text-white btn-shadow" @click.native="onSignUpClicked()") Sign up
      div
        span By clicking signup, you're agreeing to our
        a(class="h-link") terms of service
        span  and
        a(class="h-link") privacy policy.
      div
        span Already sign up?
        btn(:type="'icon'" class="h-link" @click.native="onLoginClicked()") Log in
    div(v-if="currentPageIndex === 2" class="signup")
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
  spinner(v-if="isLoading")
</template>

<script lang="ts">
import Vue from 'vue'
import store from '@/store'
import userApis from '@/apis/user'
import Facebook from '@/utils/facebook'
import uploadUtils from '@/utils/uploadUtils'

export default Vue.extend({
  name: 'SignUp',
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
      passwordHint: 'a mix of letters, numbers and symbols with at least 8 characters.' as string,
      vcodeErrorMessage: 'Invalid verification code.' as string,
      isVcodeClicked: false as boolean,
      isPeerPassword: false as boolean,
      isRollbackByGoogleSignIn: window.location.href.indexOf('googleapi') > -1 as boolean,
      isLoading: false
    }
  },
  created() {
    const code = this.$route.query.code as string
    // Facebook login status
    if (code !== undefined && !store.getters['user/isLogin']) {
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
        return 'Please enter your email.'
      } else {
        return 'Invalid email address format.'
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
    async fbLogin(code: string, redirectUri: string) {
      try {
        // code -> access_token
        const { data } = await userApis.fbLogin(code, redirectUri)
        const token = data.data.token
        if (token.length > 0) {
          store.commit('user/SET_STATE', {
            downloadUrl: data.data.download_url,
            userId: data.data.userId
          })
          store.commit('user/SET_TOKEN', token)
          store.dispatch('user/getAssets', { token: token })
          uploadUtils.setLoginOutput(data.data)
          uploadUtils.uploadTmpJSON()
          this.$router.push({ name: 'Editor' })
        }
      } catch (error) {
      }
    },
    async googleLogin(code: string, redirectUri: string) {
      try {
        // idToken -> token
        const { data } = await userApis.googleLogin(code, redirectUri)
        const token = data.data.token
        if (token.length > 0) {
          store.commit('user/SET_STATE', {
            downloadUrl: data.data.download_url,
            userId: data.data.userId
          })
          store.commit('user/SET_TOKEN', token)
          store.dispatch('user/getAssets', { token: token })
          uploadUtils.setLoginOutput(data.data)
          uploadUtils.uploadTmpJSON()
          this.$router.push({ name: 'Editor' })
        }
      } catch (error) {
      }
    },
    onEmailClicked() {
      this.isLoading = true
      this.currentPageIndex = 1
      this.isLoading = false
    },
    onLoginClicked() {
      this.$router.push({ name: 'Login' })
    },
    onBackClicked() {
      this.isLoading = true
      this.currentPageIndex = 0
      this.isLoading = false
    },
    async onSignUpClicked() {
      this.isSignUpClicked = true
      this.isLoading = true
      if (!this.nameValid || !this.mailValid || !this.passwordValid) {
        this.isLoading = false
        this.passwordHint = 'a mix of letters, numbers and symbols with at least 8 characters.'
        return
      }
      const response = await store.dispatch('user/register', { uname: this.name, account: this.email, upass: this.password })
      if (response.flag === 0) {
        this.currentPageIndex = 2
        this.isVcodeClicked = false
      } else {
        this.password = ''
        this.passwordHint = response.msg
      }
      this.isLoading = false
    },
    async onResendClicked() {
      if (this.email.length === 0) {
        this.currentPageIndex = 0
        return
      }
      this.resendAvailable = false
      this.leftTimeText = 'Resend email in ' + this.leftTime + ' seconds.'
      const { data } = await userApis.sendVcode('', this.email, '', '0', '1') // uname, account, upass, register, vcode_only
      if (data.flag === 0) {
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
      if (data.flag === 0) {
        this.$router.push({ name: 'Login' })
        this.currentPageIndex = 0
      } else {
        this.vcode = ''
        this.vcodeErrorMessage = data.msg
        console.log(data.msg)
      }
      this.isLoading = false
    },
    onFacebookClicked() {
      this.isLoading = true
      if (this.$route.query.redirect) {
        const redirectStr = JSON.stringify({
          redirect: this.$route.query.redirect,
          hostId: '1234abcd'
        })
        window.location.href = Facebook.getDialogOAuthUrl(redirectStr, window.location.href)
      }
      const redirectStr = JSON.stringify({
        hostId: '1234abcd'
      })
      window.location.href = Facebook.getDialogOAuthUrl(redirectStr, window.location.href)
    },
    onGoogleClicked() {
      this.isLoading = true
      window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' +
      'scope=https://www.googleapis.com/auth/userinfo.profile&' +
      'include_granted_scopes=true&' +
      'response_type=code&' +
      'prompt=select_account&' +
      'state=state_parameter_vivipic&' +
      `redirect_uri=${window.location.href}&` +
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
}
.signup {
  margin: 0 auto;
  text-align: left;
  width: 360px;
  max-height: 100%;
  box-shadow: 0px 0px 32px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
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
    &:nth-child(1) { // img
      display: flex;
      justify-content: center;
      margin-bottom: 1vh;
    }
    &:nth-child(3) { // intro text
      margin: 0 auto;
      width: 85%;
      font-size: 14px;
      margin-bottom: 3vh;
      > div {
        margin-bottom: 0.5vh;
      }
    }
    &:nth-child(4),
    &:nth-child(5) { // fb/google buttons
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
    &:nth-child(6) { //email button
      margin: 0 auto;
      display: flex;
      justify-content: center;
      width: 80%;
      border-radius: 3px;
      background: linear-gradient(180deg, rgba(78, 171, 230, 0.817708) 0%, #3EA1E0 100%);
      margin-bottom: 2vh;
      &:hover {
        cursor: pointer;
        background: #4aa2da;
      }
      &:active {
        background: #4395c7;
      }
    }

    &:nth-child(7) {
      // login hint
      margin: 0 auto;
      width: 80%;
      font-size: 14px;
      margin-bottom: 2vh;
    }
  }
}

.signup-p1 {
  padding: 32px;

  > div {
    &:nth-child(1) { // title
      display: flex;
      justify-content: space-between;
      margin-bottom: 5vh;
      > button {
        padding-top: 7px;
      }
    }
    &:nth-child(2) { // input fields
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

.w-50 {
  width: 50%;
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
  font-family: Mulish;
  color: setColor(red);
  padding-top: 10px;
}

.btn-shadow {
  box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}
</style>
