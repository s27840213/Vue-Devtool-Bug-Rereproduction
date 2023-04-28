<template lang="pug">
div(style="position: relative;")
  div(class="login-wrapper popup-window")
    div(v-if="currentPageIndex === 0"
      class="login login-p0")
      div(class="login-p0__img")
        img(:src="require('@/assets/img/svg/signup.svg')"
          style="width: 180px; height: 133px;")
      div(class="login-p0__title text-center")
        span(class="text-blue-1 heading-5") {{$tc('NN0168',2)}}
      template(v-if="!inReviewMode")
        div(class="login-p0__fb")
          btn(@click="onFacebookClicked()"
            :type="'icon-mid-body'")
          img(:src="require('@/assets/img/png/facebook.png')")
          span(class="body-2") {{$t('NN0178', {media:'Facebook'})}}
        div(class="login-p0__google")
          btn(@click="onGoogleClicked()"
            :type="'icon-mid-body'")
          img(:src="require('@/assets/img/png/google.png')")
          span(class="body-2") {{$t('NN0178', {media:'Google'})}}
        div(class="login-p0__hr")
          span {{$t('NN0179')}}
      div(class="login-p0__mail")
        div
          span(class="label-mid") {{$tc('NN0173', 1)}}
          property-bar(class="mt-5"
            :class="{'input-invalid': !mailValid}")
            input(class="body-2 text-gray-2"
              v-model="email"
              type="email" name="email"
              :placeholder="$t('NN0163', {term: $tc('NN0173', 2)})")
          div(v-if="!mailValid"
            class="invalid-message")
            span {{ mailErrorMessage }}
        div
          div(class="flex flex-between")
            span(class="label-mid") {{$tc('NN0180', 1)}}
            btn(:type="'icon'"
              class="text-gray-3 body-2 forgot-pwd"
              @click="onForgotClicked()") {{$t('NN0181')}}
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
          div(v-if="!passwordValid"
            class="invalid-message")
            span {{ passwordErrorMessage }}
      div(class="login-p0__button")
        btn(:type="'primary-mid'"
          class="bg-gray-2 text-white btn-shadow"
          @click="onLogInClicked()") {{$tc('NN0168',2)}}
      div(class="login-p0__signup")
        span {{$t('NN0182')}}
        btn(:type="'icon'"
          class="h-link"
          @click="onSignupClicked()") {{$t('NN0183')}}
      div(class="login-p0__close page-close")
        button(@click="onCloseClicked")
          svg-icon(class="pointer"
            iconName="page-close" :iconWidth="'15px'" :iconColor="'gray-3'")
    div(v-if="currentPageIndex === 1"
      class="login login-p1")
      div(class="text-center")
        span(class="text-blue-1 heading-5") {{$t('NN0181')}}?
      div
        span(v-html="$t('NN0282')")
      div
        property-bar(class="mt-5"
          :class="{'input-invalid': !mailValid || emailResponseError}")
          input(class="body-2 text-gray-2"
            v-model="email"
            type="email" name="email"
            :placeholder="$t('NN0163', {term: $tc('NN0173', 2)})")
        div(v-if="!mailValid || emailResponseError"
          class="invalid-message")
          span {{ mailErrorMessage }}
      div(class="pb-10")
        span(class="forgot-hint" v-html="$t('NN0395')")
      div(class="flex"
        :class="hideBackButton ? 'pt-20' : ''"
        style="justify-content: center;")
        btn(:type="'primary-mid'"
          class="btn-shadow"
          style="width: 50%;"
          @click="onSendEmailClicked()") {{$tc('NN0164', 2)}}
      div(v-if="!hideBackButton"
        class="flex"
        style="justify-content: center;")
        btn(:type="'icon-mid'"
          class="bg-gray-3 text-white btn-shadow"
          style="width: 50%;"
          @click="onBackClicked()") {{$t('NN0283')}}
      div(class="page-close")
        button(@click="onCloseClicked")
          svg-icon(class="pointer"
            iconName="page-close" :iconWidth="'15px'" :iconColor="'gray-3'")
    div(v-if="currentPageIndex === 2"
      class="login login-p2")
      div(class="text-center")
        span(class="text-blue-1 heading-5") {{$t('NN0284')}}
      div
        span(class="body-2") {{$t('NN0285', {email: email, time: 10})}}
      div
        property-bar(:class="{'input-invalid': !vcodeValid}")
          input(class="body-2 text-gray-2"
            v-model="vcode" type="text" name="vcode"
            :placeholder="$t('NN0163', {term: $t('NN0286')})")
        div(v-if="!vcodeValid"
          class="invalid-message")
          span {{ vcodeErrorMessage }}
      div(style="margin-bottom: 15px;")
        btn(:type="'primary-mid'"
          class="btn-shadow full-width"
          @click="onEnterCodeDoneClicked()") {{$tc('NN0133',2)}}
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
      div(class="page-close")
        button(@click="onCloseClicked")
          svg-icon(class="pointer"
            iconName="page-close" :iconWidth="'15px'" :iconColor="'gray-3'")
    div(v-if="currentPageIndex === 3"
      class="login login-p3")
      div(class="text-center")
        span(class="text-blue-1 heading-5") {{$t('NN0291')}}
      div
        div
          span(class="label-mid") {{$t('NN0292')}}
        property-bar(class="mt-5"
          :class="{'input-invalid': !resetPasswordValid}")
          input(class="body-2 text-gray-2"
            v-model="password"
            :placeholder="$t('NN0292')"
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
              :class="{'text-green-1': passwordLengthValid}") {{$t('NN0293', {len: 8})}}
          div
            svg-icon(class="pointer"
              :iconName="`${passwordContainEng ? '' : 'un'}check`" :iconWidth="'25px'"
              :iconColor="`${passwordContainEng ? 'green-1' : 'red'}`")
            span(class="ml-5"
              :class="{'text-green-1': passwordContainEng}") {{$t('NN0294')}}
          div
            svg-icon(class="pointer"
              :iconName="`${passwordContainNum ? '' : 'un'}check`" :iconWidth="'25px'"
              :iconColor="`${passwordContainNum ? 'green-1' : 'red'}`")
            span(class="ml-5"
              :class="{'text-green-1': passwordContainNum}") {{$t('NN0295')}}
        div(class="mt-20")
          span(class="label-mid") {{$t('NN0296')}}
        property-bar(class="mt-5"
          :class="{'input-invalid': !confirmPasswordValid}")
          input(class="body-2 text-gray-2"
            v-model="confirmPassword"
            :placeholder="$t('NN0296')"
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
            @click="onResetDoneClicked()") {{$t('NN0287')}}
        div(class="page-close")
          button(@click="onCloseClicked")
            svg-icon(class="pointer"
              iconName="page-close" :iconWidth="'15px'" :iconColor="'gray-3'")
  spinner(v-if="isLoading")
