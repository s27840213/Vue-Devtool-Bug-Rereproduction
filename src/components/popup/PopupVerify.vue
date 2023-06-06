<template lang="pug">
div(class="popup-verify"
  v-click-outside="closePopup")
  div(v-if="currentPage === 'vcode'")
    div(class="popup-verify__close")
      svg-icon(class="pointer" iconName="page-close"
        :iconWidth="'10px'" iconColor="gray-0"
        @click="closePopup()")
    div(class="text-blue-1 heading-5 pb-20 text-center") {{$t('NN0284')}}
    div(class="pb-20")
      span(class="body-2") {{$t('NN0285', {email: account, time: 10})}}
    div
      property-bar(:class="{'input-invalid': !vcodeValid}")
        input(class="body-2 text-gray-2"
          v-model="vcode" type="text" name="vcode"
          :placeholder="$t('NN0163', {term: $t('NN0286')})")
      div(v-if="!vcodeValid"
        class="invalid-message")
        span {{ vcodeErrorMessage }}
      div(class="my-10")
        nubtn(size="mid-full" @click="onEnterCodeDoneClicked()") {{$tc('NN0133',2)}}
      div(v-if="resendAvailable"
        class="popup-verify__vcode-bottom")
        span {{$t('NN0288')}}
        btn(:type="'icon'"
          class="text-blue-1"
          @click="onResendClicked()") {{$t('NN0290')}}
      div(v-else
        class="popup-verify__vcode-bottom text-gray-3")
        span {{ leftTimeText }}
  div(v-if="currentPage === 'oldPass'")
    div(class="popup-verify__close")
      svg-icon(class="pointer" iconName="page-close"
        :iconWidth="'10px'" iconColor="gray-0"
        @click="closePopup()")
    div(class="label-lg pb-20 text-center") {{$t('NN0335')}}
    div(class="pb-10 body-2 text-gray-3 text-center") {{$t('NN0337')}}
    div
      property-bar(:class="{'input-invalid': !oldPassValid}")
        input(class="body-2 text-gray-2"
          v-model="oldPass" type="password" name="oldPass"
          @input="onUpdate"
          :placeholder="$t('NN0163', {term: $t('NN0336')})")
      div(class="popup-verify__forgot-pwd")
        div(class="invalid-message")
          span(v-if="!oldPassValid") {{ oldPassErrorMessage }}
        btn(:type="'icon'"
          class="pt-5 body-2"
          @click="onForgotClicked()") {{$t('NN0181')}}
      div(class="popup-verify__btns my-15")
        nubtn(theme="secondary" size="mid-full" @click="closePopup()") {{$t('NN0203')}}
        nubtn(size="mid-full" @click="onCheckPasswordClicked()") {{$t('NN0338')}}
  div(v-if="currentPage === 'newPass'")
    div(class="popup-verify__close")
      svg-icon(class="pointer" iconName="page-close"
        :iconWidth="'10px'" iconColor="gray-0"
        @click="closePopup()")
    div(class="label-lg pb-20 text-center") {{$t('NN0291')}}
    div
      property-bar(:class="{'input-invalid': !resetPasswordValid}")
        input(class="body-2 text-gray-2"
          v-model="newPass" name="newPass"
          :placeholder="$t('NN0163', { term: $t('NN0292') })"
          @input="onUpdate"
          :type="togglePeerPasswordInput")
        button(@click="isPeerPassword = !isPeerPassword")
          svg-icon(class="pointer"
          :iconName="togglePeerPasswordIcon" :iconWidth="'20px'" :iconColor="'gray-2'")
      div(v-if="emptyPassword || isResponseError"
        class="body-3 pt-15 pb-40 pl-5"
        :style="`${resetPasswordValid && !isResponseError ? '' : 'color: #EB5757;'}`")
          span {{ passwordHint }}
      div(v-else
        class="invalid-message mt-10")
        div(class="flex align-center")
          svg-icon(class="pointer"
            :iconName="`${passwordLengthValid ? '' : 'un'}check`" :iconWidth="'20px'"
            :iconColor="`${passwordLengthValid ? 'green-1' : 'red'}`")
          span(class="ml-5 body-3"
            :class="{'text-green-1': passwordLengthValid}") {{$t('NN0293', {len: 8})}}
        div(class="flex align-center")
          svg-icon(class="pointer"
            :iconName="`${passwordContainEng ? '' : 'un'}check`" :iconWidth="'20px'"
            :iconColor="`${passwordContainEng ? 'green-1' : 'red'}`")
          span(class="ml-5 body-3"
            :class="{'text-green-1': passwordContainEng}") {{$t('NN0294')}}
        div(class="flex align-center")
          svg-icon(class="pointer"
            :iconName="`${passwordContainNum ? '' : 'un'}check`" :iconWidth="'20px'"
            :iconColor="`${passwordContainNum ? 'green-1' : 'red'}`")
          span(class="ml-5 body-3"
            :class="{'text-green-1': passwordContainNum}") {{$t('NN0295')}}
      div(class="popup-verify__btns my-15")
        nubtn(theme="secondary" size="mid-full" @click="closePopup()") {{$t('NN0203')}}
        nubtn(size="mid-full" @click="onConfirmPasswordClicked()") {{$tc('NN0164', 2)}}
  div(v-if="currentPage === 'removeAvatar'")
    div(class="label-lg pb-20 text-center") {{$t('NN0339')}}
    div(class="popup-verify__btns my-15")
      nubtn(theme="secondary" size="mid-full" @click="closePopup()") {{$t('NN0203')}}
      nubtn(theme="danger" size="mid-full" @click="onRemoveAvatarClicked()") {{$t('NN0170')}}
  spinner(v-if="isLoading")
