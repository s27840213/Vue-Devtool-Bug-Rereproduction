<template lang="pug">
div(style="position:relative;")
  div(class="signup-wrapper")
    div(v-if="currentPageIndex === 0" class="signup signup-p0")
      div
        img(:src="require('@/assets/img/svg/signup.svg')" class="w-50")
      div(class="text-center")
        span(class="text-blue-1 h-5") SIGH UP
      div
        img(:src="require('@/assets/img/png/facebook.png')")
        btn(:type="'icon-mid-body'") Sign up with Facebook
      div
        img(:src="require('@/assets/img/png/google.png')")
        btn(:type="'icon-mid-body'") Sign up with Google
      div
        span or
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
      div
        btn(:type="'icon-mid'" class="bg-gray-2 text-white btn-shadow" @click.native="onSignUpClicked()") Sign up
    div(v-if="currentPageIndex === 1" class="signup")
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
</template>

<script lang="ts">
import Vue from 'vue'
import store from '@/store'
import userApis from '@/apis/user'

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
      vcodeErrorMessage: 'Invalid verification code.' as string,
      isVcodeClicked: false as boolean,
      isPeerPassword: false as boolean
    }
  },
  computed: {
    nameValid (): boolean {
      if (!this.isSignUpClicked) {
        return true
      } else if (this.name.length > 0) {
        return true
      } else {
        return false
      }
    },
    mailValid (): boolean {
      if (!this.isSignUpClicked) {
        return true
      } else if (this.email.length > 0) {
        return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(this.email)
      } else {
        return false
      }
    },
    mailErrorMessage (): string {
      if (this.email.length === 0) {
        return 'Please enter your email.'
      } else {
        return 'Invalid email address format.'
      }
    },
    passwordLengthValid (): boolean {
      if (this.password.length >= 8 && this.password.length <= 18) {
        return true
      } else {
        return false
      }
    },
    passwordContainEng (): boolean {
      if (this.password.match(/.*[a-zA-Z]+.*/)) {
        return true
      } else {
        return false
      }
    },
    passwordContainNum (): boolean {
      if (this.password.match(/.*[0-9]+.*/)) {
        return true
      } else {
        return false
      }
    },
    passwordValid (): boolean {
      if (!this.isSignUpClicked) {
        return true
      } else if (this.passwordLengthValid && this.passwordContainEng && this.passwordContainNum) {
        return true
      } else {
        return false
      }
    },
    togglePeerPasswordIcon (): string {
      return `eye${this.isPeerPassword ? '-slash' : ''}`
    },
    togglePeerPasswordInput (): string {
      return `${this.isPeerPassword ? 'text' : 'password'}`
    },
    vcodeValid (): boolean {
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
    async onSignUpClicked () {
      console.log('onSignUpClicked')
      this.isSignUpClicked = true
      if (!this.nameValid || !this.mailValid || !this.passwordValid) {
        return
      }
      const response = await store.dispatch('user/register', { type: '0', uname: this.name, account: this.email, upass: this.password })
      if (response.flag === 0) {
        this.currentPageIndex = 1
        this.isVcodeClicked = false
      }
    },
    async onResendClicked () {
      if (this.email.length === 0) {
        this.currentPageIndex = 0
        return
      }
      this.resendAvailable = false
      this.leftTimeText = 'Resend email in ' + this.leftTime + ' seconds.'
      const { data } = await userApis.sendVcode('', this.email, '', '0', '1') // uname, account, upass, register, vcode_only
      console.log(data)
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
    async onEnterCodeDoneClicked () {
      this.isVcodeClicked = true
      if (this.email.length === 0) {
        this.currentPageIndex = 0
        return
      }
      if (!this.vcodeValid) {
        this.vcodeErrorMessage = 'Please enter the verification code.'
        return
      }
      const { data } = await userApis.verifyVcode(this.email, this.vcode) // account, vcode
      if (data.flag === 0) {
        console.log('token', data.token)
        console.log('token_expire', data.expire_time)
        // this.currentPageIndex = 2
      } else {
        this.vcode = ''
        this.vcodeErrorMessage = data.msg
        console.log(data.msg)
      }
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
  padding: 0 32px 20px 32px;
  > div {
    &:nth-child(1) {
      display: flex;
      justify-content: center;
      margin-bottom: 1vh;
    }
    &:nth-child(3), &:nth-child(4) { // Facebook and Google
      margin: 0 auto;
      display: flex;
      align-items: center;
      height: 40px;
      width: 80%;
      background: linear-gradient(180deg, #FFFFFF 29.69%, #F9F9F9 100%);
      border: 1px solid #D9DBE1;
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
    &:nth-child(5) { // -or-
      display: block;
      text-align: center;
      overflow: hidden;
      white-space: nowrap;
      > span {
        position: relative;
        display: inline-block;
      }
      > span:before, > span:after {
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
      margin-bottom: 0;
    }
    &:nth-child(6) { // input fields
      > div {
        margin-bottom: 1vh;
      }
    }
    &:nth-child(7) { // sign up button
      display: flex;
      justify-content: center;
      margin-bottom: 0;
      button {
        width: 60%;
        height: 40px;
      }
    }
  }
}

.w-50 {
  width: 50%;
}
.input-invalid {
  border: 1px solid setColor(red) !important;
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