</template>

<script lang="ts">
import userApis from '@/apis/user'
import { ILoginResult } from '@/interfaces/api'
import store from '@/store'
import fbPixelUtils from '@/utils/fbPixelUtils'
import gtmUtils from '@/utils/gtmUtils'
import localeUtils from '@/utils/localeUtils'
import loginUtils from '@/utils/loginUtils'
import picWVUtils from '@/utils/picWVUtils'
import { notify } from '@kyvg/vue3-notification'
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
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
      passwordErrorMessage: this.$t('NN0163', { term: this.$tc('NN0180', 2) }) as string,
      emailResponseError: false as boolean,
      mailErrorMessage: this.$t('NN0297') as string,
      vcodeErrorMessage: this.$t('NN0298') as string,
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
    inReviewMode(): boolean {
      return picWVUtils.inReviewMode
    },
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
      }
    },
    async googleLogin(code: string, redirectUri: string, redirect: string) {
      try {
        // idToken -> token
        const { data } = await userApis.googleLogin(code, redirectUri, this.currLocale)
        this.handleLoginResult(data, 'Google', 'google', redirect)
      } catch (error) {
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
        console.log(`${loginType} login failed`)
        notify({ group: 'error', text: data.msg })
      }
      this.isLoading = false
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
        this.passwordErrorMessage = this.$t('NN0163', { term: this.$tc('NN0180', 2) }) as string
        this.isLoading = false
        return
      }
      if (!this.mailValid || !this.passwordValid) {
        this.isLoading = false
        return
      }
      const data = await store.dispatch('user/login', { token: '', account: this.email, password: this.password })
      if (data.flag === 0) {
        this.$router.push(this.redirect || '/')
      } else {
        this.password = ''
        this.passwordErrorMessage = data.msg || this.$t('NN0242')
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
      this.$router.push({ name: 'Home' })
    },
    async onSendEmailClicked() {
      this.isLoginClicked = true
      this.emailResponseError = false
      this.isLoading = true
      if (this.email.length === 0) {
        this.isLoading = false
        this.mailErrorMessage = this.$t('NN0163', { term: this.$tc('NN0173', 2) }) as string
        return
      }
      if (!this.mailValid) {
        this.isLoading = false
        this.mailErrorMessage = this.$t('NN0297') as string
        return
      }
      const parameter = {
        account: this.email,
        register: '0',
        vcode_only: '1',
        locale: this.currLocale,
        type: 2
      }
      const data = await store.dispatch('user/sendVcode', parameter)
      if (data.flag === 0) {
        this.isVcodeClicked = false
        this.currentPageIndex = 2
      } else {
        this.emailResponseError = true
        this.mailErrorMessage = data.msg || this.$t('NN0242')
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
      this.leftTimeText = this.$t('NN0289', { time: this.leftTime }) as string
      const parameter = {
        account: this.email,
        register: '0',
        vcode_only: '1',
        locale: this.currLocale,
        type: 2
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
        type: 2
      }
      const data = await store.dispatch('user/verifyVcode', parameter)
      this.vcode = ''
      if (data.flag === 0) {
        this.currentPageIndex = 3
        this.isResetClicked = false
        this.token = data.token
      } else {
        this.vcodeErrorMessage = data.msg || this.$t('NN0242')
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
        this.confirmErrorMessage = this.$t('NN0163', { term: this.$t('NN0292') }) as string
        this.isLoading = false
        return
      } else if (!this.resetPasswordValid || !this.confirmPasswordValid) {
        this.confirmErrorMessage = this.$t('NN0298') as string
        this.isLoading = false
        return
      }

      const data = await store.dispatch('user/updateUser', { token: this.token, upass: this.password })
      this.password = ''
      this.confirmPassword = ''
      if (data.flag === 0) {
        this.email = ''
        this.currentPageIndex = 0
        this.isLoginClicked = false
      } else {
        this.confirmErrorMessage = data.msg || this.$t('NN0242')
      }
      this.isLoading = false
    },
    async onFacebookClicked() {
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
.login {
  position: relative;
  margin: 0 auto;
  text-align: left;
  width: 360px;
  max-height: 100%;
  box-shadow: 0px 0px 32px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background-color: white;
  padding: 32px;
  &-p1, &-p2, &-p3 {
    > div {
      margin-bottom: 2vh;
    }
  }
  .property-bar:focus-within {
    border: 1px solid setColor(blue-1);
  }
}
.login-p0 {
  padding: 0 32px 20px 32px;
  &__img {
    display: flex;
    justify-content: center;
    margin-bottom: 1vh;
  }
  &__title {
    margin-bottom: 2vh;
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
  &__hr {
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
  &__mail {
    margin-bottom: 2vh;
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
  &__button {
    display: flex;
    justify-content: center;
    margin-bottom: 2vh;
    button {
      width: 60%;
      height: 40px;
    }
  }
  &__signup {
    font-size: 14px;
    margin-bottom: 2vh;
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
.forgot-hint {
  font-size: 12px;
  color: setColor(gray-3);
}
</style>