</template>

<script lang="ts">
import userApis from '@/apis/user'
import store from '@/store'
import localeUtils from '@/utils/localeUtils'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  props: {
    account: {
      type: String,
    },
    type: {
      type: String,
      required: true
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      currentPage: 'vcode',
      vcode: '' as string,
      oldPass: '',
      newPass: '',
      vcodeErrorMessage: this.$t('NN0298') as string,
      oldPassErrorMessage: '' as string,
      passwordHint: this.$t('NN0308') as string,
      leftTime: 60 as number,
      leftTimeText: '' as string,
      resendAvailable: true as boolean,
      isLoading: false,
      isResponseError: false,
      isPeerPassword: false as boolean,
      isVcodeClicked: false as boolean,
      isCheckPasswordClicked: false as boolean,
      isConfirmClicked: false as boolean
    }
  },
  created() {
    if (this.type) {
      this.currentPage = this.type
    }
  },
  computed: {
    ...mapGetters('user', {
      token: 'getToken',
      teamId: 'getTeamId'
    }),
    vcodeValid(): boolean {
      if (!this.isVcodeClicked) {
        return true
      } else if (this.vcode.length > 0) {
        return true
      } else {
        return false
      }
    },
    oldPassValid(): boolean {
      if (!this.isCheckPasswordClicked) {
        return true
      } else if (this.oldPass.length > 0) {
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
    passwordLengthValid(): boolean {
      if (this.newPass.length >= 8) {
        return true
      } else {
        return false
      }
    },
    passwordContainEng(): boolean {
      if (this.newPass.match(/.*[a-zA-Z]+.*/)) {
        return true
      } else {
        return false
      }
    },
    passwordContainNum(): boolean {
      if (this.newPass.match(/.*[0-9]+.*/)) {
        return true
      } else {
        return false
      }
    },
    emptyPassword(): boolean {
      return this.newPass.length === 0
    },
    resetPasswordValid(): boolean {
      if (!this.isConfirmClicked) {
        return true
      } else if (this.passwordLengthValid && this.passwordContainEng && this.passwordContainNum) {
        return true
      } else {
        return false
      }
    },
  },
  methods: {
    ...mapGetters({
      isLogin: 'user/isLogin'
    }),
    async onResendClicked() {
      this.isLoading = true
      if (!this.account || this.account.length === 0) {
        this.isLoading = false
        return
      }
      this.resendAvailable = false
      this.leftTimeText = this.$t('NN0289', { time: this.leftTime }) as string
      const parameter = {
        token: this.token,
        account: this.account,
        register: '0',
        vcode_only: '1',
        type: 1,
        locale: localeUtils.currLocale()
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
        this.isLoading = false
      }
    },
    async onEnterCodeDoneClicked() {
      this.isVcodeClicked = true
      this.isLoading = true
      if (!this.account || this.account.length === 0) {
        this.isLoading = false
        return
      }
      if (!this.vcodeValid) {
        this.vcodeErrorMessage = this.$t('NN0163', { term: this.$t('NN0286') }) as string
        this.isLoading = false
        return
      }
      const parameter = {
        token: this.token,
        vcode: this.vcode,
        type: 1
      }
      const data = await store.dispatch('user/verifyVcode', parameter)
      this.vcode = ''
      if (data.flag === 0) {
        this.$emit('isVerified')
      } else {
        this.vcodeErrorMessage = data.msg
        console.log(data.msg)
      }
      this.isLoading = false
    },
    async onCheckPasswordClicked() {
      this.isCheckPasswordClicked = true
      this.isLoading = true
      if (!this.oldPassValid) {
        this.oldPassErrorMessage = this.$t('NN0163', { term: this.$tc('NN0180', 2) }) as string
        this.isLoading = false
        return
      }
      const parameter = {
        token: this.token,
        account: this.account,
        upass: this.oldPass
      }
      const data = await store.dispatch('user/updateUser', parameter)
      if (data.flag === 0) {
        this.isConfirmClicked = false
        this.currentPage = 'newPass'
      } else {
        this.oldPass = ''
        this.oldPassErrorMessage = data.msg || this.$t('NN0242') as string
        console.log(data.msg)
      }
      this.isLoading = false
    },
    onUpdate() {
      this.isCheckPasswordClicked = false
      this.isConfirmClicked = false
    },
    async onConfirmPasswordClicked() {
      this.isConfirmClicked = true
      this.isResponseError = false
      if (!this.resetPasswordValid) {
        this.passwordHint = this.$t('NN0308') as string
        return
      }
      this.isLoading = true
      const parameter = {
        token: this.token,
        upass: this.newPass
      }
      const data = await store.dispatch('user/updateUser', parameter)
      if (data.flag === 0) {
        store.commit('user/SET_STATE', {
          upassUpdate: data.data.upass_update
        })
        this.closePopup()
      } else {
        this.isResponseError = true
        this.passwordHint = data.msg || this.$t('NN0242') as string
        console.log(data.msg)
      }
      this.isLoading = false
    },
    onForgotClicked() {
      this.$router.push({
        name: 'Login',
        query: {
          type: 'forgot',
          redirect: this.$route.path
        }
      })
    },
    closePopup() {
      this.$emit('close')
    },
    onRemoveAvatarClicked() {
      store.commit('user/SET_STATE', {
        avatar: {}
      })
      const params = {
        token: this.token,
        team_id: this.teamId,
        type: 'avatar',
        update_type: 'delete',
        locale: 'tw'
      }
      userApis.updateAsset({ ...params })
      this.closePopup()
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-verify {
  position: relative;
  width: 425px;
  text-align: left;
  box-sizing: border-box;
  border-radius: 5px;
  box-shadow: 0px 4px 13px rgba(0, 0, 0, 0.25);
  background-color: setColor(white);
  padding: 32px 75px;
  .property-bar:focus-within {
    border: 1px solid setColor(blue-1);
  }
  &__body {
    &-row {
      display: flex;
      justify-content: flex-start;
      width: 87%;
      margin-left: auto;
      margin-top: 15px;
      margin-right: 10px;
      align-items: center;
      &-center {
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    &__hr {
      width: 100%;
      height: 1px;
      background: setColor(gray-4);
      margin-left: auto;
      margin-right: auto;
      margin-top: 20px;
      margin-bottom: 20px;
      padding: 0;
    }
    &__button {
      margin: 0 auto;
      width: 60%;
      padding-top: 30px;
    }
  }
  &__close {
    position: absolute;
    top: 20px;
    right: 20px;
  }
  &__forgot-pwd {
    display: flex;
    justify-content: space-between;
    > button {
      color: setColor(gray-3);
      text-decoration: underline;
      &:hover {
        color: setColor(blue-1);
      }
    }
  }
  &__vcode-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    height: 30px;
    margin-bottom: 0;
  }
  &__btns {
    display: flex;
    justify-content: space-between;
    gap: 10%;
  }
}

.input-invalid {
  border: 1px solid setColor(red) !important;
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
</style>
