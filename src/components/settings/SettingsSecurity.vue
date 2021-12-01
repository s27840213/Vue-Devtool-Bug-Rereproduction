<template lang="pug">
div(class="settings-security")
  div(class="settings-security__content")
    div(class="settings-security__title") 更改密碼
    div(class="settings-security__item")
      span 您上一次密碼更新日期：
      div(class="settings-security__button") 更 改
    div(class="settings-security__divider")
    div(class="settings-security__title") 安全防護
    div(class="settings-security__item")
      span 從所有裝置上登出以結束所有作業階段。
      div(class="settings-security__button") 從 裝 置 上 登 出
    div(class="settings-security__divider")
    div(class="settings-security__title") 刪除帳號
    div(class="settings-security__item")
      span 刪除帳號後，你將無法再存取任何設計或登入 Vivipic。
      div(class="settings-security__button") 刪 除 帳 號
  spinner(v-if="isLoading")
</template>
<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
      isLoading: false
    }
  },
  computed: {
  },
  methods: {
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
    font-size: 14px;
    padding: 20px 0;
  }
  &__button {
    cursor: pointer;
    border-radius: 7px;
    color: setColor(gray-2);
    background-color: setColor(gray-6);
    border: 1px solid setColor(gray-3);
    padding: 8px 30px;
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
}
</style>
