<template lang="pug">
div(class="settings-security")
  div(class="settings-security__content")
    div(v-if="showUpdatePassword")
      div(class="settings-security__title") 更改密碼
      div(class="settings-security__item")
        span 您上一次密碼更新日期： {{lastUpdateText}}
        div(class="settings-security__button"
          @click="onChangeClicked()") 更 改
      div(class="settings-security__divider")
    //- div(class="settings-security__title") 安全防護
    //- div(class="settings-security__item")
    //-   span 從所有裝置上登出以結束所有作業階段。
    //-   div(class="settings-security__button") 從 裝 置 上 登 出
    //- div(class="settings-security__divider")
    //- div(class="settings-security__title") 刪除帳號
    //- div(class="settings-security__item")
    //-   span 刪除帳號後，你將無法再存取任何設計或登入 Vivipic。
    //-   div(class="settings-security__button") 刪 除 帳 號
  spinner(v-if="isLoading")
  div(v-if="showVerifyPopup"
    class="settings-security__popup-verify")
    popup-verify(type="oldPass"
      :account="account"
      @close="closePopup()")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import PopupVerify from '@/components/popup/PopupVerify.vue'

export default Vue.extend({
  components: {
    PopupVerify
  },
  data() {
    return {
      isLoading: false,
      showUpdatePassword: false,
      showVerifyPopup: false
    }
  },
  computed: {
    ...mapGetters({
      account: 'user/getAccount',
      upassUpdate: 'user/getUpassUpdate'
    }),
    lastUpdateText(): string {
      if (this.upassUpdate === '0000-00-00 00:00:00') {
        return '未曾更新'
      }
      const s = new Date(this.upassUpdate)
      return s.getFullYear() + ' 年 ' + (s.getMonth() + 1) + ' 月 ' + s.getDate() + ' 日'
    }
  },
  mounted() {
    this.showUpdatePassword = this.upassUpdate.length > 0
  },
  methods: {
    onChangeClicked() {
      this.showVerifyPopup = true
    },
    closePopup() {
      this.showVerifyPopup = false
    }
  }
})
</script>

<style lang="scss" scoped>
.settings-security {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
  &__content {
    width: 70%;
    padding-top: 50px;
    padding-left: 30px;
    @media (max-width: 976px) {
      width: 80%;
      padding-left: 0;
    }
  }
  &__title {
    text-align: left;
    font-size: 16px;
    color: setColor(blue-1);
  }
  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    font-size: 14px;
    padding: 20px 0;
    @include layout-mobile {
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      line-height: 22px;
    }
  }
  &__button {
    cursor: pointer;
    border-radius: 7px;
    white-space: nowrap;
    color: setColor(gray-2);
    background-color: setColor(gray-6);
    border: 1px solid setColor(gray-3);
    margin-left: 20px;
    padding: 8px 30px;
    @include layout-mobile {
      width: 100%;
      text-align: center;
      margin-top: 20px;
      margin-left: 0;
      padding: 8px 0;
    }
    &:hover {
      color: setColor(blue-1);
      border: 1px solid setColor(blue-1);
    }
  }
  &__divider {
    width: 100%;
    border-top: 2px solid setColor(gray-4);
    margin-top: 15px;
    padding-bottom: 25px;
  }
  &__popup-verify {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000000a1;
    z-index: 999999;
  }
}
</style>
