<template lang="pug">
div(style="position:relative;")
  div(class="login-wrapper")
    div(v-if="currentPageIndex === 0" class="login")
      div
        img(:src="require('@/assets/img/svg/signup.svg')" class="w-50")
      div(class="text-center")
        span(class="text-blue-1 h-4") LOG IN
      div
        img(:src="require('@/assets/img/png/facebook.png')")
        btn(:type="'icon-mid-body'") Log in with Facebook
      div
        img(:src="require('@/assets/img/png/google.png')")
        btn(:type="'icon-mid-body'") Log in with Google
      div
        span or
      div
        div
          span(class="label-mid") Email
          property-bar(class="mt-5" :class="{'input-invalid': !mailValid}")
            input(class="body-2 text-gray-2" v-model="email" type="email" min="0" placeholder="Your Email")
        div
          div(class="disp-flex flex-between")
            span(class="label-mid") Password
            span
              a(class="body-2 text-gray-3" href="") Forgot your password
          property-bar(class="mt-5")
            input(class="body-2 text-gray-2" v-model="password" type="number" min="0" placeholder="Your Password" :type="togglePeerPasswordInput")
            button(@click="isPeerPassword = !isPeerPassword")
              svg-icon(class="pointer"
              :iconName="togglePeerPasswordIcon" :iconWidth="'20px'" :iconColor="'gray-2'")
      div
        btn(:type="'icon-mid'" class="bg-gray-2 text-white btn-shadow"
        @click.native="onLogInClicked()") Log in
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Login',
  data() {
    return {
      email: '' as string,
      password: '' as string,
      vcode: '' as string,
      currentPageIndex: 0 as number,
      isLoginClicked: false as boolean,
      isPeerPassword: false as boolean
    }
  },
  computed: {
    mailValid (): boolean {
      if (!this.isLoginClicked) {
        return true
      } else if (this.email.length > 0) {
        return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(this.email)
      } else {
        return false
      }
    },
    togglePeerPasswordIcon (): string {
      return `eye${this.isPeerPassword ? '-slash' : ''}`
    },
    togglePeerPasswordInput (): string {
      return `${this.isPeerPassword ? 'text' : 'password'}`
    }
  },
  methods: {
    onLogInClicked () {
      console.log('onLogInClicked')
      this.isLoginClicked = true
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
    &:first-child {
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
    &:nth-child(5) {
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
      margin-bottom: 2vh;
    }
    &:nth-child(6) { // input fields
      > div {
        margin-bottom: 1.5vh;
        .property-bar:focus-within {
          border: 1px solid setColor(blue-1);
        }
      }
    }
    &:nth-child(7) { // login button
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

.btn-shadow {
  box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}

</style>
