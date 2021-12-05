<template lang="pug">
  div(class="popup-account text-left"
    v-click-outside="closePopup")
    div(class="popup-account__profile")
      avatar(class="mr-10"
        :textSize="14"
        :avatarSize="35")
      div(class="profile-text text-body-2")
        div {{showUname}}
        div(class="text-gray-3 body-3") {{showAccount}}
    div(class="popup-account__hr")
    div(class="popup-account__option"
      @click="goToPage('/settings/account')")
      svg-icon(class="pr-10"
        :iconName="'settings'"
        :iconWidth="'15px'"
        :iconColor="'gray-2'")
      span 帳 號 設 定
    div(class="popup-account__option"
      @click="goToPage('/settings/security')")
      svg-icon(class="pr-10"
        :iconName="'lock'"
        :iconWidth="'15px'"
        :iconColor="'gray-2'")
      span 登 入 與 安 全 性
    div(class="popup-account__hr")
    div(class="popup-account__option"
      @click="onLogoutClicked()")
      svg-icon(class="pr-10"
        :iconName="'logout'"
        :iconWidth="'15px'"
        :iconColor="'gray-2'")
      span 登 出
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import { mapState, mapGetters } from 'vuex'
import Avatar from '@/components/Avatar.vue'

export default Vue.extend({
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    Avatar
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapState('user', [
      'shortName', 'uname']),
    ...mapGetters('user', {
      account: 'getAccount',
      hasAvatar: 'hasAvatar'
    }),
    showUname(): string {
      if (this.uname.length > 10) {
        return this.uname.substring(0, 10).concat('...')
      } else {
        return this.uname
      }
    },
    showAccount(): string {
      if (this.account.length > 25) {
        return this.account.substring(0, 25).concat('...')
      } else {
        return this.account
      }
    }
  },
  methods: {
    goToPage(path: string) {
      if (this.$route.path !== path) {
        this.$router.push({ path: path })
      }
      this.closePopup()
    },
    onLogoutClicked() {
      localStorage.setItem('token', '')
      window.location.href = '/'
    },
    closePopup() {
      this.$emit('close')
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-account {
  padding: 25px 20px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  box-sizing: border-box;
  border-radius: 5px;
  box-shadow: 0px 4px 13px rgba(0, 0, 0, 0.25);
  background-color: setColor(white);
  &__profile {
    display: flex;
    padding-bottom: 10px;
    .profile-img {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      color: white;
      font-size: 18px;
      font-weight: 700;
      background: #61aac2;
      border-radius: 50%;
    }
    .profile-text {
      display: flex;
      text-align: left;
      flex-direction: column;
      justify-content: center;
    }
  }
  &__hr {
    width: 100%;
    height: 1px;
    background: setColor(gray-4);
    margin-left: auto;
    margin-right: auto;
    margin-top: 10px;
    margin-bottom: 10px;
    padding: 0;
  }
  &__option {
    display: flex;
    align-items: center;
    font-size: 14px;
    line-height: 22px;
    font-weight: 400;
    cursor: pointer;
    margin: 6px 0;
    &:hover {
      color: setColor(blue-1);
      > svg {
        color: setColor(blue-1);
      }
    }
  }
}
</style>
