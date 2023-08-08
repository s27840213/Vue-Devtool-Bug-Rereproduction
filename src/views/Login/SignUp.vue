<template lang="pug">
div(style="position:relative;")
  div(class="signup-wrapper popup-window")
    div(v-if="currentPageIndex === 0"
      class="signup signup-p0")
      div(class="signup-p0__img")
        img(:src="require('@/assets/img/svg/signup.svg')"
          style="width: 180px; height: 133px;")
      div(class="signup-p0__title text-center")
        span(class="text-blue-1 heading-5") {{$t('NN0300')}}
      div(class="signup-p0__desc")
        div {{$t('NN0301')}}
        div {{$t('NN0302')}}
      template(v-if="!inReviewMode")
        div(class="signup-p0__fb")
          btn(@click="onFacebookClicked()"
            :type="'icon-mid-body'")
          img(:src="require('@/assets/img/png/facebook.png')")
          span(class="body-2") {{$t('NN0303', {media:'Facebook'})}}
        div(class="signup-p0__google")
          btn(@click="onGoogleClicked()" :type="'icon-mid-body'")
          img(:src="require('@/assets/img/png/google.png')")
          span(class="body-2") {{$t('NN0303', {media:'Google'})}}
      div(class="signup-p0__mail")
        btn(@click="onEmailClicked()" :type="'icon-mid-body text-white'") {{$t('NN0303', {media: $tc('NN0173', 2)})}}
      div(class="signup-p0__login")
        span {{$t('NN0304')}}
        btn(:type="'icon'"
          class="h-link"
          @click="onLoginClicked()") {{$t('NN0305')}}
      div(class="signup-p0__close page-close")
        button(@click="onCloseClicked")
              svg-icon(class="pointer"
              iconName="page-close" :iconWidth="'15px'" :iconColor="'gray-3'")
    div(v-if="currentPageIndex === 1" class="signup signup-p1")
      div
        button(@click="onBackClicked")
              svg-icon(class="pointer"
              iconName="page-back" :iconWidth="'15px'" :iconColor="'gray-3'")
        span(class="text-blue-1") {{$t('NN0306')}}
        button(@click="onCloseClicked")
              svg-icon(class="pointer"
                iconName="page-close" :iconWidth="'15px'" :iconColor="'gray-3'")
      div
        div
          span(class="label-mid") {{$t('NN0172')}}
          property-bar(class="mt-5"
            :class="{'input-invalid': !nameValid}")
            input(class="body-2 text-gray-2"
              v-model="name" type="text" name="name"
              :placeholder="$t('NN0163', {term: $t('NN0172')})")
          div(v-if="!nameValid" class="invalid-message")
            span {{$t('NN0163', {term: $t('NN0172')})}}
        div
          span(class="label-mid") {{$tc('NN0173', 1)}}
          property-bar(class="mt-5"
            :class="{'input-invalid': !mailValid}")
            input(class="body-2 text-gray-2"
              v-model="email" type="email" name="email"
              :placeholder="$t('NN0163', {term: $tc('NN0173', 2)})")
          div(v-if="!mailValid"
            class="invalid-message")
            span {{ mailErrorMessage }}
        div
          span(class="label-mid") {{$tc('NN0180', 1)}}
          property-bar(class="mt-5"
            :class="{'input-invalid': !passwordValid}")
            input(class="body-2 text-gray-2"
              v-model="password"
              :placeholder="$t('NN0163', {term: $tc('NN0180', 2)})"
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
                :class="{'text-green-1': passwordLengthValid}") {{$t('NN0293', {len: 8})}}
            div
              svg-icon(class="pointer"
                :iconName="`${passwordContainEng ? '' : 'un'}check`" :iconWidth="'25px'"
                :iconColor="`${passwordContainEng ? 'green-1' : 'red'}`")
              span(class="ml-5 mt-2"
                :class="{'text-green-1': passwordContainEng}") {{$t('NN0294')}}
            div
              svg-icon(class="pointer"
                :iconName="`${passwordContainNum ? '' : 'un'}check`" :iconWidth="'25px'"
                :iconColor="`${passwordContainNum ? 'green-1' : 'red'}`")
              span(class="ml-5 mt-2"
                :class="{'text-green-1': passwordContainNum}") {{$t('NN0295')}}
      div
        btn(:type="'primary-mid'"
          class="bg-gray-2 text-white btn-shadow"
          @click="onSignUpClicked()") {{$tc('NN0169',2)}}
      div
        i18n-t(keypath="NN0307" tag="span")
          template(#use)
            a(class="h-link" :href="termsPage") {{$t('NN0162')}}
          template(#privacy)
            a(class="h-link" :href="privacyPage") {{$t('NN0161')}}
      div
        span {{$t('NN0304')}}
        btn(:type="'icon'"
          class="h-link"
          @click="onLoginClicked()") {{$t('NN0305')}}
    div(v-if="currentPageIndex === 2"
      class="signup signup-p2")
      div(class="text-center")
        span(class="text-blue-1 heading-5") {{$t('NN0284')}}
      div
        span(class="body-2") {{$t('NN0285', {email: email, time: 10})}}
      div
        property-bar(:class="{'input-invalid': !vcodeValid}")
          input(class="body-2 text-gray-2"
            v-model="vcode" type="text" name="vcode"
            placeholder="Enter code")
        div(v-if="!vcodeValid"
          class="invalid-message")
          span {{ vcodeErrorMessage }}
      div(style="margin-bottom: 15px;")
        nubtn(size="mid-full" @click="onEnterCodeDoneClicked()") {{$tc('NN0133',2)}}
      div(class="page-close")
        button(@click="onCloseClicked")
          svg-icon(class="pointer"
            iconName="page-close" :iconWidth="'15px'" :iconColor="'gray-3'")
      div(v-if="resendAvailable"
        class="flex flex-between align-center"
        style="height:30px; margin-bottom: 0;")
        span {{$t('NN0288')}}
        btn(:type="'icon'"
          class="text-blue-1 body-1"
          @click="onResendClicked()") {{$t('NN0290')}}
      div(v-else
        class="flex align-center text-gray-3"
        style="height:30px; margin-bottom: 0;")
        span {{ leftTimeText }}
  spinner(v-if="isLoading")
</template>

<script lang="ts">
import userApis from '@/apis/user'
import { ILoginResult } from '@/interfaces/api'
import store from '@/store'
import fbPixelUtils from '@/utils/fbPixelUtils'
import gtmUtils from '@/utils/gtmUtils'
import localeUtils from '@/utils/localeUtils'
import logUtils from '@/utils/logUtils'
import loginUtils from '@/utils/loginUtils'
import picWVUtils from '@/utils/picWVUtils'
import { notify } from '@kyvg/vue3-notification'
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
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
      passwordHint: this.$t('NN0308') as string,
      vcodeErrorMessage: this.$t('NN0298') as string,
      isVcodeClicked: false as boolean,
      isPeerPassword: false as boolean,
      isRollbackByGoogleSignIn: window.location.href.indexOf('googleapi') > -1 as boolean,
      isLoading: false,
      privacyPage: '',
      termsPage: ''
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

    switch (this.currLocale) {
      case 'tw':
        this.privacyPage = 'https://blog.vivipic.com/tw/tw-privacy-policy/'
        this.termsPage = 'https://blog.vivipic.com/tw/tw-agreement/'
        break
      case 'jp':
        this.privacyPage = 'https://blog.vivipic.com/jp/jp-privacy-policy/'
        this.termsPage = 'https://blog.vivipic.com/jp/jp-terms-of-use/'
        break
      default:
        this.privacyPage = 'https://blog.vivipic.com/us-privacy-policy/'
        this.termsPage = 'https://blog.vivipic.com/us-terms-of-use/'
        break
    }
  },
  computed: {
    inReviewMode(): boolean {
      return picWVUtils.inReviewMode
    },
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
        return this.$t('NN0163', { term: this.$tc('NN0173', 2) }) as string
      } else {
        return this.$t('NN0297') as string
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
    },
    currLocale(): string {
      return localeUtils.currLocale()
    }
  },
  methods: {
    async fbLogin(code: string, redirectUri: string, redirect: string) {
      try {
        // code -> access_token
        const { data } = await userApis.fbLogin(code, redirectUri, this.currLocale)
        this.handleLoginResult(data, 'Facebook', 'fb', redirect)
      } catch (error) {
        logUtils.setLogForError(error as Error)
      }
    },
    async googleLogin(code: string, redirectUri: string, redirect: string) {
      try {
        // idToken -> token
        const { data } = await userApis.googleLogin(code, redirectUri, this.currLocale)
        this.handleLoginResult(data, 'Google', 'google', redirect)
      } catch (error) {
        logUtils.setLogForError(error as Error)
      }
    },
    handleLoginResult(data: { data: ILoginResult, flag: number, msg?: string }, gtmTitle: 'Facebook' | 'Google' | 'Vivipic', loginType: string, redirect?: string) {
      if (data.flag === 0) {
        if (data.data.new_user) {
          if (picWVUtils.inBrowserMode) {
            fbPixelUtils.fbq('track', 'CompleteRegistration')
          } else {
            picWVUtils.sendAdEvent('register')
          }
          gtmUtils.signUp(gtmTitle)
        }
        store.dispatch('user/loginSetup', { data: data })
        this.$router.push(this.redirect || redirect || '/')
      } else {
        logUtils.setLogAndConsoleLog(`${loginType} login failed`)
        notify({ group: 'error', text: data.msg })
      }
      this.isLoading = false
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
      logUtils.setLogAndConsoleLog('Click close icon')
      this.$router.push({ name: 'Home' })
    },
    async onSignUpClicked() {
      this.emailResponseError = false
      this.isSignUpClicked = true
      this.isLoading = true
      if (!this.nameValid || !this.mailValid || !this.passwordValid) {
        this.isLoading = false
        this.passwordHint = this.$t('NN0308') as string
        return
      }
      const parameter = {
        uname: this.name,
        account: this.email,
        upass: this.password,
        locale: this.currLocale
      }
      const response = await store.dispatch('user/register', parameter)
      if (response.flag === 0) {
        this.currentPageIndex = 2
        this.isVcodeClicked = false
      } else {
        this.emailResponseError = true
        this.passwordHint = response.msg || this.$t('NN0242')
      }
      this.isLoading = false
    },
    async onResendClicked() {
      logUtils.setLogAndConsoleLog('Resend Vcode')
      this.isLoading = true
      if (this.email.length === 0) {
        this.currentPageIndex = 0
        this.isLoading = false
        return
      }
      this.resendAvailable = false
      this.leftTimeText = this.$t('NN0289', { time: this.leftTime }) as string
      const parameter = {
        account: this.email,
        register: '1',
        vcode_only: '1',
        locale: this.currLocale,
        type: 3
      }
      const data = await store.dispatch('user/sendVcode', parameter)
      if (data.flag === 0) {
        this.isLoading = false
        const clock = window.setInterval(() => {
          this.leftTime--
          this.leftTimeText = this.$t('NN0289', { time: this.leftTime }) as string
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
        this.vcodeErrorMessage = this.$t('NN0163', { term: this.$t('NN0286') }) as string
        this.isLoading = false
        return
      }
      const parameter = {
        account: this.email,
        vcode: this.vcode,
        locale: this.currLocale,
        type: 3
      }
      const data = await store.dispatch('user/verifyVcode', parameter)
      if (data.flag === 0) {
        if (picWVUtils.inBrowserMode) {
          fbPixelUtils.fbq('track', 'CompleteRegistration')
        } else {
          picWVUtils.sendAdEvent('register')
        }
        logUtils.setLogAndConsoleLog('Verify Vcode and register success')
        gtmUtils.signUp('Vivipic')
        await store.dispatch('user/login', { token: data.token })
        this.$router.push(this.redirect || '/')
        this.currentPageIndex = 0
      } else {
        logUtils.setLogAndConsoleLog(`Verify Vcode failed (msg: ${data.msg})`)
        this.vcode = ''
        this.vcodeErrorMessage = data.msg || this.$t('NN0242')
      }
      this.isLoading = false
    },
    async onFacebookClicked() {
      logUtils.setLogAndConsoleLog('Click Facebook login')
      if (picWVUtils.inBrowserMode) {
        loginUtils.onFacebookClicked(this.redirect)
      } else {
        this.isLoading = true
        const data = await picWVUtils.login('Facebook', this.$i18n.locale)
        this.isLoading = false
        this.handleLoginResult(data, 'Facebook', 'fb')
      }
    },
    async onGoogleClicked() {
      logUtils.setLogAndConsoleLog('Click Google login')
      if (picWVUtils.inBrowserMode) {
        loginUtils.onGoogleClicked(this.redirect)
      } else {
        this.isLoading = true
        const data = await picWVUtils.login('Google', this.$i18n.locale)
        this.isLoading = false
        this.handleLoginResult(data, 'Google', 'google')
      }
    }
  }
})
</script>

<style lang="scss" scoped>
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
  &-p1, &-p2 {
    > div {
      margin-bottom: 2vh;
    }
  }
  .property-bar:focus-within {
    border: 1px solid setColor(blue-1);
  }
}
.signup-p0 {
  padding: 0 32px 32px 32px;
  &__img {
    display: flex;
    justify-content: center;
    margin-bottom: 1vh;
  }
  &__title {
    margin-bottom: 2vh;
  }
  &__desc {
    margin: 0 auto;
    width: 90%;
    text-align: center;
    font-size: 14px;
    margin-bottom: 3vh;
    > div {
      margin-bottom: 0.5vh;
    }
  }
  &__fb, &__google {
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
  &__mail {
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
  &__login {
    margin: 0 auto;
    width: 80%;
    font-size: 14px;
    margin-bottom: 2vh;
  }
  &__close {
    position: absolute;
    right: 15px;
    top: 15px;
    margin-bottom: 2vh;
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
  font-size: 14px;
  padding-left: 2px;
  padding-right: 2px;
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
