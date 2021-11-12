<template lang="pug">
div(class="settings-account")
  div(class="settings-account__profile")
    div(class="profile-img text-white") {{shortName}}
  div(class="settings-account__button mt-20 mb-50 pointer"
    @click="onConfirmClicked()") 變更照片
  div(class="settings-account__info")
    div(class="settings-account__label my-10") 名稱
    property-bar
      input(class="body-2 text-gray-2"
        v-model="inputName" type="text"
        placeholder="請輸入暱稱")
    div(class="settings-account__label my-10") 信箱
    property-bar
      input(class="body-2 text-gray-2"
        v-model="email" type="text"
        placeholder="請輸入信箱")
    div(class="settings-account__label my-10") 語系
    select(class="locale-select" v-model="inputLocale")
      option(v-for="locale in localeOptions" :value="locale.text") {{locale.text}}
    div(class="settings-account__subscribe mt-40 mb-10")
      div(class="settings-account__subscribe__wrapper"
        @click="onSubscribeClicked()")
        input(type="checkbox"
          v-model="inputSubscribe"
          class="settings-account__subscribe__checkbox")
        div(class="settings-account__subscribe__switch")
        div(class="settings-account__subscribe__circle")
      div(class="settings-account__subscribe__text") {{subscribeText}}
    div(class="settings-account__buttons mt-10")
      btn(class="pointer"
        :disabled="!isChanged"
        @click.native="onConfirmClicked()") 修 改 並 儲 存
  spinner(v-if="isLoading")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapState, mapGetters } from 'vuex'
import store from '@/store'

export default Vue.extend({
  components: {
  },
  data() {
    return {
      inputName: '',
      inputLocale: '',
      inputSubscribe: true,
      email: '',
      subscribeText: '我願意收到來自 Vivipic 的設計技巧、熱門模板、電商趨勢、促銷訊息等電子信。',
      localeOptions: [
        {
          value: 'tw',
          text: '繁體中文(台灣)'
        },
        {
          value: 'us',
          text: '英文'
        },
        {
          value: 'jp',
          text: '日文'
        }],
      isLoading: false
    }
  },
  computed: {
    ...mapState('user', [
      'shortName', 'uname']),
    ...mapGetters('user', {
      token: 'getToken',
      isLogin: 'isLogin',
      account: 'getAccount',
      locale: 'getLocale',
      subscribe: 'getSubscribe'
    }),
    isChanged() {
      if (this.inputName.trim() === this.uname.trim() &&
          this.inputLocale === this.getLocaleText(this.locale) &&
          this.inputSubscribe === (this.subscribe === 1)) {
        return false
      } else {
        return true
      }
    }
  },
  mounted() {
    this.inputName = this.uname
    this.inputLocale = this.getLocaleText(this.locale) as string
    this.inputSubscribe = this.subscribe === 1
  },
  methods: {
    onSubscribeClicked() {
      this.inputSubscribe = !this.inputSubscribe
    },
    async onConfirmClicked() {
      console.log('confirm')
      this.isLoading = true
      const updateValue = {} as any
      updateValue.token = this.token
      if (this.inputName.trim() !== this.uname.trim()) {
        updateValue.uname = this.inputName.trim()
      }
      if (this.inputLocale !== this.getLocaleText(this.locale)) {
        updateValue.locale = this.getLocaleValue(this.inputLocale)
      }
      if (this.inputSubscribe !== (this.subscribe === 1)) {
        updateValue.subscribe = this.inputSubscribe ? 1 : 0
      }
      const data = await store.dispatch('user/updateUser', updateValue)
      if (data.flag === 0) {
        store.commit('user/SET_STATE', {
          uname: data.data.uname,
          locale: data.data.locale,
          subscribe: data.data.subscribe
        })
      }

      this.isLoading = false
    },
    getLocaleText(value: string) {
      return this.localeOptions.find(x => x.value === value)?.text
    },
    getLocaleValue(text: string) {
      return this.localeOptions.find(x => x.text === text)?.value
    }

  }
})
</script>

<style lang="scss" scoped>
.settings-account {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  &__profile {
    display: flex;
    padding-top: 50px;
    .profile-img {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 75px;
      height: 75px;
      font-size: 30px;
      font-weight: 700;
      background: #61aac2;
      border-radius: 50%;
    }
  }
  &__button {
    color: setColor(gray-2);
    border-radius: 5px;
    border: 2px solid setColor(gray-3);
    padding: 5px 20px;
    &:hover {
      background: setColor(gray-5);
    }
  }
  &__info {
    display: flex;
    flex-direction: column;
    text-align: left;
    width: 350px;
    .locale-select {
      width: 100%;
      height: 30px;
      font-size: 14px;
      color: setColor(gray-2);
      border-radius: 3px;
      border: 1px setColor(gray-4) solid;
      padding-left: 8px;
      padding-right: 5px;
    }
  }
  &__label {
    color: setColor(gray-3);
    font-size: 14px;
  }
  &__subscribe {
    display: flex;
    justify-content: space-between;
    &__wrapper {
      border-radius: 10px;
      cursor: pointer;
      height: 20px;
      overflow: hidden;
      position: relative;
      width: 40px;
    }
    &__checkbox {
      display: none;
      box-sizing: border-box;
      padding: 0;
      &:checked~.settings-account__subscribe__switch {
        background-color: setColor(blue-1);
      }
      &:checked~.settings-account__subscribe__circle {
        transform: translateX(20px);
      }
    }
    &__switch {
      background-color: #d6d7d9;
      height: 100%;
      transition: .3s;
      width: 100%;
    }
    &__circle {
      background-color: #fff;
      border-radius: 50%;
      height: 16px;
      left: 2px;
      position: absolute;
      top: 2px;
      transition: .3s;
      width: 16px;
    }
    &__text {
      width: 80%;
      font-size: 15px;
      line-height: 22px;
      font-weight: 400;
    }
  }
  &__buttons {
    display: flex;
    justify-content: end;
    > button {
      color: setColor(white);
      border-radius: 5px;
      background: setColor(blue-1);
      padding: 5px 50px;
      &:disabled {
        background: setColor(gray-4);
      }
    }
  }
}
</style>
