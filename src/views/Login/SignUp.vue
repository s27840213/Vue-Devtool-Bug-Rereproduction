<template lang="pug">
div(style="position:relative;")
  div(class="signup-wrapper")
    div(v-if="currentPageIndex === 0" class="signup signup-p0")
      div(class="text-center")
        span(class="text-blue-1 h-4") SIGH UP
      div
        btn(:type="'white-mid'") Sign up with Facebook
      div
        span or
      div
        div
          span Name
          property-bar
            input(class="body-2 text-gray-2" v-model="name" type="text" name="name" placeholder="Your Name")
        div
          span Email
          property-bar
            input(class="body-2 text-gray-2" v-model="email" type="email" min="0" placeholder="Your Email")
        div
          span Password
          property-bar
            input(class="body-2 text-gray-2" v-model="password" type="number" min="0" placeholder="Your Password" :type="togglePeerPasswordInput")
            button(@click="isPeerPassword = !isPeerPassword")
              svg-icon(class="pointer"
              :iconName="togglePeerPasswordIcon" :iconWidth="'20px'" :iconColor="'gray-2'")
          span 8 or more characters with letters and numbers.
      div
        btn(:type="'icon-mid'" class="bg-gray-2 text-white btn-shadow" @click.native="onSignUpClicked()") Sign up
    div(v-if="currentPageIndex === 1" class="signup")
      div(class="text-center")
        span(class="text-blue-1 h-4") Verify code is sent
      div
        span We sent an email to {{ email }}. Please enter the code in the email within 10 minutes.
      div
        property-bar
          input(class="body-2 text-gray-2" v-model="vcode" type="text" min="0" placeholder="Enter code")
      div(style="margin-bottom: 15px;")
        btn(:type="'primary-mid'" class="btn-shadow full-width" @click.native="onEnterCodeDoneClicked()") Done
      div(
        v-if="resendAvailable" class="disp-flex flex-between align-center"
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
      isPeerPassword: false as boolean
    }
  },
  computed: {
    togglePeerPasswordIcon (): string {
      return `eye${this.isPeerPassword ? '-slash' : ''}`
    },
    togglePeerPasswordInput (): string {
      return `${this.isPeerPassword ? 'text' : 'password'}`
    }
  },
  methods: {
    async onSignUpClicked () {
      console.log('onSignUpClicked')
      const response = await store.dispatch('register', { type: '0', uname: this.name, account: this.email, upass: this.password })
      if (response.flag === 0) {
        this.currentPageIndex = 1
      }
    },
    async onResendClicked () {
      this.resendAvailable = false
      this.leftTimeText = 'Resend email in ' + this.leftTime + ' seconds.'
      const response = await store.dispatch('register', { type: '1', uname: '', account: this.email, upass: '' })
      if (response.flag === 0) {
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
      const response = await store.dispatch('verifyVcode', { type: '2', account: this.email, vcode: this.vcode })
      if (response.flag === 0) {
        console.log('success!')
        // this.currentPageIndex = 2
      } else {
        console.log(response.msg)
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
    margin-bottom: 30px;
  }
}
.signup-p0 {
  > div {
    &:nth-child(2) { // Facebook
      display: flex;
      justify-content: center;
      border: 2px solid #3C64B1;
    }
    &:nth-child(3) { // -or-
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
    }
    &:nth-child(4) { // input fields
      > div {
        margin-bottom: 15px;
      }
    }
    &:nth-child(5) { // sign up button
      display: flex;
      justify-content: center;
      margin-top: 40px;
      margin-bottom: 40px;
      button {
        width: 60%;
      }
    }
  }
}

.password-label {
  display: flex;
  justify-content: space-between;
}

.btn-shadow {
  box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}

</style>
