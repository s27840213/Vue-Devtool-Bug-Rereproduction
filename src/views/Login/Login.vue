<template lang="pug">
div(style="position:relative;")
  div(class="login-wrapper")
    div(class="login")
      div(class="login__title")
        span(class="text-blue-1 h-4") LOG IN
      div
        span Email
        property-bar
          input(class="body-2 text-gray-2" type="email" min="0" placeholder="Your Email")
      div
        div(class="password-label")
          span Password
          span
            a(class="text-blue-1" href="") Forgot your password
        property-bar
          input(class="body-2 text-gray-2" v-model="password" type="number" min="0" placeholder="Your Password" :type="togglePeerPasswordInput")
          button(@click="isPeerPassword = !isPeerPassword")
            svg-icon(class="pointer"
            :iconName="togglePeerPasswordIcon" :iconWidth="'20px'" :iconColor="'gray-2'")
      div
        btn(:type="'primary-mid'") Log in
      div
        span or
      div
        btn(:type="'white-mid'") Facebook
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Login',
  data() {
    return {
      password: '' as string,
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
    margin-bottom: 15px;
    &:first-child {
      margin-bottom: 30px;
    }
    // &:nth-child(4) {
    //   display: flex;
    //   justify-content: flex-end;
    //   margin-bottom: 40px;
    // }
    &:nth-child(4) {
      display: flex;
      justify-content: center;
      margin-top: 40px;
      margin-bottom: 40px;
      button {
        width: 50%;
      }
    }
    &:nth-child(5) {
      display: block;
      text-align: center;
      overflow: hidden;
      white-space: nowrap;
      margin-bottom: 40px;
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
    &:nth-child(6) {
      button {
        border: 2px solid #3C64B1;
      }
    }
  }
}

.login__title {
  text-align: center;
}

.password-label {
  display: flex;
  justify-content: space-between;
}

</style>
