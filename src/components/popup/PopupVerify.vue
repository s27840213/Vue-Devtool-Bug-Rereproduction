<template lang="pug">
  div(class="popup-verify"
    v-click-outside="closePopup")
    div(class="popup-verify__close")
      svg-icon(class="pointer" iconName="page-close"
        :iconWidth="'10px'" iconColor="gray-0"
        @click.native="closePopup()")
    div(class="text-blue-1 heading-5 pb-20 text-center") 驗 證 碼 已 傳 送
    div(class="pb-20")
      span(class="body-2") 請在 10 分鐘內輸入我們傳送到 {{ account }} 的驗證碼。
    div
      property-bar(:class="{'input-invalid': !vcodeValid}")
        input(class="body-2 text-gray-2"
          v-model="vcode" type="text" name="vcode"
          placeholder="請輸入驗證碼")
      div(v-if="!vcodeValid"
        class="invalid-message")
        span {{ vcodeErrorMessage }}
      div(class="my-15")
        btn(:type="'primary-mid'"
          class="btn-shadow full-width"
          @click.native="onEnterCodeDoneClicked()") 完 成
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
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import vClickOutside from 'v-click-outside'
import store from '@/store'

export default Vue.extend({
  props: {
    account: String
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data () {
    return {
      currentPageIndex: 0,
      vcode: '' as string,
      vcodeErrorMessage: '驗證碼錯誤' as string,
      leftTime: 60 as number,
      leftTimeText: '' as string,
      resendAvailable: true as boolean,
      isLoading: false,
      isResetClicked: false as boolean,
      isVcodeClicked: false as boolean
    }
  },
  computed: {
    ...mapGetters('user', {
      token: 'getToken'
    }),
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
    ...mapGetters({
      isLogin: 'user/isLogin'
    }),
    async onResendClicked() {
      this.isLoading = true
      if (this.account.length === 0) {
        this.currentPageIndex = 0
        this.isLoading = false
        return
      }
      this.resendAvailable = false
      this.leftTimeText = this.leftTime + '秒後可以重寄驗證碼'
      const parameter = {
        token: this.token,
        account: this.account,
        register: '0',
        vcode_only: '1',
        type: 1
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
      if (this.account.length === 0) {
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
        token: this.token,
        vcode: this.vcode
      }
      const data = await store.dispatch('user/verifyVcode', parameter)
      this.vcode = ''
      if (data.flag === 0) {
        this.isResetClicked = false
        this.$emit('isVerified')
      } else {
        this.vcodeErrorMessage = data.msg
        console.log(data.msg)
      }
      this.isLoading = false
    },
    closePopup() {
      this.$emit('close')
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
    padding: 32px;
    .property-bar:focus-within {
      border: 1px solid setColor(blue-1);
    }

    &__body {
      &-row {
        display: flex;
        justify-content: start;
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

      &__custom {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        grid-template-rows: auto;
        column-gap: 5px;
        align-items: center;
        width: 85%;
        &__box {
          height: 26px;
          box-sizing: border-box;
          padding: 5px 5px;
          & input {
            line-height: 16px;
            background-color: transparent;
          }
          &.border-blue-1 {
            @extend .border-blue-1;
          }
          &.border-white {
            @extend .border-white;
          }
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
}
</style>
